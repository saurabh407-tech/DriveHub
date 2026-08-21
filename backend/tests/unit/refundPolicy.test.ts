import { calculateRefundAmount } from '../../src/utils/refundPolicy';

const NOW = new Date('2026-08-10T12:00:00Z');

describe('calculateRefundAmount', () => {
  it('gives a full refund when cancelled 24+ hours before start', () => {
    const start = new Date('2026-08-11T13:00:00Z'); // 25h away
    expect(calculateRefundAmount(1000, start, false, NOW)).toBe(1000);
  });

  it('gives exactly a full refund at precisely 24 hours', () => {
    const start = new Date('2026-08-11T12:00:00Z'); // exactly 24h away
    expect(calculateRefundAmount(1000, start, false, NOW)).toBe(1000);
  });

  it('gives a 50% refund when cancelled less than 24 hours before start', () => {
    const start = new Date('2026-08-11T00:00:00Z'); // 12h away
    expect(calculateRefundAmount(1000, start, false, NOW)).toBe(500);
  });

  it('gives no refund once the start time has already passed', () => {
    const start = new Date('2026-08-10T00:00:00Z'); // in the past relative to NOW
    expect(calculateRefundAmount(1000, start, false, NOW)).toBe(0);
  });

  it('gives no refund once the trip is already ongoing, regardless of timing', () => {
    const start = new Date('2026-08-11T13:00:00Z'); // would otherwise be a full refund
    expect(calculateRefundAmount(1000, start, true, NOW)).toBe(0);
  });

  it('rounds the 50% refund to the nearest rupee', () => {
    const start = new Date('2026-08-11T00:00:00Z');
    expect(calculateRefundAmount(999, start, false, NOW)).toBe(500);
  });
});
