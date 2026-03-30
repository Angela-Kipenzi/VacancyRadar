import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/auth.js';
import { validate } from '../middleware/validator.js';
import { createPayment, getNextPayment, getPayments, paymentValidation } from '../controllers/payment.controller.js';

const router = Router();

router.use(authenticate, requireRole('tenant'));

router.get('/', getPayments);
router.get('/next', getNextPayment);
router.post('/', validate(paymentValidation), createPayment);

export default router;
