import { describe, it, expect } from 'vitest';
import { BOOKING_STATUS_TONE, BOOKING_STATUS_LABEL } from '@/utils/bookingStatus';
import type { BookingStatus } from '@/services/bookingApi';

const ALL_STATUSES: BookingStatus[] = [
  'pending_payment',
  'confirmed',
  'ongoing',
  'completed',
  'cancelled_by_customer',
  'cancelled_by_owner',
  'rejected',
];

describe('booking status maps', () => {
  it('has a tone for every possible booking status', () => {
    ALL_STATUSES.forEach((status) => {
      expect(BOOKING_STATUS_TONE[status]).toBeDefined();
    });
  });

  it('has a human-readable label for every possible booking status', () => {
    ALL_STATUSES.forEach((status) => {
      expect(typeof BOOKING_STATUS_LABEL[status]).toBe('string');
      expect(BOOKING_STATUS_LABEL[status].length).toBeGreaterThan(0);
    });
  });

  it('marks cancelled and rejected statuses with the danger tone', () => {
    expect(BOOKING_STATUS_TONE.cancelled_by_customer).toBe('danger');
    expect(BOOKING_STATUS_TONE.cancelled_by_owner).toBe('danger');
    expect(BOOKING_STATUS_TONE.rejected).toBe('danger');
  });

  it('marks confirmed and ongoing statuses with the success tone', () => {
    expect(BOOKING_STATUS_TONE.confirmed).toBe('success');
    expect(BOOKING_STATUS_TONE.ongoing).toBe('success');
  });
});
