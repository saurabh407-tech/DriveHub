import { Schema, model, Document, Types } from 'mongoose';

export interface IReview extends Document {
  booking: Types.ObjectId;
  vehicle: Types.ObjectId;
  customer: Types.ObjectId;
  owner: Types.ObjectId;
  rating: number;
  comment?: string;
  images: { url: string; publicId: string }[];
  ownerReply?: { message: string; repliedAt: Date };
  createdAt: Date;
  updatedAt: Date;
}

const reviewSchema = new Schema<IReview>(
  {
    booking: { type: Schema.Types.ObjectId, ref: 'Booking', required: true, unique: true },
    vehicle: { type: Schema.Types.ObjectId, ref: 'Vehicle', required: true, index: true },
    customer: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    owner: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, maxlength: 1000 },
    images: [{ url: String, publicId: String }],
    ownerReply: { message: { type: String, maxlength: 500 }, repliedAt: Date },
  },
  { timestamps: true }
);

reviewSchema.index({ vehicle: 1, createdAt: -1 });

export const Review = model<IReview>('Review', reviewSchema);
