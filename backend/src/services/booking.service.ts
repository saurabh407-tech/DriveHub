import crypto from 'crypto';
import { FilterQuery } from 'mongoose';
import { Booking, IBooking, BookingStatus } from '../models/Booking.model';
import { Vehicle } from '../models/Vehicle.model';
import { Coupon } from '../models/Coupon.model';
import { ApiError } from '../utils/ApiError';
import { createNotification } from './notification.service';
import { calculateDurationDays, calculateBaseAmount, calculateBookingPrice, calculateCouponDiscount, MS_PER_DAY } from '../utils/pricing';
import { calculateRefundAmount } from '../utils/refundPolicy';

function generateBookingCode(): string {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const suffix = crypto.randomBytes(3).toString('hex').toUpperCase();
  return `DH-${date}-${suffix}`;
}

interface CreateBookingInput {
  customerId: string;
  vehicleId: string;
  startDate: Date;
  endDate: Date;
  pickupLocation: { address: string; lat?: number; lng?: number };
  dropLocation: { address: string; lat?: number; lng?: number };
  couponCode?: string;
  notes?: string;
}

async function applyCoupon(code: string | undefined, baseAmount: number, customerId: string) {
  if (!code) return { discountAmount: 0, couponCode: undefined as string | undefined };

  const coupon = await Coupon.findOne({ code: code.toUpperCase(), isActive: true });
  const now = new Date();
  if (!coupon || coupon.validFrom > now || coupon.validUntil < now) {
    throw ApiError.badRequest('This coupon is invalid or has expired');
  }
  if (coupon.minBookingAmount && baseAmount < coupon.minBookingAmount) {
    throw ApiError.badRequest(`This coupon requires a minimum booking amount of ₹${coupon.minBookingAmount}`);
  }
  if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
    throw ApiError.badRequest('This coupon has reached its usage limit');
  }
  if (coupon.usageLimitPerUser) {
    const timesUsedByCustomer = await Booking.countDocuments({
      customer: customerId,
      'pricing.couponCode': coupon.code,
      status: { $nin: ['cancelled_by_customer', 'cancelled_by_owner', 'rejected'] },
    });
    if (timesUsedByCustomer >= coupon.usageLimitPerUser) {
      throw ApiError.badRequest('You have already used this coupon the maximum number of times');
    }
  }

  const discountAmount = calculateCouponDiscount(
    { discountType: coupon.discountType, value: coupon.value, maxDiscountAmount: coupon.maxDiscountAmount },
    baseAmount
  );

  return { discountAmount, couponCode: coupon.code };
}

export async function createBooking(input: CreateBookingInput): Promise<IBooking> {
  if (input.endDate <= input.startDate) {
    throw ApiError.badRequest('endDate must be after startDate');
  }
  if (input.startDate < new Date(Date.now() - MS_PER_DAY)) {
    throw ApiError.badRequest('startDate cannot be in the past');
  }

  const vehicle = await Vehicle.findOne({ _id: input.vehicleId, isDeleted: { $ne: true } });
  if (!vehicle) throw ApiError.notFound('Vehicle not found');
  if (vehicle.status !== 'active') throw ApiError.badRequest('This vehicle is not currently available for booking');
  if (vehicle.owner.toString() === input.customerId) {
    throw ApiError.badRequest('You cannot book your own vehicle');
  }

  const overlaps = vehicle.blockedDates.some(
    (block) => block.from <= input.endDate && block.to >= input.startDate
  );
  if (overlaps) throw ApiError.conflict('This vehicle is not available for the selected dates');

  const days = calculateDurationDays(input.startDate, input.endDate);
  const baseAmount = calculateBaseAmount(
    {
      perDay: vehicle.pricing.perDay,
      weeklyDiscountPercent: vehicle.pricing.weeklyDiscountPercent,
      monthlyDiscountPercent: vehicle.pricing.monthlyDiscountPercent,
    },
    days
  );

  const { discountAmount, couponCode } = await applyCoupon(input.couponCode, baseAmount, input.customerId);
  const priceBreakdown = calculateBookingPrice(baseAmount, discountAmount, vehicle.pricing.securityDeposit);

  const booking = new Booking({
    bookingCode: generateBookingCode(),
    customer: input.customerId,
    vehicle: vehicle._id,
    owner: vehicle.owner,
    startDate: input.startDate,
    endDate: input.endDate,
    pickupLocation: input.pickupLocation,
    dropLocation: input.dropLocation,
    pricing: {
      ...priceBreakdown,
      couponCode,
      currency: vehicle.pricing.currency,
    },
    // Real capture happens in the payment service once the customer pays;
    // the booking starts pending and the slot is held via blockedDates
    // below so nobody else can book the same window in the meantime.
    status: 'pending_payment',
    notes: input.notes,
  });

  await booking.save();

  vehicle.blockedDates.push({
    from: input.startDate,
    to: input.endDate,
    reason: 'booked',
    bookingId: booking._id as any,
  });
  vehicle.totalTrips += 1;
  await vehicle.save();

  if (couponCode) {
    await Coupon.updateOne({ code: couponCode }, { $inc: { usedCount: 1 } });
  }

  return booking;
}

