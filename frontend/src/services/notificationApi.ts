import { api } from './api';

export interface NotificationItem {
  _id: string;
  type: string;
  title: string;
  message: string;
  link?: string;
  isRead: boolean;
  createdAt: string;
}

export async function listNotifications(page = 1) {
  const res = await api.get('/notifications', { params: { page, limit: 20 } });
  return res.data as {
    success: boolean;
    data: { notifications: NotificationItem[]; unreadCount: number };
  };
}

export async function markNotificationRead(id: string) {
  await api.post(`/notifications/${id}/read`);
}

export async function markAllNotificationsRead() {
  await api.post('/notifications/read-all');
}

export async function broadcastNotification(title: string, message: string, link?: string) {
  const res = await api.post('/notifications/broadcast', { title, message, link });
  return res.data as { success: boolean; message: string };
}
