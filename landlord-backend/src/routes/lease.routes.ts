import { Router } from 'express';
import fs from 'fs';
import path from 'path';
import multer from 'multer';
import {
  getLeases,
  getLease,
  createLease,
  updateLease,
  terminateLease,
  deleteLease,
  leaseValidation,
  uploadLeaseDocument,
} from '../controllers/lease.controller.js';
import { authenticate, requireRole } from '../middleware/auth.js';
import { validate } from '../middleware/validator.js';
import { config } from '../config/index.js';

const router = Router();

// All routes require landlord authentication
router.use(authenticate, requireRole('landlord'));

const uploadDir = path.resolve(config.upload.directory, 'leases');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    const safeExt = ext ? ext.toLowerCase() : '';
    cb(null, `lease-${Date.now()}-${Math.round(Math.random() * 1e9)}${safeExt}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: config.upload.maxFileSize },
});

router.get('/', getLeases);
router.get('/:id', getLease);
router.post('/upload', upload.single('file'), uploadLeaseDocument);
router.post('/', validate(leaseValidation), createLease);
router.put('/:id', updateLease);
router.post('/:id/terminate', terminateLease);
router.delete('/:id', deleteLease);

export default router;
