import express from 'express';
import { getPaymentAccounts, savePaymentAccounts, getAppVersion, uploadAppVersion } from '../controllers/settingsController.js';
import { authenticate, authorize } from '../middlewares/authMiddleware.js';
import { uploadSingle } from '../middlewares/upload.js';

const router = express.Router();

// Public
router.get('/payment-accounts', getPaymentAccounts);
router.get('/app-version', getAppVersion);

// Admin only
router.put('/payment-accounts', authenticate, authorize(['ADMIN', 'SUPERADMIN']), savePaymentAccounts);
router.post('/app-version', authenticate, authorize(['ADMIN', 'SUPERADMIN']), uploadSingle('appFile'), uploadAppVersion);

export default router;
