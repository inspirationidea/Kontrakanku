import prisma from '../config/prisma.js';
import { success, error } from '../utils/response.js';

/**
 * Create a review (only users who completed a booking for that property)
 */
export const createReview = async (req, res, next) => {
  try {
    const { propertyId } = req.params;
    const { rating, comment } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      return error(res, 'Rating harus antara 1 sampai 5', 400);
    }

    // Cek apakah user pernah sewa di properti ini (status ACTIVE atau COMPLETED)
    const eligibleBooking = await prisma.booking.findFirst({
      where: {
        userId: req.user.id,
        status: { in: ['ACTIVE', 'COMPLETED'] },
        unit: { propertyId },
      },
    });

    if (!eligibleBooking) {
      return error(res, 'Anda hanya bisa memberikan ulasan setelah menyelesaikan sewa di properti ini', 403);
    }

    // Cek apakah sudah pernah review
    const existing = await prisma.review.findFirst({
      where: { userId: req.user.id, propertyId },
    });

    if (existing) {
      // Update review yang sudah ada
      const updated = await prisma.review.update({
        where: { id: existing.id },
        data: { rating: parseInt(rating), comment: comment?.trim() || null },
        include: { user: { select: { name: true } } },
      });
      return success(res, updated, 'Ulasan berhasil diperbarui');
    }

    const review = await prisma.review.create({
      data: {
        userId: req.user.id,
        propertyId,
        rating: parseInt(rating),
        comment: comment?.trim() || null,
      },
      include: { user: { select: { name: true } } },
    });

    return success(res, review, 'Ulasan berhasil ditambahkan', 201);
  } catch (err) {
    next(err);
  }
};

/**
 * Get all reviews for a property
 */
export const getPropertyReviews = async (req, res, next) => {
  try {
    const { propertyId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 10, 50);
    const skip = (page - 1) * limit;

    const [reviews, total] = await Promise.all([
      prisma.review.findMany({
        where: { propertyId },
        include: { user: { select: { name: true, profilePhoto: true } } },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip,
      }),
      prisma.review.count({ where: { propertyId } }),
    ]);

    return success(res, { reviews, total, page, pages: Math.ceil(total / limit) }, 'Reviews fetched');
  } catch (err) {
    next(err);
  }
};

/**
 * Delete own review
 */
export const deleteReview = async (req, res, next) => {
  try {
    const { id } = req.params;
    const review = await prisma.review.findUnique({ where: { id } });

    if (!review) return error(res, 'Ulasan tidak ditemukan', 404);
    if (review.userId !== req.user.id && req.user.role === 'USER') {
      return error(res, 'Tidak diizinkan', 403);
    }

    await prisma.review.delete({ where: { id } });
    return success(res, null, 'Ulasan dihapus');
  } catch (err) {
    next(err);
  }
};
