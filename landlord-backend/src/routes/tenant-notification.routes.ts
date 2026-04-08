import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/auth.js';
import {
  getTenantNotifications,
  markTenantNotificationRead,
} from '../controllers/tenant-notification.controller.js';

const router = Router();

router.use(authenticate, requireRole('tenant'));

router.get('/', getTenantNotifications);
router.patch('/:id/read', markTenantNotificationRead);

export default router;
