import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import * as paymentService from '../services/payment.service';

export const createOrder = asyncHandler(async (req: Request, res: Response) => {
  const result = await paymentService.createOrderForBooking(req.body.bookingId, req.user!.id);
  res.status(201).json({
    success: true,
    message:
      result.mode === 'mock'
        ? 'Order created in mock mode — no real payment gateway is configured'
        : 'Order created',
    data: {
      payment: {
        _id: result.payment.id,
        razorpayOrderId: result.payment.razorpayOrderId,
        amount: result.payment.amount,
        currency: result.payment.currency,
      },
      mode: result.mode,
      keyId: result.keyId,
    },
  });
});

export const verifyPayment = asyncHandler(async (req: Request, res: Response) => {
  const payment = await paymentService.verifyAndCapturePayment({
    customerId: req.user!.id,
    razorpayOrderId: req.body.razorpayOrderId,
    razorpayPaymentId: req.body.razorpayPaymentId,
    razorpaySignature: req.body.razorpaySignature,
  });
  res.status(200).json({ success: true, message: 'Payment verified, booking confirmed', data: { payment } });
});

export const getPaymentForBooking = asyncHandler(async (req: Request, res: Response) => {
  const payment = await paymentService.getPaymentForBooking(req.params.bookingId, req.user!.id, req.user!.role);
  res.status(200).json({ success: true, data: { payment } });
});
