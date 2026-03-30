import { Router } from 'express';
import {
  getApplications,
  getApplication,
  createApplication,
  updateApplicationStatus,
  deleteApplication,
  applicationValidation,
  tenantApplicationValidation,
  getMyApplications,
  getMyApplication,
  createTenantApplication,
  withdrawMyApplication,
} from '../controllers/application.controller.js';
import { authenticate, requireRole } from '../middleware/auth.js';
import { validate } from '../middleware/validator.js';

const router = Router();

// Public route for creating applications
router.post('/', validate(applicationValidation), createApplication);

// Tenant routes
router.get('/me', authenticate, requireRole('tenant'), getMyApplications);
router.get('/me/:id', authenticate, requireRole('tenant'), getMyApplication);
router.post('/me', authenticate, requireRole('tenant'), validate(tenantApplicationValidation), createTenantApplication);
router.patch('/me/:id/withdraw', authenticate, requireRole('tenant'), withdrawMyApplication);

// Landlord routes
router.get('/', authenticate, requireRole('landlord'), getApplications);
router.get('/:id', authenticate, requireRole('landlord'), getApplication);
router.patch('/:id/status', authenticate, requireRole('landlord'), updateApplicationStatus);
router.delete('/:id', authenticate, requireRole('landlord'), deleteApplication);

export default router;
