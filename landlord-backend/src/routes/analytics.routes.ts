import { Router } from 'express';
import {
  getDashboardStats,
  getRevenueAnalytics,
  getOccupancyAnalytics,
  getApplicationAnalytics,
  getQRCodeAnalytics,
  getLeaseExpirationAnalytics,
} from '../controllers/analytics.controller.js';
import { authenticate, requireRole } from '../middleware/auth.js';

const router = Router();

// All routes require landlord authentication
router.use(authenticate, requireRole('landlord'));

router.get('/dashboard', getDashboardStats);
router.get('/revenue', getRevenueAnalytics);
router.get('/occupancy', getOccupancyAnalytics);
router.get('/applications', getApplicationAnalytics);
router.get('/qrcodes', getQRCodeAnalytics);
router.get('/lease-expirations', getLeaseExpirationAnalytics);

export default router;
