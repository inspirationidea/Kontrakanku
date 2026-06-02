import express from 'express';
import { getPaymentAccounts, savePaymentAccounts } from '../controllers/settingsController.js';
import { authenticate, authorize } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Public: anyone can fetch payment accounts (shown on payment page)
router.get('/payment-accounts', getPaymentAccounts);

// Admin only: save payment accounts
router.put('/payment-accounts', authenticate, authorize(['ADMIN', 'SUPERADMIN']), savePaymentAccounts);

export default router;
