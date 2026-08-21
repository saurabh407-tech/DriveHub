import { body } from 'express-validator';

export const startConversationValidator = [body('bookingId').isMongoId().withMessage('A valid bookingId is required')];

export const sendMessageValidator = [
  body('text').trim().isLength({ min: 1, max: 2000 }).withMessage('Message must be 1-2000 characters'),
];
