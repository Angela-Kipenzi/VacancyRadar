import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/auth.js';
import { getListing, getListings } from '../controllers/listing.controller.js';

const router = Router();

router.use(authenticate, requireRole('tenant'));

router.get('/', getListings);
router.get('/:id', getListing);

export default router;
