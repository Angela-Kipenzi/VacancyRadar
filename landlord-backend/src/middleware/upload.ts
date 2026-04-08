import multer from 'multer';
import path from 'path';
import { randomUUID } from 'crypto';
import { config } from '../config/index.js';

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, config.upload.directory);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${randomUUID()}${ext}`);
  },
});

const fileFilter = (_req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowed = /^(image|video)\//;
  if (allowed.test(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only image and video files are allowed'));
  }
};

export const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 100 * 1024 * 1024, files: 20 },
});
