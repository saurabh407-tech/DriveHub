import { api } from './api';

export type UserRole = 'customer' | 'owner' | 'admin';

export interface AuthUser {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
  isEmailVerified: boolean;
  avatar?: { url: string; publicId: string };
  wallet: { balance: number; currency: string };
  address?: {
    line1?: string;
    city?: string;
    state?: string;
    country?: string;
    pincode?: string;
  };
  bio?: string;
  createdAt: string;
}

interface AuthResponse {
  success: boolean;
  message: string;
  data: { user: AuthUser; accessToken: string };
}

export async function registerRequest(payload: {
  name: string;
  email: string;
  password: string;
  role: 'customer' | 'owner';
  phone?: string;
}) {
  const res = await api.post('/auth/register', payload);
  return res.data as { success: boolean; message: string; data: { user: AuthUser; otpSentTo: string } };
}

export async function verifyOtpRequest(payload: { email: string; otp: string }) {
  const res = await api.post('/auth/verify-otp', payload);
  return res.data as { success: boolean; message: string; data: { user: AuthUser; accessToken: string } };
}

export async function resendOtpRequest(email: string) {
  const res = await api.post('/auth/resend-otp', { email });
  return res.data as { success: boolean; message: string };
}

export async function loginRequest(payload: { email: string; password: string }) {
  const res = await api.post('/auth/login', payload);
  return res.data as AuthResponse;
}

export async function logoutRequest() {
  const res = await api.post('/auth/logout');
  return res.data as { success: boolean; message: string };
}

export async function forgotPasswordRequest(email: string) {
  const res = await api.post('/auth/forgot-password', { email });
  return res.data as { success: boolean; message: string };
}

export async function resetPasswordRequest(payload: {
  email: string;
  token: string;
  password: string;
}) {
  const res = await api.post('/auth/reset-password', payload);
  return res.data as { success: boolean; message: string };
}

export async function getMeRequest() {
  const res = await api.get('/auth/me');
  return res.data as { success: boolean; data: { user: AuthUser } };
}
