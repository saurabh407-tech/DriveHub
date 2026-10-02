import Razorpay from 'razorpay';
import crypto from 'crypto';
import { env } from '../config/env';
import { logger } from '../utils/logger';
import { ApiError } from '../utils/ApiError';
import { Payment, IPayment } from '../models/Payment.model';
import { Booking } from '../models/Booking.model';
import { User } from '../models/User.model';
import { Vehicle } from '../models/Vehicle.model';
import { confirmBookingPayment } from './booking.service';
import { generateInvoicePdf } from './invoice.service';
import { uploadBuffer } from './upload.service';
import { createNotification } from './notification.service';
import { sendEmail, ADMIN_NOTIFICATION_EMAIL, paymentReceivedAdminEmailTemplate } from './email.service';

let cachedClient: Razorpay | null = null;
let cachedKeyId: string | null = null;

export function getRazorpayClient(): { client: Razorpay | null; isConfigured: boolean } {
  const isConfigured = !!(env.razorpay.keyId && env.razorpay.keySecret);
  if (!isConfigured) return { client: null, isConfigured: false };
  if (!cachedClient || cachedKeyId !== env.razorpay.keyId) {
    cachedClient = new Razorpay({
      key_id: env.razorpay.keyId,
      key_secret: env.razorpay.keySecret,
    });
    cachedKeyId = env.razorpay.keyId;
  }
  return { client: cachedClient, isConfigured: true };
}

const MOCK_ORDER_PREFIX = 'order_mock_';
const MOCK_PAYMENT_PREFIX = 'pay_mock_';

function isMockOrder(orderId: string): boolean {
  return orderId.startsWith(MOCK_ORDER_PREFIX);
}

interface CreateOrderResult {
  payment: IPayment;
  mode: 'live' | 'mock';
  keyId: string | null;
}

export async function createOrderForBooking(bookingId: string, customerId: string): Promise<CreateOrderResult> {
  const booking = await Booking.findById(bookingId);
  if (!booking) throw ApiError.notFound('Booking not found');
  if (booking.customer.toString() !== customerId) throw ApiError.forbidden('This is not your booking');
  if (booking.status !== 'pending_payment') {
    throw ApiError.badRequest(`Booking is ${booking.status.replace('_', ' ')} and cannot be paid for again`);
  }

  const existing = await Payment.findOne({ booking: booking._id, status: { $in: ['created', 'captured'] } });
  if (existing?.status === 'captured') {
    throw ApiError.badRequest('This booking has already been paid for');
  }

  const amountInPaise = Math.round(booking.pricing.totalAmount * 100);

  const { client: razorpay, isConfigured: isRazorpayConfigured } = getRazorpayClient();
  let razorpayOrderId: string;
  if (isRazorpayConfigured && razorpay) {
    const order = await razorpay.orders.create({
      amount: amountInPaise,
      currency: booking.pricing.currency,
      receipt: booking.bookingCode,
    });
    razorpayOrderId = order.id;
  } else {
    razorpayOrderId = `${MOCK_ORDER_PREFIX}${crypto.randomBytes(8).toString('hex')}`;
  }

  const payment =
    existing ||
    new Payment({
      booking: booking._id,
      customer: customerId,
      amount: booking.pricing.totalAmount,
      currency: booking.pricing.currency,
      status: 'created',
    });
  payment.razorpayOrderId = razorpayOrderId;
  await payment.save();

  return { payment, mode: isRazorpayConfigured ? 'live' : 'mock', keyId: isRazorpayConfigured ? env.razorpay.keyId : null };
}

interface VerifyPaymentInput {
  customerId: string;
  razorpayOrderId: string;
  razorpayPaymentId?: string;
  razorpaySignature?: string;
}

export async function verifyAndCapturePayment(input: VerifyPaymentInput): Promise<IPayment> {
  const payment = await Payment.findOne({ razorpayOrderId: input.razorpayOrderId }).select('+razorpaySignature');
  if (!payment) throw ApiError.notFound('Payment record not found for this order');
  if (payment.customer.toString() !== input.customerId) throw ApiError.forbidden('This is not your payment');
  if (payment.status === 'captured') return payment; // idempotent — already confirmed

  const mock = isMockOrder(input.razorpayOrderId);

  if (mock) {
    payment.razorpayPaymentId = input.razorpayPaymentId || `${MOCK_PAYMENT_PREFIX}${crypto.randomBytes(8).toString('hex')}`;
  } else {
    if (!input.razorpayPaymentId || !input.razorpaySignature) {
      throw ApiError.badRequest('Missing Razorpay payment confirmation fields');
    }
    const expectedSignature = crypto
      .createHmac('sha256', env.razorpay.keySecret)
      .update(`${input.razorpayOrderId}|${input.razorpayPaymentId}`)
      .digest('hex');
    if (expectedSignature !== input.razorpaySignature) {
      payment.status = 'failed';
      await payment.save();
      throw ApiError.badRequest('Payment verification failed — signature mismatch');
    }
    payment.razorpayPaymentId = input.razorpayPaymentId;
    payment.razorpaySignature = input.razorpaySignature;
  }

  payment.status = 'captured';
  await payment.save();

  const booking = await confirmBookingPayment(payment.booking.toString());

  await Promise.all([
    createNotification({
      userId: booking.customer.toString(),
      type: 'payment_received',
      title: 'Payment confirmed',
      message: `Your payment for booking ${booking.bookingCode} was received and the booking is confirmed.`,
      link: `/bookings/${booking.id}`,
    }),
    createNotification({
      userId: booking.owner.toString(),
      type: 'booking_confirmed',
      title: 'New confirmed booking',
      message: `Booking ${booking.bookingCode} is confirmed and paid.`,
      link: `/bookings/${booking.id}`,
    }),
  ]);

  // Generate and attach the invoice — a failure here shouldn't fail the
  // payment itself, since the money has already been captured.
  try {
    const [customer, vehicle] = await Promise.all([
      User.findById(payment.customer).select('name email'),
      Vehicle.findById(booking.vehicle).select('title'),
    ]);

    // Notify admin about confirmed payment
    sendEmail({
      to: ADMIN_NOTIFICATION_EMAIL,
      subject: `💰 [DriveHub Payment] Payment Confirmed: ₹${payment.amount} (Booking ${booking.bookingCode})`,
      html: paymentReceivedAdminEmailTemplate({
        payment,
        booking,
        vehicle,
        customer,
      }),
    }).catch((err) => logger.error('Failed to send admin payment notification email', err));

    const invoiceNumber = `INV-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${crypto
      .randomBytes(3)
      .toString('hex')
      .toUpperCase()}`;
    const pdfBuffer = await generateInvoicePdf({
      invoiceNumber,
      booking,
      payment,
      customerName: customer?.name || 'Customer',
      customerEmail: customer?.email || '',
      vehicleTitle: vehicle?.title || 'Vehicle',
    });
    const uploaded = await uploadBuffer(pdfBuffer, 'invoices', `${invoiceNumber}.pdf`);
    payment.invoiceNumber = invoiceNumber;
    payment.invoiceUrl = uploaded.url;
    await payment.save();
  } catch (err) {
    logger.error('Invoice generation failed after successful payment capture', err);
  }

  return payment;
}

