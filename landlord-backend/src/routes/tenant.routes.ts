import { Router } from 'express';
import {
  getTenants,
  getTenant,
  createTenant,
  updateTenant,
  deleteTenant,
  tenantValidation,
} from '../controllers/tenant.controller.js';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validator.js';

const router = Router();

// All routes require authentication
router.use(authenticate);

router.get('/', getTenants);
router.get('/:id', getTenant);
router.post('/', validate(tenantValidation), createTenant);
router.put('/:id', updateTenant);
router.delete('/:id', deleteTenant);

export default router;
