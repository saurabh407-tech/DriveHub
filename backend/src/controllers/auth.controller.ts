import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import * as authService from '../services/auth.service';
import { User } from '../models/User.model';
import { ApiError } from '../utils/ApiError';
import { env } from '../config/env';

const REFRESH_COOKIE_NAME = 'drivehub_refresh_token';

function setRefreshCookie(res: Response, token: string) {
  res.cookie(REFRESH_COOKIE_NAME, token, {
    httpOnly: true,
    secure: env.isProd,
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    path: '/api/v1/auth',
  });
}

export const register = asyncHandler(async (req: Request, res: Response) => {
  const { user, otpSentTo } = await authService.registerUser(req.body);
  res.status(201).json({
    success: true,
    message: 'Account created. Please verify your email with the OTP we sent you.',
    data: { user, otpSentTo },
  });
});

export const verifyOtp = asyncHandler(async (req: Request, res: Response) => {
  const { email, otp } = req.body;
  const { user, tokens } = await authService.verifyEmailOtp(email, otp);
  setRefreshCookie(res, tokens.refreshToken);
  res.status(200).json({
    success: true,
    message: 'Email verified successfully. Logged in.',
    data: { user, accessToken: tokens.accessToken },
  });
});

export const resendOtp = asyncHandler(async (req: Request, res: Response) => {
  const { email } = req.body;
  await authService.resendOtp(email, 'email_verification');
  res.status(200).json({ success: true, message: 'A new OTP has been sent to your email.' });
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;
  const { user, tokens } = await authService.loginUser(email, password);
  setRefreshCookie(res, tokens.refreshToken);
  res.status(200).json({
    success: true,
    message: 'Logged in successfully',
    data: { user, accessToken: tokens.accessToken },
  });
});

export const refresh = asyncHandler(async (req: Request, res: Response) => {
  const token = req.cookies?.[REFRESH_COOKIE_NAME];
  if (!token) throw ApiError.unauthorized('No refresh token provided');

  const tokens = await authService.refreshAccessToken(token);
  setRefreshCookie(res, tokens.refreshToken);
  res.status(200).json({
    success: true,
    message: 'Token refreshed',
    data: { accessToken: tokens.accessToken },
  });
});

export const logout = asyncHandler(async (req: Request, res: Response) => {
  if (req.user) await authService.logoutUser(req.user.id);
  res.clearCookie(REFRESH_COOKIE_NAME, { path: '/api/v1/auth' });
  res.status(200).json({ success: true, message: 'Logged out successfully' });
});

export const forgotPassword = asyncHandler(async (req: Request, res: Response) => {
  await authService.requestPasswordReset(req.body.email);
  // Always the same response, whether or not the account exists — avoids user enumeration.
  res.status(200).json({
    success: true,
    message: 'If an account exists with this email, a password reset link has been sent.',
  });
});

export const resetPassword = asyncHandler(async (req: Request, res: Response) => {
  const { email, token, password } = req.body;
  await authService.resetPassword(email, token, password);
  res.status(200).json({ success: true, message: 'Password reset successfully. Please log in.' });
});

export const getMe = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unauthorized();
  const user = await User.findById(req.user.id);
  if (!user) throw ApiError.notFound('User not found');
  res.status(200).json({ success: true, data: { user } });
});