export async function confirmBookingPayment(bookingId: string): Promise<IBooking> {
  const booking = await Booking.findById(bookingId);
  if (!booking) throw ApiError.notFound('Booking not found');
  if (booking.status !== 'pending_payment') return booking; // already confirmed/cancelled — no-op
  booking.status = 'confirmed';
  await booking.save();
  return booking;
}

export async function getBookingById(bookingId: string, userId: string, role: string): Promise<IBooking> {
  const booking = await Booking.findById(bookingId)
    .populate('vehicle', 'title images location category')
    .populate('customer', 'name email phone')
    .populate('owner', 'name email phone');
  if (!booking) throw ApiError.notFound('Booking not found');

  const isParticipant = booking.customer._id.toString() === userId || booking.owner._id.toString() === userId;
  if (!isParticipant && role !== 'admin') throw ApiError.forbidden('You do not have access to this booking');

  return booking;
}

interface CancelInput {
  bookingId: string;
  userId: string;
  role: string;
  reason?: string;
}

export async function cancelBooking({ bookingId, userId, role, reason }: CancelInput): Promise<IBooking> {
  const booking = await Booking.findById(bookingId);
  if (!booking) throw ApiError.notFound('Booking not found');

  const isCustomer = booking.customer.toString() === userId;
  const isOwner = booking.owner.toString() === userId;
  if (!isCustomer && !isOwner && role !== 'admin') {
    throw ApiError.forbidden('You do not have permission to cancel this booking');
  }
  if (['completed', 'cancelled_by_customer', 'cancelled_by_owner', 'rejected'].includes(booking.status)) {
    throw ApiError.badRequest(`Booking is already ${booking.status.replace('_', ' ')}`);
  }

  // Time-based refund policy — see utils/refundPolicy.ts for the exact rules.
  const refundAmount = calculateRefundAmount(booking.pricing.totalAmount, booking.startDate, booking.status === 'ongoing');

  const cancelledByRole: BookingStatus = isOwner && !isCustomer ? 'cancelled_by_owner' : 'cancelled_by_customer';
  booking.status = role === 'admin' && !isCustomer && !isOwner ? 'cancelled_by_owner' : cancelledByRole;
  booking.cancellation = {
    cancelledBy: userId as any,
    reason: reason || 'No reason provided',
    cancelledAt: new Date(),
    refundAmount,
  };
  await booking.save();

  // Release the vehicle's blocked dates for this booking.
  await Vehicle.updateOne(
    { _id: booking.vehicle },
    { $pull: { blockedDates: { bookingId: booking._id } } }
  );

  if (refundAmount > 0) {
    // Lazy import avoids a circular dependency (payment.service never
    // imports booking.service, only the Booking model directly).
    const { refundCapturedPaymentForBooking } = await import('./payment.service');
    await refundCapturedPaymentForBooking(booking.id, refundAmount, `Booking ${booking.bookingCode} cancelled`);
  }

  const otherPartyId = isCustomer ? booking.owner.toString() : booking.customer.toString();
  await createNotification({
    userId: otherPartyId,
    type: 'booking_cancelled',
    title: 'Booking cancelled',
    message: `Booking ${booking.bookingCode} was cancelled${reason ? `: ${reason}` : '.'}`,
    link: `/bookings/${booking.id}`,
  });

  return booking;
}

