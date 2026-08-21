import {
  calculateDurationDays,
  calculateBaseAmount,
  calculateBookingPrice,
  calculateCouponDiscount,
} from '../../src/utils/pricing';

describe('calculateDurationDays', () => {
  it('returns 1 for a same-day (few hours) booking', () => {
    const start = new Date('2026-08-01T09:00:00Z');
    const end = new Date('2026-08-01T18:00:00Z');
    expect(calculateDurationDays(start, end)).toBe(1);
  });

  it('returns exact whole-day count for multi-day bookings', () => {
    const start = new Date('2026-08-01T00:00:00Z');
    const end = new Date('2026-08-04T00:00:00Z');
    expect(calculateDurationDays(start, end)).toBe(3);
  });

  it('rounds up partial days', () => {
    const start = new Date('2026-08-01T00:00:00Z');
    const end = new Date('2026-08-02T06:00:00Z'); // 1 day 6 hours
    expect(calculateDurationDays(start, end)).toBe(2);
  });

  it('never returns less than 1 even for a negative/zero range', () => {
    const start = new Date('2026-08-02T00:00:00Z');
    const end = new Date('2026-08-01T00:00:00Z');
    expect(calculateDurationDays(start, end)).toBe(1);
  });
});

describe('calculateBaseAmount', () => {
  it('multiplies day rate by duration with no discount', () => {
    expect(calculateBaseAmount({ perDay: 1000 }, 3)).toBe(3000);
  });

  it('applies the weekly discount at 7+ days', () => {
    expect(calculateBaseAmount({ perDay: 1000, weeklyDiscountPercent: 10 }, 7)).toBe(6300); // 7000 - 10%
  });

  it('does not apply the weekly discount under 7 days', () => {
    expect(calculateBaseAmount({ perDay: 1000, weeklyDiscountPercent: 10 }, 6)).toBe(6000);
  });

  it('applies the monthly discount at 30+ days, preferring it over weekly', () => {
    const result = calculateBaseAmount({ perDay: 1000, weeklyDiscountPercent: 10, monthlyDiscountPercent: 25 }, 30);
    expect(result).toBe(22500); // 30000 - 25%, not -10%
  });

  it('rounds to the nearest rupee', () => {
    expect(calculateBaseAmount({ perDay: 333, weeklyDiscountPercent: 15 }, 7)).toBe(Math.round(333 * 7 * 0.85));
  });
});

describe('calculateBookingPrice', () => {
  it('computes GST on the post-discount amount and adds the deposit untaxed', () => {
    const result = calculateBookingPrice(3000, 0, 2000);
    expect(result.taxAmount).toBe(540); // 18% of 3000
    expect(result.totalAmount).toBe(3000 + 540 + 2000);
  });

  it('applies the discount before computing tax', () => {
    const result = calculateBookingPrice(3000, 500, 0);
    expect(result.taxAmount).toBe(Math.round(2500 * 0.18));
    expect(result.totalAmount).toBe(2500 + result.taxAmount);
  });

  it('never lets a discount larger than the base amount produce negative tax', () => {
    const result = calculateBookingPrice(1000, 5000, 0);
    expect(result.taxAmount).toBe(0);
    expect(result.totalAmount).toBe(0);
  });
});

describe('calculateCouponDiscount', () => {
  it('returns the flat value directly, capped at the base amount', () => {
    expect(calculateCouponDiscount({ discountType: 'flat', value: 200 }, 3000)).toBe(200);
    expect(calculateCouponDiscount({ discountType: 'flat', value: 5000 }, 3000)).toBe(3000);
  });

  it('computes a percentage of the base amount', () => {
    expect(calculateCouponDiscount({ discountType: 'percentage', value: 10 }, 3000)).toBe(300);
  });

  it('caps a percentage discount at maxDiscountAmount', () => {
    expect(calculateCouponDiscount({ discountType: 'percentage', value: 50, maxDiscountAmount: 400 }, 3000)).toBe(400);
  });

  it('rounds the result', () => {
    expect(calculateCouponDiscount({ discountType: 'percentage', value: 33 }, 1000)).toBe(330);
  });
});
