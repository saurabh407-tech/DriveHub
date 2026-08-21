import { Router } from 'express';
import { body } from 'express-validator';
import * as notificationController from '../controllers/notification.controller';
import { authenticate } from '../middlewares/authenticate';
import { authorize } from '../middlewares/authorize';
import { validate } from '../middlewares/validate';

const router = Router();

router.use(authenticate);

router.get('/', notificationController.listNotifications);
router.post('/read-all', notificationController.markAllRead);
router.post('/:id/read', notificationController.markRead);

router.post(
  '/broadcast',
  authorize('admin'),
  [
    body('title').trim().isLength({ min: 1, max: 120 }).withMessage('Title is required'),
    body('message').trim().isLength({ min: 1, max: 500 }).withMessage('Message is required'),
    body('link').optional().isString(),
  ],
  validate,
  notificationController.broadcast
);

export default router;
