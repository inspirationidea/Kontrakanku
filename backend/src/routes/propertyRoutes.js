import express from 'express';
import {
  getProperties,
  getPropertyById,
  createProperty,
  updateProperty,
  deleteProperty,
  uploadPropertyPhotos,
} from '../controllers/propertyController.js';
import { getUnitsByProperty, createUnit } from '../controllers/unitController.js';
import { authenticate, authorize } from '../middlewares/authMiddleware.js';
import { uploadSingle, uploadMultiple } from '../middlewares/upload.js';

const router = express.Router();

// Public routes
router.get('/', getProperties);
router.get('/:id', getPropertyById);
router.get('/:id/units', getUnitsByProperty);

// Admin-only routes
router.post('/', authenticate, authorize(['ADMIN', 'SUPERADMIN']), uploadSingle('coverImage'), createProperty);
router.put('/:id', authenticate, authorize(['ADMIN', 'SUPERADMIN']), uploadSingle('coverImage'), updateProperty);
router.delete('/:id', authenticate, authorize(['ADMIN', 'SUPERADMIN']), deleteProperty);
router.post('/:id/photos', authenticate, authorize(['ADMIN', 'SUPERADMIN']), uploadMultiple('photos', 10), uploadPropertyPhotos);

// Nested routes for properties units creation
router.post('/:id/units', authenticate, authorize(['ADMIN', 'SUPERADMIN']), createUnit);

export default router;
