import { Router } from 'express';
import {
  getUnits,
  getUnit,
  createUnit,
  updateUnit,
  deleteUnit,
  unitValidation,
} from '../controllers/unit.controller.js';
import { authenticate, requireRole } from '../middleware/auth.js';
import { validate } from '../middleware/validator.js';

const router = Router();

// All routes require landlord authentication
router.use(authenticate, requireRole('landlord'));

router.get('/', getUnits);
router.get('/:id', getUnit);
router.post('/', validate(unitValidation), createUnit);
router.put('/:id', updateUnit);
router.delete('/:id', deleteUnit);

export default router;
