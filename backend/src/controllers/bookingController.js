import prisma from '../config/prisma.js';
import { success, error } from '../utils/response.js';

/**
 * Create a new booking
 */
export const createBooking = async (req, res, next) => {
  try {
    const { unitId, startDate, endDate } = req.body;

    if (!unitId || !startDate || !endDate) {
      return error(res, 'Unit ID, start date, and end date are required', 400);
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (start >= end) {
      return error(res, 'End date must be after start date', 400);
    }

    // Verify unit exists and is AVAILABLE
    const unit = await prisma.unit.findUnique({
      where: { id: unitId },
      include: { property: true },
    });

    if (!unit) {
      return error(res, 'Unit not found', 404);
    }

    if (unit.status !== 'AVAILABLE') {
      return error(res, 'Unit ini tidak tersedia (sedang terisi atau dalam perbaikan)', 400);
    }

    // Cek overlapping booking untuk unit yang sama
    const overlapping = await prisma.booking.findFirst({
      where: {
        unitId,
        status: { in: ['PENDING', 'CONFIRMED', 'ACTIVE'] },
        OR: [
          { startDate: { lte: end }, endDate: { gte: start } },
        ],
      },
    });
    if (overlapping) {
      return error(res, 'Unit ini sudah dipesan untuk periode tersebut. Pilih tanggal lain.', 409);
    }

    // Cek apakah user sudah punya booking aktif (maks 1 aktif/confirmed)
    const existingActive = await prisma.booking.findFirst({
      where: {
        userId: req.user.id,
        status: { in: ['ACTIVE', 'CONFIRMED'] },
      },
    });
    if (existingActive) {
      return error(res, 'Anda sudah memiliki sewa aktif. Selesaikan sewa yang berjalan sebelum memesan unit baru.', 400);
    }

    // Handle KTP Document upload if provided specifically for this booking
    let ktpDocPath = null;
    if (req.file) {
      ktpDocPath = `/uploads/ktp/${req.file.filename}`;
    } else {
      // Fallback to user's uploaded KTP on their profile if not uploaded on form
      const userProfile = await prisma.user.findUnique({
        where: { id: req.user.id },
        select: { ktpPhoto: true },
      });
      ktpDocPath = userProfile?.ktpPhoto;
    }

    if (!ktpDocPath) {
      return error(res, 'Please upload your KTP document or make sure your profile KTP is uploaded.', 400);
    }

    // Calculate booking pricing
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    // Rent duration in months (minimum 1 month)
    const durationMonths = Math.max(1, Math.ceil(diffDays / 30));
    const rentTotal = unit.price * durationMonths;
    const totalPrice = rentTotal + unit.deposit;

    // Execute booking and payment invoice creation in a Prisma transaction
    const result = await prisma.$transaction(async (tx) => {
      // 1. Create the booking
      const newBooking = await tx.booking.create({
        data: {
          userId: req.user.id,
          unitId,
          startDate: start,
          endDate: end,
          status: 'PENDING',
          totalPrice,
          ktpDocument: ktpDocPath,
        },
        include: {
          unit: {
            include: { property: true },
          },
        },
      });

      // 2. Set the unit status to OCCUPIED only after CONFIRMED (in update status),
      // for now, we keep it AVAILABLE so others can search until this is confirmed, OR 
      // block it by changing to maintenance/occupied? PRD flow:
      // "Sistem mengecek real-time bahwa unit masih tersedia saat user submit booking"
      // Let's keep it AVAILABLE for now since booking is PENDING confirmation.

      // 3. Create the payment billing invoice (due in 24 hours)
      const dueDate = new Date();
      dueDate.setHours(dueDate.getHours() + 24);

      const newPayment = await tx.payment.create({
        data: {
          bookingId: newBooking.id,
          amount: totalPrice,
          status: 'PENDING',
          dueDate,
        },
      });

      return { booking: newBooking, payment: newPayment };
    });

    // Create system notification for booking
    await prisma.notification.create({
      data: {
        userId: req.user.id,
        type: 'BOOKING',
        title: 'Pemesanan Berhasil Diajukan',
        body: `Pemesanan unit ${result.booking.unit.unitNumber} di ${result.booking.unit.property.name} berhasil diajukan. Status: Menunggu konfirmasi admin.`,
      },
    });

    // Notify the property owner/admin as well
    const adminUser = await prisma.user.findFirst({
      where: { id: result.booking.unit.property.adminId },
    });
    if (adminUser) {
      await prisma.notification.create({
        data: {
          userId: adminUser.id,
          type: 'BOOKING',
          title: 'Pesanan Masuk Baru',
          body: `Penyewa ${req.user.name} mengajukan sewa untuk unit ${result.booking.unit.unitNumber} di properti Anda.`,
        },
      });
    }

    return success(res, result, 'Booking created successfully', 201);
  } catch (err) {
    next(err);
  }
};

/**
 * Retrieve all bookings
 * - Admin: view all bookings of their own properties (or all if Superadmin)
 * - User: view only their own bookings
 */
export const getBookings = async (req, res, next) => {
  try {
    const { status } = req.query;

    let filter = {};
    if (req.user.role === 'USER') {
      filter.userId = req.user.id;
    } else if (req.user.role === 'ADMIN') {
      // Find properties owned by this admin
      filter = {
        unit: {
          property: {
            adminId: req.user.id,
          },
        },
      };
    }

    if (status) {
      filter.status = status;
    }

    const bookings = await prisma.booking.findMany({
      where: filter,
      include: {
        user: { select: { id: true, name: true, email: true, phone: true } },
        unit: { include: { property: true } },
        payments: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    // Auto-cancel CONFIRMED bookings with overdue unpaid payments
    const now = new Date();
    const overdueIds = bookings
      .filter(b => b.status === 'CONFIRMED')
      .filter(b => {
        const pending = b.payments.find(p => p.status === 'PENDING');
        return pending?.dueDate && new Date(pending.dueDate) < now;
      })
      .map(b => b.id);

    if (overdueIds.length > 0) {
      await prisma.$transaction([
        prisma.booking.updateMany({ where: { id: { in: overdueIds } }, data: { status: 'CANCELLED' } }),
        prisma.unit.updateMany({
          where: { bookings: { some: { id: { in: overdueIds } } } },
          data: { status: 'AVAILABLE' },
        }),
      ]);
      // Update in-memory result
      bookings.forEach(b => {
        if (overdueIds.includes(b.id)) b.status = 'CANCELLED';
      });
    }

    return success(res, bookings, 'Bookings retrieved successfully');
  } catch (err) {
    next(err);
  }
};

/**
 * Retrieve a specific booking by ID
 */
export const getBookingById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
        unit: {
          include: {
            property: true,
          },
        },
        payments: true,
      },
    });

    if (!booking) {
      return error(res, 'Booking not found', 404);
    }

    // Auth check: User must own it, Admin must own property, or Superadmin
    const isOwner = booking.userId === req.user.id;
    const isAdminOfProperty = booking.unit.property.adminId === req.user.id;
    const isSuperAdmin = req.user.role === 'SUPERADMIN';

    if (!isOwner && !isAdminOfProperty && !isSuperAdmin) {
      return error(res, 'Access denied. You do not have permission to view this booking.', 403);
    }

    return success(res, booking, 'Booking details retrieved successfully');
  } catch (err) {
    next(err);
  }
};

