import { Router } from 'express';
import {
  getTenants,
  getTenant,
  createTenant,
  updateTenant,
  deleteTenant,
  tenantValidation,
  getMyLease,
  getMyUnit,
} from '../controllers/tenant.controller.js';
import { authenticate, requireRole } from '../middleware/auth.js';
import { validate } from '../middleware/validator.js';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Tenant self-service routes
router.get('/me/lease', requireRole('tenant'), getMyLease);
router.get('/me/unit', requireRole('tenant'), getMyUnit);

// Landlord management routes
router.use(requireRole('landlord'));

router.get('/', getTenants);
router.get('/:id', getTenant);
router.post('/', validate(tenantValidation), createTenant);
router.put('/:id', updateTenant);
router.delete('/:id', deleteTenant);

export default router;