export async function refundCapturedPaymentForBooking(
  bookingId: string,
  refundAmount: number,
  reason: string
): Promise<void> {
  const payment = await Payment.findOne({ booking: bookingId, status: { $in: ['captured', 'partially_refunded'] } });
  if (!payment) return; // nothing was ever captured — nothing to refund

  const alreadyRefunded = payment.refunds.reduce((sum, r) => sum + r.amount, 0);
  const cappedRefund = Math.min(refundAmount, payment.amount - alreadyRefunded);
  if (cappedRefund <= 0) return;

  const { client: razorpay, isConfigured: isRazorpayConfigured } = getRazorpayClient();
  let razorpayRefundId: string | undefined;
  if (isRazorpayConfigured && razorpay && payment.razorpayPaymentId && !payment.razorpayPaymentId.startsWith(MOCK_PAYMENT_PREFIX)) {
    const refund = await razorpay.payments.refund(payment.razorpayPaymentId, {
      amount: Math.round(cappedRefund * 100),
    });
    razorpayRefundId = refund.id;
  } else {
    razorpayRefundId = `refund_mock_${crypto.randomBytes(6).toString('hex')}`;
  }

  payment.refunds.push({ razorpayRefundId, amount: cappedRefund, reason, processedAt: new Date() });
  const totalRefunded = alreadyRefunded + cappedRefund;
  payment.status = totalRefunded >= payment.amount ? 'refunded' : 'partially_refunded';
  await payment.save();
}

export async function getPaymentForBooking(bookingId: string, userId: string, role: string): Promise<IPayment | null> {
  const booking = await Booking.findById(bookingId);
  if (!booking) throw ApiError.notFound('Booking not found');
  const isParticipant =
    booking.customer?.toString() === userId ||
    (booking.owner && booking.owner.toString() === userId);
  if (!isParticipant && role !== 'admin') throw ApiError.forbidden('You do not have access to this payment');

  const payment = await Payment.findOne({ booking: bookingId }).sort({ createdAt: -1 });
  if (payment && payment.status === 'captured') {
    // Ensure invoice URL points to our reliable backend PDF route
    payment.invoiceUrl = `${env.serverUrl}/api/v1/payments/booking/${bookingId}/invoice`;
  }
  return payment;
}

export async function getInvoicePdfForBooking(
  bookingId: string,
  userId?: string,
  role?: string
): Promise<{ filename: string; pdfBuffer: Buffer }> {
  const booking = await Booking.findById(bookingId);
  if (!booking) throw ApiError.notFound('Booking not found');

  if (userId && role !== 'admin') {
    const isParticipant =
      booking.customer?.toString() === userId ||
      (booking.owner && booking.owner.toString() === userId);
    if (!isParticipant) throw ApiError.forbidden('You do not have access to this invoice');
  }

  const payment = await Payment.findOne({
    booking: booking._id,
    status: { $in: ['captured', 'refunded', 'partially_refunded'] },
  });
  if (!payment) throw ApiError.notFound('No confirmed payment found for this booking');

  const [customer, vehicle] = await Promise.all([
    User.findById(payment.customer).select('name email'),
    Vehicle.findById(booking.vehicle).select('title'),
  ]);

  const invoiceNumber =
    payment.invoiceNumber ||
    `INV-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${crypto
      .randomBytes(3)
      .toString('hex')
      .toUpperCase()}`;

  if (!payment.invoiceNumber) {
    payment.invoiceNumber = invoiceNumber;
    payment.invoiceUrl = `${env.serverUrl}/api/v1/payments/booking/${bookingId}/invoice`;
    await payment.save();
  }

  const pdfBuffer = await generateInvoicePdf({
    invoiceNumber,
    booking,
    payment,
    customerName: customer?.name || 'Customer',
    customerEmail: customer?.email || '',
    vehicleTitle: vehicle?.title || 'Vehicle',
  });

  return {
    filename: `DriveHub-Invoice-${booking.bookingCode}.pdf`,
    pdfBuffer,
  };
}

