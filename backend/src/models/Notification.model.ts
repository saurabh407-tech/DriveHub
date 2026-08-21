import { Schema, model, Document, Types } from 'mongoose';

export type NotificationType =
  | 'booking_confirmed'
  | 'booking_cancelled'
  | 'payment_received'
  | 'document_verified'
  | 'document_rejected'
  | 'maintenance_due'
  | 'admin_broadcast'
  | 'chat_message'
  | 'review_received';

export interface INotification extends Document {
  user: Types.ObjectId;
  type: NotificationType;
  title: string;
  message: string;
  link?: string; // frontend deep link, e.g. /customer/bookings/:id
  isRead: boolean;
  createdAt: Date;
}

const notificationSchema = new Schema<INotification>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: {
      type: String,
      enum: [
        'booking_confirmed',
        'booking_cancelled',
        'payment_received',
        'document_verified',
        'document_rejected',
        'maintenance_due',
        'admin_broadcast',
        'chat_message',
        'review_received',
      ],
      required: true,
    },
    title: { type: String, required: true },
    message: { type: String, required: true },
    link: String,
    isRead: { type: Boolean, default: false },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

notificationSchema.index({ user: 1, isRead: 1, createdAt: -1 });

export const Notification = model<INotification>('Notification', notificationSchema);
