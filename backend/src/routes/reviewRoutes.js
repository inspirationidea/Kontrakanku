import express from 'express';
import { createReview, getPropertyReviews, deleteReview } from '../controllers/reviewController.js';
import { authenticate } from '../middlewares/authMiddleware.js';

const router = express.Router({ mergeParams: true }); // untuk akses propertyId dari parent

router.get('/', getPropertyReviews);
router.post('/', authenticate, createReview);
router.delete('/:id', authenticate, deleteReview);

export default router;
