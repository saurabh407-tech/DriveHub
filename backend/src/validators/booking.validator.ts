import { body, query } from 'express-validator';

export const createBookingValidator = [
  body('vehicleId').isMongoId().withMessage('A valid vehicleId is required'),
  body('startDate').isISO8601().withMessage('startDate must be a valid date'),
  body('endDate').isISO8601().withMessage('endDate must be a valid date'),
  body('pickupLocation.address').trim().notEmpty().withMessage('Pickup address is required'),
  body('pickupLocation.lat').optional().isFloat({ min: -90, max: 90 }),
  body('pickupLocation.lng').optional().isFloat({ min: -180, max: 180 }),
  body('dropLocation.address').trim().notEmpty().withMessage('Drop address is required'),
  body('dropLocation.lat').optional().isFloat({ min: -90, max: 90 }),
  body('dropLocation.lng').optional().isFloat({ min: -180, max: 180 }),
  body('couponCode').optional().trim().isLength({ min: 3 }),
];

export const cancelBookingValidator = [
  body('reason').optional().trim().isLength({ max: 300 }).withMessage('Reason must be under 300 characters'),
];

export const listBookingsValidator = [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 50 }),
  query('status').optional().isString(),
];

export const updateLocationValidator = [
  body('lat').isFloat({ min: -90, max: 90 }).withMessage('lat must be between -90 and 90'),
  body('lng').isFloat({ min: -180, max: 180 }).withMessage('lng must be between -180 and 180'),
];
