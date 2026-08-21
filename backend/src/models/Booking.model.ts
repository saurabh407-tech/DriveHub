import { Schema, model, Document, Types } from 'mongoose';

export type BookingStatus =
  | 'pending_payment'
  | 'confirmed'
  | 'ongoing'
  | 'completed'
  | 'cancelled_by_customer'
  | 'cancelled_by_owner'
  | 'rejected';

export interface IBookingLocation {
  address: string;
  lat?: number;
  lng?: number;
}

export interface ITrackingPoint {
  lat: number;
  lng: number;
  updatedBy: Types.ObjectId;
  updatedAt: Date;
}

export interface IPriceBreakdown {
  baseAmount: number;
  discountAmount: number;
  taxAmount: number;
  securityDeposit: number;
  couponCode?: string;
  totalAmount: number;
  currency: string;
}

export interface IBooking extends Document {
  bookingCode: string; // human-readable reference, e.g. DH-20260721-XXXX
  customer: Types.ObjectId;
  vehicle: Types.ObjectId;
  owner: Types.ObjectId;

  startDate: Date;
  endDate: Date;
  pickupLocation: IBookingLocation;
  dropLocation: IBookingLocation;

  pricing: IPriceBreakdown;
  status: BookingStatus;

  cancellation?: {
    cancelledBy: Types.ObjectId;
    reason: string;
    cancelledAt: Date;
    refundAmount?: number;
  };

  agreementUrl?: string; // generated PDF rental agreement (Phase 6/PDFKit)
  paymentId?: Types.ObjectId;

  tripStartedAt?: Date;
  tripCompletedAt?: Date;
  tracking?: ITrackingPoint;

  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const bookingLocationSchema = new Schema<IBookingLocation>(
  {
    address: { type: String, required: true },
    lat: { type: Number },
    lng: { type: Number },
  },
  { _id: false }
);

const trackingPointSchema = new Schema<ITrackingPoint>(
  {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    updatedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const bookingSchema = new Schema<IBooking>(
  {
    bookingCode: { type: String, required: true, unique: true, index: true },
    customer: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    vehicle: { type: Schema.Types.ObjectId, ref: 'Vehicle', required: true, index: true },
    owner: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },

    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    pickupLocation: { type: bookingLocationSchema, required: true },
    dropLocation: { type: bookingLocationSchema, required: true },

    pricing: {
      baseAmount: { type: Number, required: true, min: 0 },
      discountAmount: { type: Number, default: 0, min: 0 },
      taxAmount: { type: Number, default: 0, min: 0 },
      securityDeposit: { type: Number, default: 0, min: 0 },
      couponCode: { type: String },
      totalAmount: { type: Number, required: true, min: 0 },
      currency: { type: String, default: 'INR' },
    },

    status: {
      type: String,
      enum: [
        'pending_payment',
        'confirmed',
        'ongoing',
        'completed',
        'cancelled_by_customer',
        'cancelled_by_owner',
        'rejected',
      ],
      default: 'pending_payment',
      index: true,
    },

    cancellation: {
      cancelledBy: { type: Schema.Types.ObjectId, ref: 'User' },
      reason: String,
      cancelledAt: Date,
      refundAmount: Number,
    },

    agreementUrl: String,
    paymentId: { type: Schema.Types.ObjectId, ref: 'Payment' },

    tripStartedAt: Date,
    tripCompletedAt: Date,
    tracking: { type: trackingPointSchema },

    notes: { type: String, maxlength: 500 },
  },
  { timestamps: true }
);

bookingSchema.index({ vehicle: 1, startDate: 1, endDate: 1 });
bookingSchema.index({ customer: 1, createdAt: -1 });
bookingSchema.index({ owner: 1, createdAt: -1 });

export const Booking = model<IBooking>('Booking', bookingSchema);
