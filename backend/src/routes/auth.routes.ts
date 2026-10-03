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

// Diagnostic route to check email provider status on Render
router.get('/test-email', async (req, res) => {
  const to = (req.query.to as string) || 'saurabhshukla8314@gmail.com';
  const brevoKey = (process.env.BREVO_API_KEY || '').trim();
  const resendKey = (process.env.RESEND_API_KEY || '').trim();

  const senderEmail = process.env.BREVO_SENDER_EMAIL || process.env.SMTP_USER || 'sourabhshukla8318@gmail.com';

  const report: Record<string, unknown> = {
    hasBrevoKey: Boolean(brevoKey),
    brevoKeyPrefix: brevoKey ? brevoKey.slice(0, 10) + '...' : null,
    hasResendKey: Boolean(resendKey),
    senderEmail,
    to,
  };

  if (brevoKey) {
    try {
      const brevoRes = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'api-key': brevoKey,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          sender: { name: 'DriveHub', email: senderEmail },
          to: [{ email: to }],
          subject: 'DriveHub Diagnostic Email',
          htmlContent: '<p>Testing Brevo email delivery from DriveHub</p>',
        }),
      });
      const data = await brevoRes.json();
      report.brevoStatus = brevoRes.status;
      report.brevoResponse = data;
    } catch (e: unknown) {
      report.brevoError = (e as Error).message;
    }
  }

  res.json(report);
});

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
