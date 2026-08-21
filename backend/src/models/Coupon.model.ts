import { Schema, model, Document } from 'mongoose';

export type DiscountType = 'flat' | 'percentage';

export interface ICoupon extends Document {
  code: string;
  description?: string;
  discountType: DiscountType;
  value: number; // flat amount or percentage
  maxDiscountAmount?: number; // cap for percentage coupons
  minBookingAmount?: number;
  usageLimit?: number; // total redemptions allowed across all users
  usageLimitPerUser?: number;
  usedCount: number;
  validFrom: Date;
  validUntil: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const couponSchema = new Schema<ICoupon>(
  {
    code: { type: String, required: true, unique: true, uppercase: true, trim: true, index: true },
    description: { type: String, maxlength: 200 },
    discountType: { type: String, enum: ['flat', 'percentage'], required: true },
    value: { type: Number, required: true, min: 0 },
    maxDiscountAmount: { type: Number, min: 0 },
    minBookingAmount: { type: Number, min: 0, default: 0 },
    usageLimit: { type: Number, min: 1 },
    usageLimitPerUser: { type: Number, min: 1, default: 1 },
    usedCount: { type: Number, default: 0 },
    validFrom: { type: Date, required: true },
    validUntil: { type: Date, required: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const Coupon = model<ICoupon>('Coupon', couponSchema);
