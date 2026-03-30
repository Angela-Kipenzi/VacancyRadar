import { Router } from 'express';
import multer from 'multer';
import { authenticate, requireRole } from '../middleware/auth.js';
import {
  fileDepositDispute,
  getTenancyOverview,
  sendWelcomeNotification,
  updateCheckIn,
  updateCheckOut,
  updateDepositStatus,
  uploadTenancyPhoto,
} from '../controllers/tenancy.controller.js';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

router.use(authenticate, requireRole('tenant'));

router.get('/overview', getTenancyOverview);
router.post('/check-in', updateCheckIn);
router.post('/check-out', updateCheckOut);
router.post('/check-in/welcome', sendWelcomeNotification);
router.post('/deposit/status', updateDepositStatus);
router.post('/deposit/dispute', fileDepositDispute);
router.post('/photos', upload.single('photo'), uploadTenancyPhoto);

export default router;