function assertParticipant(booking: IBooking, userId: string, role: string) {
  const isParticipant = booking.customer.toString() === userId || booking.owner.toString() === userId;
  if (!isParticipant && role !== 'admin') throw ApiError.forbidden('You do not have access to this booking');
}

export async function startTrip(bookingId: string, userId: string, role: string): Promise<IBooking> {
  const booking = await Booking.findById(bookingId);
  if (!booking) throw ApiError.notFound('Booking not found');
  assertParticipant(booking, userId, role);
  if (booking.status !== 'confirmed') {
    throw ApiError.badRequest(`Cannot start a trip from status "${booking.status.replace('_', ' ')}"`);
  }
  booking.status = 'ongoing';
  booking.tripStartedAt = new Date();
  await booking.save();
  return booking;
}

export async function completeTrip(bookingId: string, userId: string, role: string): Promise<IBooking> {
  const booking = await Booking.findById(bookingId);
  if (!booking) throw ApiError.notFound('Booking not found');
  assertParticipant(booking, userId, role);
  if (booking.status !== 'ongoing') {
    throw ApiError.badRequest(`Cannot complete a trip from status "${booking.status.replace('_', ' ')}"`);
  }
  booking.status = 'completed';
  booking.tripCompletedAt = new Date();
  await booking.save();

  await Vehicle.updateOne(
    { _id: booking.vehicle },
    { $pull: { blockedDates: { bookingId: booking._id } } }
  );

  return booking;
}

export async function updateTripLocation(
  bookingId: string,
  userId: string,
  role: string,
  lat: number,
  lng: number
): Promise<void> {
  const booking = await Booking.findById(bookingId);
  if (!booking) throw ApiError.notFound('Booking not found');
  assertParticipant(booking, userId, role);
  if (booking.status !== 'ongoing') {
    throw ApiError.badRequest('Location can only be shared while a trip is ongoing');
  }
  booking.tracking = { lat, lng, updatedBy: userId as any, updatedAt: new Date() };
  await booking.save();
}

export async function getTripLocation(
  bookingId: string,
  userId: string,
  role: string
): Promise<IBooking['tracking'] | null> {
  const booking = await Booking.findById(bookingId).select('tracking customer owner');
  if (!booking) throw ApiError.notFound('Booking not found');
  assertParticipant(booking, userId, role);
  return booking.tracking || null;
}

interface ListBookingsInput {
  page: number;
  limit: number;
  status?: BookingStatus;
  customerId?: string;
  ownerId?: string;
}

export async function listBookings(input: ListBookingsInput) {
  const filter: FilterQuery<IBooking> = {};
  if (input.status) filter.status = input.status;
  if (input.customerId) filter.customer = input.customerId;
  if (input.ownerId) filter.owner = input.ownerId;

  const [bookings, total] = await Promise.all([
    Booking.find(filter)
      .sort({ createdAt: -1 })
      .skip((input.page - 1) * input.limit)
      .limit(input.limit)
      .populate('vehicle', 'title images location')
      .populate('customer', 'name email')
      .populate('owner', 'name email'),
    Booking.countDocuments(filter),
  ]);

  return {
    bookings,
    pagination: { page: input.page, limit: input.limit, total, totalPages: Math.ceil(total / input.limit) },
  };
}
