export const MS_PER_DAY = 24 * 60 * 60 * 1000;
export const GST_RATE = 0.18;

/** Inclusive day count between two dates, always at least 1. */
export function calculateDurationDays(startDate: Date, endDate: Date): number {
  const diff = Math.ceil((endDate.getTime() - startDate.getTime()) / MS_PER_DAY);
  return Math.max(1, diff);
}

export interface VehiclePricingInput {
  perDay: number;
  weeklyDiscountPercent?: number;
  monthlyDiscountPercent?: number;
}

/**
 * Base fare for a rental: day-rate × duration, with a weekly or monthly
 * discount applied for longer trips (monthly takes precedence at 30+
 * days, weekly at 7+ days). Rounded to the nearest rupee.
 */
export function calculateBaseAmount(pricing: VehiclePricingInput, days: number): number {
  let baseAmount = pricing.perDay * days;

  if (days >= 30 && pricing.monthlyDiscountPercent) {
    baseAmount -= (baseAmount * pricing.monthlyDiscountPercent) / 100;
  } else if (days >= 7 && pricing.weeklyDiscountPercent) {
    baseAmount -= (baseAmount * pricing.weeklyDiscountPercent) / 100;
  }

  return Math.round(baseAmount);
}

export interface BookingPriceBreakdown {
  baseAmount: number;
  discountAmount: number;
  taxAmount: number;
  securityDeposit: number;
  totalAmount: number;
}

/**
 * Full price breakdown for a booking given a base amount, any coupon
 * discount, and the vehicle's security deposit. GST is applied after the
 * discount; the deposit is added on top (not taxed, since it's refundable
 * and not vehicle-rental revenue).
 */
export function calculateBookingPrice(
  baseAmount: number,
  discountAmount: number,
  securityDeposit: number
): BookingPriceBreakdown {
  const taxableAmount = Math.max(0, baseAmount - discountAmount);
  const taxAmount = Math.round(taxableAmount * GST_RATE);
  const totalAmount = taxableAmount + taxAmount + securityDeposit;

  return { baseAmount, discountAmount, taxAmount, securityDeposit, totalAmount };
}

export interface CouponInput {
  discountType: 'flat' | 'percentage';
  value: number;
  maxDiscountAmount?: number;
}

/** Discount amount for a coupon against a given base fare, capped at both the coupon's max and the base fare itself. */
export function calculateCouponDiscount(coupon: CouponInput, baseAmount: number): number {
  let discount = coupon.discountType === 'flat' ? coupon.value : (baseAmount * coupon.value) / 100;
  if (coupon.maxDiscountAmount) discount = Math.min(discount, coupon.maxDiscountAmount);
  discount = Math.min(discount, baseAmount);
  return Math.round(Math.max(0, discount));
}
