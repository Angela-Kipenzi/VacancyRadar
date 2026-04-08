import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { getListing, getListings } from '../controllers/listing.controller.js';

const router = Router();

// All listing routes require a valid auth token (tenant or landlord)
router.use(authenticate);

router.get('/', getListings);
router.get('/:id', getListing);

export default router;
