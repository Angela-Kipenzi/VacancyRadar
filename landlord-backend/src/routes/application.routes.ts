import { Router } from 'express';
import {
  getApplications,
  getApplication,
  createApplication,
  updateApplicationStatus,
  deleteApplication,
  applicationValidation,
} from '../controllers/application.controller.js';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validator.js';

const router = Router();

// Public route for creating applications
router.post('/', validate(applicationValidation), createApplication);

// Protected routes
router.get('/', authenticate, getApplications);
router.get('/:id', authenticate, getApplication);
router.patch('/:id/status', authenticate, updateApplicationStatus);
router.delete('/:id', authenticate, deleteApplication);

export default router;
