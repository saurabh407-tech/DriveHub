import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import * as notificationService from '../services/notification.service';

export const listNotifications = asyncHandler(async (req: Request, res: Response) => {
  const page = Math.max(parseInt(String(req.query.page || '1'), 10), 1);
  const limit = Math.min(Math.max(parseInt(String(req.query.limit || '20'), 10), 1), 50);
  const result = await notificationService.listNotifications(req.user!.id, page, limit);
  res.status(200).json({ success: true, data: result });
});

export const markRead = asyncHandler(async (req: Request, res: Response) => {
  await notificationService.markNotificationRead(req.params.id, req.user!.id);
  res.status(200).json({ success: true });
});

export const markAllRead = asyncHandler(async (req: Request, res: Response) => {
  await notificationService.markAllNotificationsRead(req.user!.id);
  res.status(200).json({ success: true });
});

export const broadcast = asyncHandler(async (req: Request, res: Response) => {
  const count = await notificationService.broadcastNotification(req.body.title, req.body.message, req.body.link);
  res.status(201).json({ success: true, message: `Broadcast sent to ${count} users` });
});
