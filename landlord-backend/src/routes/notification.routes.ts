import { Router } from 'express';
import {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  deleteAllRead,
} from '../controllers/notification.controller.js';
import { authenticate, requireRole } from '../middleware/auth.js';

const router = Router();

// All routes require landlord authentication
router.use(authenticate, requireRole('landlord'));

router.get('/', getNotifications);
router.get('/unread/count', getUnreadCount);
router.patch('/:id/read', markAsRead);
router.patch('/read/all', markAllAsRead);
router.delete('/:id', deleteNotification);
router.delete('/read/all', deleteAllRead);

export default router;
