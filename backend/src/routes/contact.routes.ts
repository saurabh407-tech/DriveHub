import { Router } from 'express';
import { body } from 'express-validator';
import { sendContactMessage } from '../controllers/contact.controller';
import { validate } from '../middlewares/validate';

const router = Router();

router.post(
  '/',
  [
    body('name')
      .trim()
      .notEmpty()
      .withMessage('Name is required')
      .isLength({ max: 100 })
      .withMessage('Name cannot exceed 100 characters'),
    body('email')
      .trim()
      .notEmpty()
      .withMessage('Email address is required')
      .isEmail()
      .withMessage('A valid email address is required'),
    body('message')
      .trim()
      .notEmpty()
      .withMessage('Message is required')
      .isLength({ min: 5, max: 3000 })
      .withMessage('Message must be between 5 and 3000 characters'),
  ],
  validate,
  sendContactMessage
);

export default router;
