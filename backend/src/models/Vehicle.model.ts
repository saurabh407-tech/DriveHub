import { Schema, model, Document, Types } from 'mongoose';

export type VehicleCategory = 'hatchback' | 'sedan' | 'suv' | 'bike' | 'scooter' | 'van' | 'luxury';
export type FuelType = 'petrol' | 'diesel' | 'electric' | 'hybrid' | 'cng';
export type TransmissionType = 'manual' | 'automatic';
export type VehicleStatus = 'draft' | 'pending_verification' | 'active' | 'inactive' | 'maintenance' | 'rejected';

export interface IVehicleImage {
  url: string;
  publicId: string;
  isPrimary: boolean;
}

export interface IVehicleDocument {
  url: string;
  publicId: string;
  status: 'not_submitted' | 'pending' | 'verified' | 'rejected';
  expiresAt?: Date; // relevant for insurance/RC/pollution certificates
  rejectionReason?: string;
}

export interface IBlockedDate {
  from: Date;
  to: Date;
  reason: 'booked' | 'maintenance' | 'owner_blocked';
  bookingId?: Types.ObjectId;
}

export interface IVehicle extends Document {
  owner: Types.ObjectId;
  title: string;
  slug: string;
  category: VehicleCategory;
  make: string;
  vehicleModel: string;
  year: number;
  registrationNumber: string;
  color?: string;
  fuelType: FuelType;
  transmission: TransmissionType;
  seats: number;
  mileageKmpl?: number;

  images: IVehicleImage[];
  features: string[];
  description?: string;

  pricing: {
    perHour?: number;
    perDay: number;
    weeklyDiscountPercent?: number;
    monthlyDiscountPercent?: number;
    securityDeposit: number;
    currency: string;
  };

  location: {
    address: string;
    city: string;
    state: string;
    country: string;
    pincode?: string;
    coordinates: { type: 'Point'; coordinates: [number, number] }; // [lng, lat]
  };

  documents: {
    rc: IVehicleDocument;
    insurance: IVehicleDocument;
    pollutionCertificate?: IVehicleDocument;
  };

  blockedDates: IBlockedDate[];

  status: VehicleStatus;
  rejectionReason?: string;
  isDeleted: boolean;

  ratingAverage: number;
  ratingCount: number;
  totalTrips: number;

  createdAt: Date;
  updatedAt: Date;
}

const vehicleImageSchema = new Schema<IVehicleImage>(
  { url: String, publicId: String, isPrimary: { type: Boolean, default: false } },
  { _id: false }
);

const vehicleDocumentSchema = new Schema<IVehicleDocument>(
  {
    url: String,
    publicId: String,
    status: { type: String, enum: ['not_submitted', 'pending', 'verified', 'rejected'], default: 'not_submitted' },
    expiresAt: Date,
    rejectionReason: String,
  },
  { _id: false }
);

const blockedDateSchema = new Schema<IBlockedDate>(
  {
    from: { type: Date, required: true },
    to: { type: Date, required: true },
    reason: { type: String, enum: ['booked', 'maintenance', 'owner_blocked'], required: true },
    bookingId: { type: Schema.Types.ObjectId, ref: 'Booking' },
  },
  { _id: false }
);

const vehicleSchema = new Schema<IVehicle>(
  {
    owner: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: true, trim: true, maxlength: 120 },
    slug: { type: String, required: true, unique: true, index: true },
    category: {
      type: String,
      enum: ['hatchback', 'sedan', 'suv', 'bike', 'scooter', 'van', 'luxury'],
      required: true,
      index: true,
    },
    make: { type: String, required: true, trim: true },
    vehicleModel: { type: String, required: true, trim: true },
    year: { type: Number, required: true, min: 1990, max: new Date().getFullYear() + 1 },
    registrationNumber: { type: String, required: true, unique: true, uppercase: true, trim: true },
    color: { type: String, trim: true },
    fuelType: { type: String, enum: ['petrol', 'diesel', 'electric', 'hybrid', 'cng'], required: true },
    transmission: { type: String, enum: ['manual', 'automatic'], required: true },
    seats: { type: Number, required: true, min: 1, max: 60 },
    mileageKmpl: { type: Number, min: 0 },

    images: {
      type: [vehicleImageSchema],
      validate: {
        validator: (arr: IVehicleImage[]) => arr.length <= 10,
        message: 'A vehicle can have at most 10 images',
      },
    },
    features: [{ type: String, trim: true }],
    description: { type: String, maxlength: 2000 },

    pricing: {
      perHour: { type: Number, min: 0 },
      perDay: { type: Number, required: true, min: 0 },
      weeklyDiscountPercent: { type: Number, min: 0, max: 100, default: 0 },
      monthlyDiscountPercent: { type: Number, min: 0, max: 100, default: 0 },
      securityDeposit: { type: Number, required: true, min: 0, default: 0 },
      currency: { type: String, default: 'INR' },
    },

    location: {
      address: { type: String, required: true },
      city: { type: String, required: true, index: true },
      state: { type: String, required: true },
      country: { type: String, required: true, default: 'India' },
      pincode: { type: String },
      coordinates: {
        type: { type: String, enum: ['Point'], default: 'Point' },
        coordinates: { type: [Number], default: [0, 0] }, // [lng, lat]
      },
    },

    documents: {
      rc: { type: vehicleDocumentSchema, default: () => ({}) },
      insurance: { type: vehicleDocumentSchema, default: () => ({}) },
      pollutionCertificate: { type: vehicleDocumentSchema, default: () => ({}) },
    },

    blockedDates: [blockedDateSchema],

    status: {
      type: String,
      enum: ['draft', 'pending_verification', 'active', 'inactive', 'maintenance', 'rejected'],
      default: 'draft',
      index: true,
    },
    rejectionReason: String,
    isDeleted: { type: Boolean, default: false, select: false },

    ratingAverage: { type: Number, default: 0, min: 0, max: 5 },
    ratingCount: { type: Number, default: 0 },
    totalTrips: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// Search & filter indexes
vehicleSchema.index({ 'location.coordinates': '2dsphere' });
vehicleSchema.index({ status: 1, 'location.city': 1, category: 1 });
vehicleSchema.index({ title: 'text', make: 'text', vehicleModel: 'text', description: 'text' });
vehicleSchema.index({ 'pricing.perDay': 1 });
vehicleSchema.index({ ratingAverage: -1 });

vehicleSchema.set('toJSON', {
  transform: (_doc, ret: any) => {
    delete ret.__v;
    delete ret.isDeleted;
    return ret;
  },
});

export const Vehicle = model<IVehicle>('Vehicle', vehicleSchema);
