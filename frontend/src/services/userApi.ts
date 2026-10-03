import { api } from './api';
import type { UserRole } from './authApi';

export interface AdminUserRow {
  _id: string;
  name: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  isBanned: boolean;
  banReason?: string;
  createdAt: string;
}

export async function listUsers(params: { page?: number; role?: UserRole } = {}) {
  const res = await api.get('/users', { params });
  return res.data as {
    success: boolean;
    data: { users: AdminUserRow[]; pagination: { page: number; totalPages: number; total: number } };
  };
}

export async function banUser(userId: string, reason?: string) {
  const res = await api.post(`/users/${userId}/ban`, { reason });
  return res.data as { success: boolean; message: string };
}

export async function unbanUser(userId: string) {
  const res = await api.post(`/users/${userId}/unban`);
  return res.data as { success: boolean; message: string };
}

export async function getMyProfile() {
  const res = await api.get('/users/me');
  return res.data as { success: boolean; data: { user: import('./authApi').AuthUser } };
}

export async function updateProfile(payload: {
  name?: string;
  phone?: string;
  bio?: string;
  address?: {
    line1?: string;
    city?: string;
    state?: string;
    country?: string;
    pincode?: string;
  };
}) {
  const res = await api.patch('/users/me', payload);
  return res.data as { success: boolean; message: string; data: { user: import('./authApi').AuthUser } };
}

export async function uploadAvatar(file: File) {
  const formData = new FormData();
  formData.append('avatar', file);
  const res = await api.post('/users/me/avatar', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data as { success: boolean; message: string; data: { user: import('./authApi').AuthUser } };
}

export interface UserStats {
  // Customer stats
  totalRented?: number;
  activeRentals?: number;
  completedRentals?: number;
  totalSpent?: number;
  // Owner stats
  totalVehicles?: number;
  activeVehicles?: number;
  totalBookings?: number;
  totalEarnings?: number;
}

export async function getUserStats() {
  const res = await api.get('/users/me/stats');
  return res.data as { success: boolean; data: UserStats };
}
