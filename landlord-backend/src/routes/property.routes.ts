import { Router } from 'express';
import {
  getProperties,
  getProperty,
  createProperty,
  updateProperty,
  deleteProperty,
  propertyValidation,
} from '../controllers/property.controller.js';
import { authenticate, requireRole } from '../middleware/auth.js';
import { validate } from '../middleware/validator.js';

const router = Router();

// All routes require landlord authentication
router.use(authenticate, requireRole('landlord'));

router.get('/', getProperties);
router.get('/:id', getProperty);
router.post('/', validate(propertyValidation), createProperty);
router.put('/:id', updateProperty);
router.delete('/:id', deleteProperty);

export default router;
