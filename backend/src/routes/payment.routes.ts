import { Router } from 'express';
import * as paymentController from '../controllers/payment.controller';
import { authenticate } from '../middlewares/authenticate';
import { authorize } from '../middlewares/authorize';
import { validate } from '../middlewares/validate';
import { createOrderValidator, verifyPaymentValidator } from '../validators/payment.validator';

const router = Router();

router.use(authenticate);

router.post('/orders', authorize('customer'), createOrderValidator, validate, paymentController.createOrder);
router.post('/verify', authorize('customer'), verifyPaymentValidator, validate, paymentController.verifyPayment);
router.get('/booking/:bookingId', paymentController.getPaymentForBooking);

export default router;
