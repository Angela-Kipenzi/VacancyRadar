import { Router } from 'express';
import {
  generateQRCode,
  getQRCodes,
  getQRCode,
  toggleQRCode,
  recordScan,
  deleteQRCode,
} from '../controllers/qrcode.controller.js';
import { authenticate, requireRole } from '../middleware/auth.js';

const router = Router();

// Public route for recording scans
router.post('/scan/:unitId', recordScan);

// Protected routes
router.get('/', authenticate, requireRole('landlord'), getQRCodes);
router.get('/:id', authenticate, requireRole('landlord'), getQRCode);
router.post('/generate/:unitId', authenticate, requireRole('landlord'), generateQRCode);
router.patch('/:id/toggle', authenticate, requireRole('landlord'), toggleQRCode);
router.delete('/:id', authenticate, requireRole('landlord'), deleteQRCode);

export default router;
