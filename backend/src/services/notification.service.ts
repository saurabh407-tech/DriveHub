import { Notification, INotification, NotificationType } from '../models/Notification.model';
import { User } from '../models/User.model';
import { ApiError } from '../utils/ApiError';
import { emitToUser } from '../socket';

interface CreateNotificationInput {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
}

/**
 * Persists a notification and pushes it over the socket to that user's
 * personal room if they're connected. If they're offline, it's simply
 * waiting for them in the list next time they open the app.
 */
export async function createNotification(input: CreateNotificationInput): Promise<INotification> {
  const notification = await Notification.create({
    user: input.userId,
    type: input.type,
    title: input.title,
    message: input.message,
    link: input.link,
  });
  emitToUser(input.userId, 'notification', notification);
  return notification;
}

export async function listNotifications(userId: string, page: number, limit: number) {
  const [notifications, total, unreadCount] = await Promise.all([
    Notification.find({ user: userId })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    Notification.countDocuments({ user: userId }),
    Notification.countDocuments({ user: userId, isRead: false }),
  ]);

  return {
    notifications,
    unreadCount,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}

export async function markNotificationRead(notificationId: string, userId: string): Promise<void> {
  const result = await Notification.updateOne({ _id: notificationId, user: userId }, { $set: { isRead: true } });
  if (result.matchedCount === 0) throw ApiError.notFound('Notification not found');
}

export async function markAllNotificationsRead(userId: string): Promise<void> {
  await Notification.updateMany({ user: userId, isRead: false }, { $set: { isRead: true } });
}

/** Admin broadcast — fans out one notification to every active user. */
export async function broadcastNotification(title: string, message: string, link?: string): Promise<number> {
  const users = await User.find({ isActive: true, isBanned: false }).select('_id');
  const docs = users.map((u) => ({
    user: u._id,
    type: 'admin_broadcast' as NotificationType,
    title,
    message,
    link,
  }));
  if (docs.length === 0) return 0;

  await Notification.insertMany(docs);
  users.forEach((u) => emitToUser(u.id, 'notification', { type: 'admin_broadcast', title, message, link }));
  return docs.length;
}
