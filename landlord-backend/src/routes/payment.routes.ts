import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/auth.js';
import { validate } from '../middleware/validator.js';
import {
  createPayment,
  getMpesaTransactionStatus,
  getNextPayment,
  getPayments,
  handleMpesaCallback,
  initiateMpesaStkPush,
  mpesaStatusValidation,
  mpesaStkPushValidation,
  payPayment,
  payPaymentValidation,
  paymentValidation,
} from '../controllers/payment.controller.js';

const router = Router();

// Public callback endpoint called by Safaricom Daraja.
router.post('/mpesa/callback', handleMpesaCallback);

router.use(authenticate, requireRole('tenant'));

router.get('/', getPayments);
router.get('/next', getNextPayment);
router.post('/mpesa/stk-push', validate(mpesaStkPushValidation), initiateMpesaStkPush);
router.get('/mpesa/status/:transactionId', validate(mpesaStatusValidation), getMpesaTransactionStatus);
router.post('/', validate(paymentValidation), createPayment);
router.patch('/:id/pay', validate(payPaymentValidation), payPayment);

export default router;
