import prisma from '../config/prisma.js';
import { success, error } from '../utils/response.js';

/**
 * User: Submit a new complaint
 */
export const createComplaint = async (req, res, next) => {
  try {
    const { unitInfo, subject, description } = req.body;

    if (!unitInfo || !subject || !description) {
      return error(res, 'unitInfo, subject, dan description wajib diisi', 400);
    }

    const photoUrl = req.file ? `/uploads/complaints/${req.file.filename}` : null;

    const complaint = await prisma.complaint.create({
      data: {
        userId: req.user.id,
        unitInfo,
        subject,
        description,
        photoUrl,
        status: 'PENDING',
      },
      include: { user: { select: { name: true, email: true } } },
    });

    // Notify admins (find any admin)
    const admins = await prisma.user.findMany({ where: { role: { in: ['ADMIN', 'SUPERADMIN'] } }, select: { id: true } });
    await prisma.notification.createMany({
      data: admins.map(a => ({
        userId: a.id,
        type: 'INFO',
        title: '📢 Keluhan Baru dari Penyewa',
        body: `${complaint.user.name} mengirimkan keluhan: "${subject}". Silakan tinjau di panel admin.`,
      })),
    });

    return success(res, complaint, 'Keluhan berhasil dikirim');
  } catch (err) {
    next(err);
  }
};

/**
 * User: Get own complaints
 * Admin: Get all complaints
 */
export const getComplaints = async (req, res, next) => {
  try {
    const isAdmin = ['ADMIN', 'SUPERADMIN'].includes(req.user.role);

    const complaints = await prisma.complaint.findMany({
      where: isAdmin ? {} : { userId: req.user.id },
      include: {
        user: { select: { id: true, name: true, email: true, phone: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return success(res, complaints, 'Complaints fetched');
  } catch (err) {
    next(err);
  }
};

/**
 * Admin: Update complaint status + optional note
 */
export const updateComplaintStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, adminNote } = req.body;

    const validStatuses = ['PENDING', 'IN_PROGRESS', 'CLOSED'];
    if (!status || !validStatuses.includes(status)) {
      return error(res, `Status harus salah satu dari: ${validStatuses.join(', ')}`, 400);
    }

    const complaint = await prisma.complaint.findUnique({ where: { id } });
    if (!complaint) return error(res, 'Complaint tidak ditemukan', 404);

    const updated = await prisma.complaint.update({
      where: { id },
      data: { status, ...(adminNote !== undefined ? { adminNote } : {}) },
      include: { user: { select: { name: true } } },
    });

    // Notify user of status change
    const statusMessages = {
      IN_PROGRESS: { title: '🔧 Keluhan Sedang Diproses', body: `Keluhan Anda "${complaint.subject}" sedang ditangani oleh admin.` },
      CLOSED:      { title: '✅ Keluhan Selesai Ditangani', body: `Keluhan Anda "${complaint.subject}" telah selesai diperbaiki.${adminNote ? ` Catatan: ${adminNote}` : ''}` },
      PENDING:     { title: 'Status Keluhan Diperbarui', body: `Keluhan Anda "${complaint.subject}" dikembalikan ke status pending.` },
    };

    const msg = statusMessages[status];
    if (msg) {
      await prisma.notification.create({
        data: { userId: complaint.userId, type: status === 'CLOSED' ? 'INFO' : 'BOOKING', title: msg.title, body: msg.body },
      });
    }

    return success(res, updated, 'Status keluhan diperbarui');
  } catch (err) {
    next(err);
  }
};
