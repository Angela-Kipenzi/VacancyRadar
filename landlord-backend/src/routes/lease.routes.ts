import { Router } from 'express';
import {
  getLeases,
  getLease,
  createLease,
  updateLease,
  terminateLease,
  deleteLease,
  leaseValidation,
} from '../controllers/lease.controller.js';
import { authenticate, requireRole } from '../middleware/auth.js';
import { validate } from '../middleware/validator.js';

const router = Router();

// All routes require landlord authentication
router.use(authenticate, requireRole('landlord'));

router.get('/', getLeases);
router.get('/:id', getLease);
router.post('/', validate(leaseValidation), createLease);
router.put('/:id', updateLease);
router.post('/:id/terminate', terminateLease);
router.delete('/:id', deleteLease);

export default router;
