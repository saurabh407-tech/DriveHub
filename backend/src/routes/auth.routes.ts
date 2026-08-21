import { Router } from 'express';
import * as authController from '../controllers/auth.controller';
import { validate } from '../middlewares/validate';
import { authenticate } from '../middlewares/authenticate';
import { authLimiter, otpLimiter } from '../middlewares/rateLimiter';
import {
  registerValidator,
  loginValidator,
  verifyOtpValidator,
  forgotPasswordValidator,
  resetPasswordValidator,
} from '../validators/auth.validator';
import { body } from 'express-validator';

const router = Router();

router.post('/register', authLimiter, registerValidator, validate, authController.register);
router.post('/verify-otp', otpLimiter, verifyOtpValidator, validate, authController.verifyOtp);
router.post(
  '/resend-otp',
  otpLimiter,
  [body('email').trim().isEmail().withMessage('A valid email is required').normalizeEmail()],
  validate,
  authController.resendOtp
);
router.post('/login', authLimiter, loginValidator, validate, authController.login);
router.post('/refresh-token', authController.refresh);
router.post('/logout', authenticate, authController.logout);
router.post(
  '/forgot-password',
  authLimiter,
  forgotPasswordValidator,
  validate,
  authController.forgotPassword
);
router.post('/reset-password', authLimiter, resetPasswordValidator, validate, authController.resetPassword);
router.get('/me', authenticate, authController.getMe);

// Google OAuth is wired in Phase 3 once client credentials + passport
// strategy are added; the route is reserved here so the frontend can
// start building the "Continue with Google" button against a stable path.
router.post('/google', (_req, res) => {
  res.status(501).json({
    success: false,
    message: 'Google OAuth will be available in Phase 3',
  });
});

export default router;
