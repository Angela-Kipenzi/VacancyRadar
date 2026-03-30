import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/auth.js';
import { validate } from '../middleware/validator.js';
import { createDocument, documentValidation, getDocuments } from '../controllers/document.controller.js';

const router = Router();

router.use(authenticate, requireRole('tenant'));

router.get('/', getDocuments);
router.post('/', validate(documentValidation), createDocument);

export default router;
