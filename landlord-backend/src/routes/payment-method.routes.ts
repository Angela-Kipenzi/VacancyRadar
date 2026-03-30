import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/auth.js';
import { validate } from '../middleware/validator.js';
import {
  createPaymentMethod,
  deletePaymentMethod,
  getPaymentMethods,
  paymentMethodValidation,
  setDefaultPaymentMethod,
} from '../controllers/payment-method.controller.js';

const router = Router();

router.use(authenticate, requireRole('tenant'));

router.get('/', getPaymentMethods);
router.post('/', validate(paymentMethodValidation), createPaymentMethod);
router.delete('/:id', deletePaymentMethod);
router.patch('/:id/default', setDefaultPaymentMethod);

export default router;
