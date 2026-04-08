import { Router, Request, Response } from 'express';
import { authenticate, requireRole } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';

const router = Router();

router.use(authenticate, requireRole('landlord'));

router.post('/', upload.array('files', 20), (req: Request, res: Response) => {
  const files = req.files as Express.Multer.File[];
  if (!files || files.length === 0) {
    res.status(400).json({ error: 'No files uploaded' });
    return;
  }

  const urls = files.map((f) => `/uploads/${f.filename}`);
  res.json({ urls });
});

export default router;
