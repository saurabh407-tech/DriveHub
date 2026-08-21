import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import * as bookingService from '../services/booking.service';
import type { BookingStatus } from '../models/Booking.model';

export const createBooking = asyncHandler(async (req: Request, res: Response) => {
  const booking = await bookingService.createBooking({
    customerId: req.user!.id,
    vehicleId: req.body.vehicleId,
    startDate: new Date(req.body.startDate),
    endDate: new Date(req.body.endDate),
    pickupLocation: req.body.pickupLocation,
    dropLocation: req.body.dropLocation,
    couponCode: req.body.couponCode,
    notes: req.body.notes,
  });
  res.status(201).json({
    success: true,
    message: 'Booking created — complete payment to confirm it',
    data: { booking },
  });
});

export const getBooking = asyncHandler(async (req: Request, res: Response) => {
  const booking = await bookingService.getBookingById(req.params.id, req.user!.id, req.user!.role);
  res.status(200).json({ success: true, data: { booking } });
});

export const cancelBooking = asyncHandler(async (req: Request, res: Response) => {
  const booking = await bookingService.cancelBooking({
    bookingId: req.params.id,
    userId: req.user!.id,
    role: req.user!.role,
    reason: req.body.reason,
  });
  res.status(200).json({ success: true, message: 'Booking cancelled', data: { booking } });
});

export const startTrip = asyncHandler(async (req: Request, res: Response) => {
  const booking = await bookingService.startTrip(req.params.id, req.user!.id, req.user!.role);
  res.status(200).json({ success: true, message: 'Trip started', data: { booking } });
});

export const completeTrip = asyncHandler(async (req: Request, res: Response) => {
  const booking = await bookingService.completeTrip(req.params.id, req.user!.id, req.user!.role);
  res.status(200).json({ success: true, message: 'Trip completed', data: { booking } });
});

export const updateTripLocation = asyncHandler(async (req: Request, res: Response) => {
  await bookingService.updateTripLocation(req.params.id, req.user!.id, req.user!.role, req.body.lat, req.body.lng);
  res.status(200).json({ success: true, message: 'Location updated' });
});

export const getTripLocation = asyncHandler(async (req: Request, res: Response) => {
  const tracking = await bookingService.getTripLocation(req.params.id, req.user!.id, req.user!.role);
  res.status(200).json({ success: true, data: { tracking } });
});

export const listMyBookingsAsCustomer = asyncHandler(async (req: Request, res: Response) => {
  const result = await bookingService.listBookings({
    page: parseInt(String(req.query.page || '1'), 10),
    limit: Math.min(parseInt(String(req.query.limit || '20'), 10), 50),
    status: req.query.status as BookingStatus | undefined,
    customerId: req.user!.id,
  });
  res.status(200).json({ success: true, data: result });
});

export const listMyBookingsAsOwner = asyncHandler(async (req: Request, res: Response) => {
  const result = await bookingService.listBookings({
    page: parseInt(String(req.query.page || '1'), 10),
    limit: Math.min(parseInt(String(req.query.limit || '20'), 10), 50),
    status: req.query.status as BookingStatus | undefined,
    ownerId: req.user!.id,
  });
  res.status(200).json({ success: true, data: result });
});

export const listAllBookings = asyncHandler(async (req: Request, res: Response) => {
  const result = await bookingService.listBookings({
    page: parseInt(String(req.query.page || '1'), 10),
    limit: Math.min(parseInt(String(req.query.limit || '20'), 10), 50),
    status: req.query.status as BookingStatus | undefined,
  });
  res.status(200).json({ success: true, data: result });
});
