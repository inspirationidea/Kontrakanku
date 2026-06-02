import express from 'express';
import { updateUnit, deleteUnit } from '../controllers/unitController.js';
import { authenticate, authorize } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Admin-only routes
router.put('/:id', authenticate, authorize(['ADMIN', 'SUPERADMIN']), updateUnit);
router.delete('/:id', authenticate, authorize(['ADMIN', 'SUPERADMIN']), deleteUnit);

export default router;
