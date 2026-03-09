import { Router } from 'express';
import {
  generateQRCode,
  getQRCodes,
  getQRCode,
  toggleQRCode,
  recordScan,
  deleteQRCode,
} from '../controllers/qrcode.controller.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

// Public route for recording scans
router.post('/scan/:unitId', recordScan);

// Protected routes
router.get('/', authenticate, getQRCodes);
router.get('/:id', authenticate, getQRCode);
router.post('/generate/:unitId', authenticate, generateQRCode);
router.patch('/:id/toggle', authenticate, toggleQRCode);
router.delete('/:id', authenticate, deleteQRCode);

export default router;
