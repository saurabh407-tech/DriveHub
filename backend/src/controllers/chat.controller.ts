import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import * as chatService from '../services/chat.service';

export const getOrCreateConversation = asyncHandler(async (req: Request, res: Response) => {
  const conversation = await chatService.getOrCreateConversationForBooking(req.body.bookingId, req.user!.id);
  res.status(200).json({ success: true, data: { conversation } });
});

export const listConversations = asyncHandler(async (req: Request, res: Response) => {
  const conversations = await chatService.listMyConversations(req.user!.id);
  res.status(200).json({ success: true, data: { conversations } });
});

export const listMessages = asyncHandler(async (req: Request, res: Response) => {
  const page = Math.max(parseInt(String(req.query.page || '1'), 10), 1);
  const limit = Math.min(Math.max(parseInt(String(req.query.limit || '30'), 10), 1), 100);
  const result = await chatService.listMessages(req.params.id, req.user!.id, page, limit);
  res.status(200).json({ success: true, data: result });
});

export const sendMessage = asyncHandler(async (req: Request, res: Response) => {
  const message = await chatService.sendMessage(req.params.id, req.user!.id, req.body.text);
  res.status(201).json({ success: true, data: { message } });
});

export const markRead = asyncHandler(async (req: Request, res: Response) => {
  await chatService.markConversationRead(req.params.id, req.user!.id);
  res.status(200).json({ success: true });
});
