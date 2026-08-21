import { Schema, model, Document, Types } from 'mongoose';

export type MaintenanceType = 'oil_change' | 'insurance_renewal' | 'general_service' | 'tyre_change' | 'other';

export interface IMaintenanceRecord extends Document {
  vehicle: Types.ObjectId;
  owner: Types.ObjectId;
  type: MaintenanceType;
  dueDate: Date;
  completedDate?: Date;
  cost?: number;
  odometerReading?: number;
  notes?: string;
  isCompleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const maintenanceSchema = new Schema<IMaintenanceRecord>(
  {
    vehicle: { type: Schema.Types.ObjectId, ref: 'Vehicle', required: true, index: true },
    owner: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: {
      type: String,
      enum: ['oil_change', 'insurance_renewal', 'general_service', 'tyre_change', 'other'],
      required: true,
    },
    dueDate: { type: Date, required: true, index: true },
    completedDate: Date,
    cost: { type: Number, min: 0 },
    odometerReading: { type: Number, min: 0 },
    notes: { type: String, maxlength: 500 },
    isCompleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

maintenanceSchema.index({ owner: 1, dueDate: 1, isCompleted: 1 });

export const MaintenanceRecord = model<IMaintenanceRecord>('MaintenanceRecord', maintenanceSchema);