/**
 * Update Booking Status (Admin only)
 */
export const updateBookingStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, reason } = req.body;

    const bookingStatuses = ['PENDING', 'CONFIRMED', 'ACTIVE', 'COMPLETED', 'CANCELLED'];
    if (!status || !bookingStatuses.includes(status)) {
      return error(res, `Invalid status. Choose from: ${bookingStatuses.join(', ')}`, 400);
    }

    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        unit: {
          include: { property: true },
        },
      },
    });

    if (!booking) {
      return error(res, 'Booking not found', 404);
    }

    // Check ownership/permissions
    if (booking.unit.property.adminId !== req.user.id && req.user.role !== 'SUPERADMIN') {
      return error(res, 'Forbidden. You are not the owner of this property.', 403);
    }

    const updatedBooking = await prisma.$transaction(async (tx) => {
      // 1. Update booking status
      const updated = await tx.booking.update({
        where: { id },
        data: { status },
      });

      // 2. If status is CONFIRMED or ACTIVE, update the Unit status to OCCUPIED
      if (status === 'CONFIRMED' || status === 'ACTIVE') {
        await tx.unit.update({
          where: { id: booking.unitId },
          data: { status: 'OCCUPIED' },
        });
      }

      // 3. If status is CANCELLED or COMPLETED, free up the Unit to AVAILABLE
      if (status === 'CANCELLED' || status === 'COMPLETED') {
        await tx.unit.update({
          where: { id: booking.unitId },
          data: { status: 'AVAILABLE' },
        });
      }

      return updated;
    });

    // Build notification based on status
    const notifMap = {
      CONFIRMED: { type: 'BOOKING', title: '✅ Booking Dikonfirmasi', body: `Pemesanan unit ${booking.unit.unitNumber} di ${booking.unit.property.name} telah dikonfirmasi. Silakan lanjutkan pembayaran.` },
      ACTIVE:    { type: 'BOOKING', title: '🏠 Masa Sewa Aktif',      body: `Pembayaran dikonfirmasi. Masa sewa unit ${booking.unit.unitNumber} kini aktif.` },
      COMPLETED: { type: 'INFO',    title: 'Masa Sewa Selesai',        body: `Masa sewa unit ${booking.unit.unitNumber} telah berakhir. Terima kasih telah menggunakan KontrakanKu!` },
      CANCELLED: {
        type: 'DANGER',
        title: '❌ Booking Ditolak',
        body: reason
          ? `Pemesanan unit ${booking.unit.unitNumber} ditolak oleh admin. Alasan: "${reason}".`
          : `Pemesanan unit ${booking.unit.unitNumber} di ${booking.unit.property.name} telah dibatalkan oleh admin.`,
      },
    };
    const notif = notifMap[status] || { type: 'INFO', title: `Status Booking: ${status}`, body: `Pemesanan Anda diperbarui menjadi ${status}.` };

    await prisma.notification.create({ data: { userId: booking.userId, ...notif } });

    return success(res, updatedBooking, `Booking status updated successfully to ${status}`);
  } catch (err) {
    next(err);
  }
};

