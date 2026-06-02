import express from 'express';
import rateLimit from 'express-rate-limit';
import {
  register,
  login,
  getMe,
  uploadKtp,
  verifyUserKtp,
  getAllUsers,
  adminCreateUser,
  getNotifications,
  markNotificationRead,
  changePassword,
  forgotPassword,
  resetPasswordOTP,
  updateProfile,
  uploadAvatar,
  getAllAdmins,
  createAdmin,
  getGlobalStats,
} from '../controllers/authController.js';
import { authenticate, authorize } from '../middlewares/authMiddleware.js';
import { uploadSingle } from '../middlewares/upload.js';

const router = express.Router();

// Rate limiting
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 menit
  max: 20,
  message: { success: false, message: 'Terlalu banyak percobaan. Coba lagi dalam 15 menit.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const otpLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 jam
  max: 5,
  message: { success: false, message: 'Terlalu banyak permintaan OTP. Coba lagi dalam 1 jam.' },
});

// Public routes
router.post('/register', authLimiter, register);
router.post('/login', authLimiter, login);
router.post('/forgot-password', otpLimiter, forgotPassword);
router.post('/reset-password', otpLimiter, resetPasswordOTP);

// Authenticated routes
router.get('/me', authenticate, getMe);
router.post('/upload-ktp', authenticate, uploadSingle('ktpPhoto'), uploadKtp);
router.put('/profile', authenticate, updateProfile);
router.post('/upload-avatar', authenticate, uploadSingle('avatar'), uploadAvatar);
router.put('/change-password', authenticate, changePassword);
router.get('/notifications', authenticate, getNotifications);
router.patch('/notifications/:id/read', authenticate, markNotificationRead);

// Admin-only routes
router.get('/users', authenticate, authorize(['ADMIN', 'SUPERADMIN']), getAllUsers);
router.post('/users', authenticate, authorize(['ADMIN', 'SUPERADMIN']), uploadSingle('ktpPhoto'), adminCreateUser);

// SuperAdmin-only routes
router.get('/admins', authenticate, authorize(['SUPERADMIN']), getAllAdmins);
router.post('/admins', authenticate, authorize(['SUPERADMIN']), createAdmin);
router.get('/global-stats', authenticate, authorize(['SUPERADMIN']), getGlobalStats);
router.post('/verify/:userId', authenticate, authorize(['ADMIN', 'SUPERADMIN']), verifyUserKtp);

export default router;
