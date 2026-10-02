import { api } from './api';

export interface OrderResponse {
  payment: { _id: string; razorpayOrderId: string; amount: number; currency: string };
  mode: 'live' | 'mock';
  keyId: string | null;
}

export interface PaymentRecord {
  _id: string;
  amount: number;
  currency: string;
  status: 'created' | 'authorized' | 'captured' | 'failed' | 'refunded' | 'partially_refunded';
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  invoiceNumber?: string;
  invoiceUrl?: string;
  refunds: { amount: number; reason?: string; processedAt: string }[];
}

export async function createOrder(bookingId: string) {
  const res = await api.post('/payments/orders', { bookingId });
  return res.data as { success: boolean; message: string; data: OrderResponse };
}

export async function verifyPayment(payload: {
  razorpayOrderId: string;
  razorpayPaymentId?: string;
  razorpaySignature?: string;
}) {
  const res = await api.post('/payments/verify', payload);
  return res.data as { success: boolean; message: string; data: { payment: PaymentRecord } };
}

export async function getPaymentForBooking(bookingId: string) {
  const res = await api.get(`/payments/booking/${bookingId}`);
  return res.data as { success: boolean; data: { payment: PaymentRecord | null } };
}

export async function downloadInvoicePdf(bookingId: string, download = false): Promise<Blob> {
  const res = await api.get(`/payments/booking/${bookingId}/invoice${download ? '?download=true' : ''}`, {
    responseType: 'blob',
  });
  return res.data;
}

