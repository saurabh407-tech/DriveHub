import crypto from 'crypto';
import bcrypt from 'bcryptjs';

/** Generates a 6-digit numeric OTP as a string, e.g. "042913". */
export function generateOtp(): string {
  return crypto.randomInt(0, 1_000_000).toString().padStart(6, '0');
}

/** Generates a URL-safe random token (e.g. for email verification / password reset links). */
export function generateUrlToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

export async function hashValue(value: string): Promise<string> {
  return bcrypt.hash(value, 10);
}

export async function compareHash(value: string, hash?: string): Promise<boolean> {
  if (!hash) return false;
  return bcrypt.compare(value, hash);
}
