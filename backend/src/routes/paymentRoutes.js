import express from 'express';
import {
  getPaymentsByBooking,
  createPaymentGatewayTransaction,
  confirmManualPayment,
  paymentGatewayWebhook,
  getMonthlyStats,
} from '../controllers/paymentController.js';
import { authenticate, authorize } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Public webhook route (simulates standard third-party webhook bypass)
router.post('/webhook', paymentGatewayWebhook);

// Authenticated routes
router.get('/:bookingId', authenticate, getPaymentsByBooking);
router.post('/create', authenticate, createPaymentGatewayTransaction);

// Admin-only confirm payment transfer
router.post('/:id/confirm', authenticate, authorize(['ADMIN', 'SUPERADMIN']), confirmManualPayment);

// Admin stats
router.get('/stats/monthly', authenticate, authorize(['ADMIN', 'SUPERADMIN']), getMonthlyStats);

export default router;
