import { body, query } from 'express-validator';

const CATEGORIES = ['hatchback', 'sedan', 'suv', 'bike', 'scooter', 'van', 'luxury'];
const FUEL_TYPES = ['petrol', 'diesel', 'electric', 'hybrid', 'cng'];
const TRANSMISSIONS = ['manual', 'automatic'];

export const createVehicleValidator = [
  body('title').trim().isLength({ min: 3, max: 120 }).withMessage('Title must be 3-120 characters'),
  body('category').isIn(CATEGORIES).withMessage(`Category must be one of: ${CATEGORIES.join(', ')}`),
  body('make').trim().notEmpty().withMessage('Make is required'),
  body('model').trim().notEmpty().withMessage('Model is required'),
  body('year')
    .isInt({ min: 1990, max: new Date().getFullYear() + 1 })
    .withMessage('Enter a valid manufacturing year'),
  body('registrationNumber').trim().notEmpty().withMessage('Registration number is required'),
  body('fuelType').isIn(FUEL_TYPES).withMessage(`Fuel type must be one of: ${FUEL_TYPES.join(', ')}`),
  body('transmission').isIn(TRANSMISSIONS).withMessage('Transmission must be manual or automatic'),
  body('seats').isInt({ min: 1, max: 60 }).withMessage('Enter a valid seat count'),
  body('pricing.perDay').isFloat({ min: 0 }).withMessage('Daily price must be a positive number'),
  body('pricing.securityDeposit')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Security deposit must be a positive number'),
  body('location.address').trim().notEmpty().withMessage('Pickup address is required'),
  body('location.city').trim().notEmpty().withMessage('City is required'),
  body('location.state').trim().notEmpty().withMessage('State is required'),
];

export const updateVehicleValidator = [
  body('title').optional().trim().isLength({ min: 3, max: 120 }),
  body('pricing.perDay').optional().isFloat({ min: 0 }),
  body('seats').optional().isInt({ min: 1, max: 60 }),
];

export const searchVehiclesValidator = [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 50 }),
  query('category').optional().isIn(CATEGORIES),
  query('minPrice').optional().isFloat({ min: 0 }),
  query('maxPrice').optional().isFloat({ min: 0 }),
  query('startDate').optional().isISO8601().withMessage('startDate must be a valid date'),
  query('endDate').optional().isISO8601().withMessage('endDate must be a valid date'),
];

export const availabilityCheckValidator = [
  query('startDate').isISO8601().withMessage('startDate is required and must be a valid date'),
  query('endDate').isISO8601().withMessage('endDate is required and must be a valid date'),
];
