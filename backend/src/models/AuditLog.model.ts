import { Schema, model, Document, Types } from 'mongoose';

export type AuditAction =
  | 'user_banned'
  | 'user_unbanned'
  | 'user_role_changed'
  | 'vehicle_verified'
  | 'vehicle_rejected'
  | 'vehicle_removed'
  | 'document_verified'
  | 'document_rejected'
  | 'booking_force_cancelled'
  | 'refund_issued'
  | 'coupon_created'
  | 'coupon_deactivated';

export interface IAuditLog extends Document {
  actor: Types.ObjectId; // admin (or system) performing the action
  action: AuditAction;
  targetType: 'User' | 'Vehicle' | 'Booking' | 'Payment' | 'Coupon';
  targetId: Types.ObjectId;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  createdAt: Date;
}

const auditLogSchema = new Schema<IAuditLog>(
  {
    actor: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    action: {
      type: String,
      enum: [
        'user_banned',
        'user_unbanned',
        'user_role_changed',
        'vehicle_verified',
        'vehicle_rejected',
        'vehicle_removed',
        'document_verified',
        'document_rejected',
        'booking_force_cancelled',
        'refund_issued',
        'coupon_created',
        'coupon_deactivated',
      ],
      required: true,
      index: true,
    },
    targetType: { type: String, enum: ['User', 'Vehicle', 'Booking', 'Payment', 'Coupon'], required: true },
    targetId: { type: Schema.Types.ObjectId, required: true, index: true },
    metadata: { type: Schema.Types.Mixed },
    ipAddress: String,
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export const AuditLog = model<IAuditLog>('AuditLog', auditLogSchema);
