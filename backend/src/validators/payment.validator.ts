import { body } from 'express-validator';

export const createOrderValidator = [body('bookingId').isMongoId().withMessage('A valid bookingId is required')];

export const verifyPaymentValidator = [
  body('razorpayOrderId').notEmpty().withMessage('razorpayOrderId is required'),
  body('razorpayPaymentId').optional().isString(),
  body('razorpaySignature').optional().isString(),
];