/**
 * Cancel booking (User self-cancel before confirmation)
 */
export const cancelBooking = async (req, res, next) => {
  try {
    const { id } = req.params;

    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        unit: {
          include: { property: true },
        },
      },
    });

    if (!booking) {
      return error(res, 'Booking not found', 404);
    }

    // Ensure it belongs to the user
    if (booking.userId !== req.user.id && req.user.role !== 'SUPERADMIN') {
      return error(res, 'You are not authorized to cancel this booking', 403);
    }

    // Can only cancel if status is PENDING or CONFIRMED (but not active yet)
    if (booking.status === 'ACTIVE' || booking.status === 'COMPLETED') {
      return error(res, 'Cannot cancel an active or completed rental agreement.', 400);
    }

    const cancelledBooking = await prisma.$transaction(async (tx) => {
      // Update booking status
      const updated = await tx.booking.update({
        where: { id },
        data: { status: 'CANCELLED' },
      });

      // Free unit status back to AVAILABLE
      await tx.unit.update({
        where: { id: booking.unitId },
        data: { status: 'AVAILABLE' },
      });

      // Mark any pending payments as FAILED or CANCELLED
      await tx.payment.updateMany({
        where: {
          bookingId: id,
          status: 'PENDING',
        },
        data: {
          status: 'FAILED',
        },
      });

      return updated;
    });

    // Create system notification
    await prisma.notification.create({
      data: {
        userId: booking.userId,
        type: 'BOOKING',
        title: 'Booking Dibatalkan',
        body: `Anda telah membatalkan pemesanan unit ${booking.unit.unitNumber} di ${booking.unit.property.name}.`,
      },
    });

    return success(res, cancelledBooking, 'Booking successfully cancelled.');
  } catch (err) {
    next(err);
  }
};
