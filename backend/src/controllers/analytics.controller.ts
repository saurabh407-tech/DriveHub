import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import * as analyticsService from '../services/analytics.service';

export const ownerAnalytics = asyncHandler(async (req: Request, res: Response) => {
  const data = await analyticsService.getOwnerAnalytics(req.user!.id);
  res.status(200).json({ success: true, data });
});

export const adminAnalytics = asyncHandler(async (_req: Request, res: Response) => {
  const data = await analyticsService.getAdminAnalytics();
  res.status(200).json({ success: true, data });
});

export const customerAnalytics = asyncHandler(async (req: Request, res: Response) => {
  const data = await analyticsService.getCustomerAnalytics(req.user!.id);
  res.status(200).json({ success: true, data });
});
