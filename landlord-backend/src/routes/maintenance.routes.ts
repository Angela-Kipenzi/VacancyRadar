import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/auth.js';
import { validate } from '../middleware/validator.js';
import {
  createMaintenanceRequest,
  getMaintenanceRequests,
  maintenanceValidation,
} from '../controllers/maintenance.controller.js';

const router = Router();

router.use(authenticate, requireRole('tenant'));

router.get('/', getMaintenanceRequests);
router.post('/', validate(maintenanceValidation), createMaintenanceRequest);

export default router;
