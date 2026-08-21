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
