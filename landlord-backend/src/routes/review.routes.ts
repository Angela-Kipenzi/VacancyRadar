import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/auth.js';
import { validate } from '../middleware/validator.js';
import {
  createReview,
  deleteReview,
  flagReview,
  getMyReviews,
  getReviews,
  reviewValidation,
  updateReview,
} from '../controllers/review.controller.js';

const router = Router();

// Public/published reviews
router.get('/', getReviews);

// Tenant review actions
router.get('/me', authenticate, requireRole('tenant'), getMyReviews);
router.post('/', authenticate, requireRole('tenant'), validate(reviewValidation), createReview);
router.patch('/:id', authenticate, requireRole('tenant'), updateReview);
router.delete('/:id', authenticate, requireRole('tenant'), deleteReview);
router.post('/:id/flag', authenticate, requireRole('tenant'), flagReview);

export default router;
