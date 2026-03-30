import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/auth.js';
import { validate } from '../middleware/validator.js';
import {
  createPaymentTransaction,
  getPaymentTransactions,
  paymentTransactionValidation,
} from '../controllers/payment-transaction.controller.js';

const router = Router();

router.use(authenticate, requireRole('tenant'));

router.get('/', getPaymentTransactions);
router.post('/', validate(paymentTransactionValidation), createPaymentTransaction);

export default router;
