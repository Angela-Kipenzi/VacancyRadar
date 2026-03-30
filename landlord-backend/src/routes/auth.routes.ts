import { Router } from 'express';
import {
  register,
  login,
  getCurrentUser,
  updateProfile,
  changePassword,
  registerValidation,
  loginValidation,
} from '../controllers/auth.controller.js';
import { authenticate, requireRole } from '../middleware/auth.js';
import { validate } from '../middleware/validator.js';

const router = Router();

// Public routes
router.post('/register', validate(registerValidation), register);
router.post('/login', validate(loginValidation), login);

// Protected routes
router.get('/me', authenticate, getCurrentUser);
router.put('/profile', authenticate, requireRole('landlord'), updateProfile);
router.put('/password', authenticate, requireRole('landlord'), changePassword);

export default router;
