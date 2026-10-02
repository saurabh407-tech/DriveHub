import { User, IUser, UserRole } from '../models/User.model';
import { ApiError } from '../utils/ApiError';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../utils/jwt';
import { generateOtp, generateUrlToken, hashValue, compareHash } from '../utils/tokens';
import { sendEmail, otpEmailTemplate, passwordResetEmailTemplate } from './email.service';
import { env } from '../config/env';

const OTP_TTL_MS = 10 * 60 * 1000; // 10 minutes
const RESET_TTL_MS = 30 * 60 * 1000; // 30 minutes

interface RegisterInput {
  name: string;
  email: string;
  password: string;
  role?: UserRole;
  phone?: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

async function issueTokens(user: IUser): Promise<AuthTokens> {
  const accessToken = signAccessToken({ sub: user.id, role: user.role });
  const refreshToken = signRefreshToken({ sub: user.id });
  user.refreshTokenHash = await hashValue(refreshToken);
  await user.save();
  return { accessToken, refreshToken };
}

export async function registerUser(input: RegisterInput): Promise<{ user: IUser; otpSentTo: string }> {
  const existing = await User.findOne({ email: input.email });
  if (existing) throw ApiError.conflict('An account with this email already exists');

  const user = new User({
    name: input.name,
    email: input.email,
    password: input.password,
    role: input.role || 'customer',
    phone: input.phone,
    authProvider: 'local',
  });

  const otp = generateOtp();
  user.otpHash = await hashValue(otp);
  user.otpExpires = new Date(Date.now() + OTP_TTL_MS);
  user.otpPurpose = 'email_verification';

  await user.save();

  await sendEmail({
    to: user.email,
    subject: 'Verify your DriveHub account',
    html: otpEmailTemplate(user.name, otp, 'email verification'),
  });

  return { user, otpSentTo: user.email };
}

export async function verifyEmailOtp(email: string, otp: string): Promise<{ user: IUser; tokens: AuthTokens }> {
  const user = await User.findOne({ email }).select('+otpHash +otpExpires +otpPurpose');
  if (!user) throw ApiError.notFound('No account found with this email');
  if (user.otpPurpose !== 'email_verification') throw ApiError.badRequest('No pending email verification for this account');
  if (!user.otpExpires || user.otpExpires < new Date()) throw ApiError.badRequest('OTP has expired, please request a new one');

  const valid = await compareHash(otp, user.otpHash);
  if (!valid) throw ApiError.badRequest('Invalid OTP');

  user.isEmailVerified = true;
  user.otpHash = undefined;
  user.otpExpires = undefined;
  user.otpPurpose = undefined;
  await user.save();

  const tokens = await issueTokens(user);
  return { user, tokens };
}

export async function resendOtp(email: string, purpose: 'email_verification' | 'phone_verification'): Promise<void> {
  const user = await User.findOne({ email });
  if (!user) throw ApiError.notFound('No account found with this email');
  if (purpose === 'email_verification' && user.isEmailVerified) {
    throw ApiError.badRequest('Email is already verified');
  }

  const otp = generateOtp();
  user.otpHash = await hashValue(otp);
  user.otpExpires = new Date(Date.now() + OTP_TTL_MS);
  user.otpPurpose = purpose;
  await user.save();

  await sendEmail({
    to: user.email,
    subject: 'Your DriveHub verification code',
    html: otpEmailTemplate(user.name, otp, purpose),
  });
}

export async function loginUser(
  email: string,
  password: string
): Promise<{ user: IUser; tokens: AuthTokens }> {
  const user = await User.findOne({ email }).select('+password');
  if (!user || user.authProvider !== 'local') {
    throw ApiError.unauthorized('Invalid email or password');
  }
  if (user.isBanned) throw ApiError.forbidden('This account has been banned');
  if (!user.isActive) throw ApiError.forbidden('This account has been deactivated');

  const valid = await user.comparePassword(password);
  if (!valid) throw ApiError.unauthorized('Invalid email or password');

  user.lastLoginAt = new Date();
  const tokens = await issueTokens(user);

  return { user, tokens };
}

export async function refreshAccessToken(refreshToken: string): Promise<AuthTokens> {
  let payload;
  try {
    payload = verifyRefreshToken(refreshToken);
  } catch {
    throw ApiError.unauthorized('Invalid or expired refresh token');
  }

  const user = await User.findById(payload.sub).select('+refreshTokenHash');
  if (!user || !user.refreshTokenHash) throw ApiError.unauthorized('Session no longer valid');

  const matches = await compareHash(refreshToken, user.refreshTokenHash);
  if (!matches) {
    // Possible token reuse/theft — revoke the session defensively.
    user.refreshTokenHash = undefined;
    await user.save();
    throw ApiError.unauthorized('Session invalidated, please log in again');
  }

  return issueTokens(user);
}

export async function logoutUser(userId: string): Promise<void> {
  await User.findByIdAndUpdate(userId, { $unset: { refreshTokenHash: 1 } });
}

export async function requestPasswordReset(email: string): Promise<void> {
  const user = await User.findOne({ email });
  if (!user) return; // don't reveal account existence

  const token = generateUrlToken();
  user.passwordResetTokenHash = await hashValue(token);
  user.passwordResetExpires = new Date(Date.now() + RESET_TTL_MS);
  await user.save();

  const resetUrl = `${env.clientUrl}/reset-password?token=${token}&email=${encodeURIComponent(email)}`;

  await sendEmail({
    to: user.email,
    subject: 'Reset your DriveHub password',
    html: passwordResetEmailTemplate(user.name, resetUrl),
  });
}

export async function resetPassword(email: string, token: string, newPassword: string): Promise<void> {
  const user = await User.findOne({ email }).select('+passwordResetTokenHash +passwordResetExpires');
  if (!user || !user.passwordResetTokenHash || !user.passwordResetExpires) {
    throw ApiError.badRequest('Invalid or expired reset link');
  }
  if (user.passwordResetExpires < new Date()) {
    throw ApiError.badRequest('Reset link has expired, please request a new one');
  }
  const valid = await compareHash(token, user.passwordResetTokenHash);
  if (!valid) throw ApiError.badRequest('Invalid or expired reset link');

  user.password = newPassword;
  user.passwordResetTokenHash = undefined;
  user.passwordResetExpires = undefined;
  user.refreshTokenHash = undefined; // force re-login on all devices
  await user.save();
}
