import express from 'express';
import {
  createBooking,
  getBookings,
  getBookingById,
  updateBookingStatus,
  cancelBooking
} from '../controllers/bookingController.js';
import { authenticate, authorize, requireVerification } from '../middlewares/authMiddleware.js';
import { uploadSingle } from '../middlewares/upload.js';

const router = express.Router();

// Authenticated routes for Users/Admins
router.post('/', authenticate, requireVerification, uploadSingle('ktpDocument'), createBooking);
router.get('/', authenticate, getBookings);
router.get('/:id', authenticate, getBookingById);
router.post('/:id/cancel', authenticate, cancelBooking);

// Admin-only route to update status (confirm/reject)
router.patch('/:id/status', authenticate, authorize(['ADMIN', 'SUPERADMIN']), updateBookingStatus);

export default router;
