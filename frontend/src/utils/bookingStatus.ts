import type { BookingStatus } from '@/services/bookingApi';

export const BOOKING_STATUS_TONE: Record<BookingStatus, 'neutral' | 'success' | 'warning' | 'danger'> = {
  pending_payment: 'warning',
  confirmed: 'success',
  ongoing: 'success',
  completed: 'neutral',
  cancelled_by_customer: 'danger',
  cancelled_by_owner: 'danger',
  rejected: 'danger',
};

export const BOOKING_STATUS_LABEL: Record<BookingStatus, string> = {
  pending_payment: 'Pending payment',
  confirmed: 'Confirmed',
  ongoing: 'Ongoing',
  completed: 'Completed',
  cancelled_by_customer: 'Cancelled by you',
  cancelled_by_owner: 'Cancelled by owner',
  rejected: 'Rejected',
};
