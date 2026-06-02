import express from 'express';
import { createComplaint, getComplaints, updateComplaintStatus } from '../controllers/complaintController.js';
import { authenticate, authorize } from '../middlewares/authMiddleware.js';
import { uploadSingle } from '../middlewares/upload.js';

const router = express.Router();

router.post('/', authenticate, uploadSingle('complaintPhoto'), createComplaint);
router.get('/', authenticate, getComplaints);
router.patch('/:id/status', authenticate, authorize(['ADMIN', 'SUPERADMIN']), updateComplaintStatus);

export default router;
