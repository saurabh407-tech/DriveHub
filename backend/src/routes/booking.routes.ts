import { Router } from 'express';
import * as bookingController from '../controllers/booking.controller';
import { authenticate } from '../middlewares/authenticate';
import { authorize } from '../middlewares/authorize';
import { validate } from '../middlewares/validate';
import { createBookingValidator, cancelBookingValidator, listBookingsValidator, updateLocationValidator } from '../validators/booking.validator';

const router = Router();

router.use(authenticate); // every booking route requires a logged-in user

router.post('/', authorize('customer'), createBookingValidator, validate, bookingController.createBooking);

router.get('/mine', authorize('customer'), listBookingsValidator, validate, bookingController.listMyBookingsAsCustomer);
router.get('/owner', authorize('owner'), listBookingsValidator, validate, bookingController.listMyBookingsAsOwner);
router.get('/', authorize('admin'), listBookingsValidator, validate, bookingController.listAllBookings);

router.get('/:id', bookingController.getBooking);
router.post('/:id/cancel', cancelBookingValidator, validate, bookingController.cancelBooking);
router.post('/:id/start', bookingController.startTrip);
router.post('/:id/complete', bookingController.completeTrip);
router.post('/:id/location', updateLocationValidator, validate, bookingController.updateTripLocation);
router.get('/:id/location', bookingController.getTripLocation);

export default router;
