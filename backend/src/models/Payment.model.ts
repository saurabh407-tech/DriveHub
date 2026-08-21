import { Schema, model, Document, Types } from 'mongoose';

export type PaymentStatus = 'created' | 'authorized' | 'captured' | 'failed' | 'refunded' | 'partially_refunded';

export interface IPayment extends Document {
  booking: Types.ObjectId;
  customer: Types.ObjectId;
  amount: number;
  currency: string;
  status: PaymentStatus;

  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  razorpaySignature?: string;

  refunds: {
    razorpayRefundId?: string;
    amount: number;
    reason?: string;
    processedAt: Date;
  }[];

  invoiceNumber?: string;
  invoiceUrl?: string;

  createdAt: Date;
  updatedAt: Date;
}

const paymentSchema = new Schema<IPayment>(
  {
    booking: { type: Schema.Types.ObjectId, ref: 'Booking', required: true, index: true },
    customer: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    amount: { type: Number, required: true, min: 0 },
    currency: { type: String, default: 'INR' },
    status: {
      type: String,
      enum: ['created', 'authorized', 'captured', 'failed', 'refunded', 'partially_refunded'],
      default: 'created',
      index: true,
    },

    razorpayOrderId: { type: String, index: true },
    razorpayPaymentId: { type: String, index: true },
    razorpaySignature: { type: String, select: false },

    refunds: [
      {
        razorpayRefundId: String,
        amount: { type: Number, required: true },
        reason: String,
        processedAt: { type: Date, default: Date.now },
      },
    ],

    invoiceNumber: { type: String, unique: true, sparse: true },
    invoiceUrl: String,
  },
  { timestamps: true }
);

export const Payment = model<IPayment>('Payment', paymentSchema);
