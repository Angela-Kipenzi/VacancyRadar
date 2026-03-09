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
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validator.js';

const router = Router();

// All routes require authentication
router.use(authenticate);

router.get('/', getLeases);
router.get('/:id', getLease);
router.post('/', validate(leaseValidation), createLease);
router.put('/:id', updateLease);
router.post('/:id/terminate', terminateLease);
router.delete('/:id', deleteLease);

export default router;
