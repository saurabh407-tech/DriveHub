import { Schema, model, Document, Types } from 'mongoose';
import bcrypt from 'bcryptjs';

export type UserRole = 'customer' | 'owner' | 'admin';
export type DocumentStatus = 'not_submitted' | 'pending' | 'verified' | 'rejected';
export type AuthProvider = 'local' | 'google';

export interface IEmergencyContact {
  name: string;
  relation: string;
  phone: string;
}

export interface IUploadedDocument {
  url: string;
  publicId: string; // Cloudinary public_id, needed to delete/replace the asset
  status: DocumentStatus;
  rejectionReason?: string;
  uploadedAt?: Date;
  verifiedAt?: Date;
  verifiedBy?: Types.ObjectId;
}

export interface IUser extends Document {
  name: string;
  email: string;
  phone?: string;
  password?: string; // absent for Google-only accounts
  authProvider: AuthProvider;
  googleId?: string;
  role: UserRole;
  avatar?: { url: string; publicId: string };
  bio?: string;

  isEmailVerified: boolean;
  isPhoneVerified: boolean;
  isActive: boolean;
  isBanned: boolean;
  banReason?: string;

  // OTP / verification / password reset — hashed, never stored raw
  emailVerificationTokenHash?: string;
  emailVerificationExpires?: Date;
  otpHash?: string;
  otpExpires?: Date;
  otpPurpose?: 'email_verification' | 'phone_verification' | 'password_reset' | 'login';
  passwordResetTokenHash?: string;
  passwordResetExpires?: Date;

  refreshTokenHash?: string; // hashed refresh token for rotation/revocation

  drivingLicense?: IUploadedDocument;
  governmentId?: IUploadedDocument;
  dateOfBirth?: Date;
  address?: {
    line1?: string;
    city?: string;
    state?: string;
    country?: string;
    pincode?: string;
  };
  emergencyContact?: IEmergencyContact;

  wallet: {
    balance: number;
    currency: string;
  };

  // Owner-specific verification (KYC to list vehicles)
  ownerVerification?: {
    status: DocumentStatus;
    panCardUrl?: string;
    bankAccountVerified?: boolean;
    submittedAt?: Date;
  };

  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;

  comparePassword(candidate: string): Promise<boolean>;
}

const emergencyContactSchema = new Schema<IEmergencyContact>(
  {
    name: { type: String, trim: true },
    relation: { type: String, trim: true },
    phone: { type: String, trim: true },
  },
  { _id: false }
);

const uploadedDocumentSchema = new Schema<IUploadedDocument>(
  {
    url: { type: String },
    publicId: { type: String },
    status: {
      type: String,
      enum: ['not_submitted', 'pending', 'verified', 'rejected'],
      default: 'not_submitted',
    },
    rejectionReason: { type: String },
    uploadedAt: { type: Date },
    verifiedAt: { type: Date },
    verifiedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { _id: false }
);

const userSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true, minlength: 2, maxlength: 80 },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Invalid email address'],
    },
    phone: { type: String, trim: true, sparse: true, unique: true },
    password: { type: String, minlength: 8, select: false },
    authProvider: { type: String, enum: ['local', 'google'], default: 'local' },
    googleId: { type: String, index: true, sparse: true },
    role: { type: String, enum: ['customer', 'owner', 'admin'], default: 'customer', index: true },
    avatar: { url: String, publicId: String },
    bio: { type: String, trim: true, maxlength: 500 },

    isEmailVerified: { type: Boolean, default: false },
    isPhoneVerified: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    isBanned: { type: Boolean, default: false },
    banReason: { type: String },

    emailVerificationTokenHash: { type: String, select: false },
    emailVerificationExpires: { type: Date, select: false },
    otpHash: { type: String, select: false },
    otpExpires: { type: Date, select: false },
    otpPurpose: {
      type: String,
      enum: ['email_verification', 'phone_verification', 'password_reset', 'login'],
      select: false,
    },
    passwordResetTokenHash: { type: String, select: false },
    passwordResetExpires: { type: Date, select: false },

    refreshTokenHash: { type: String, select: false },

    drivingLicense: { type: uploadedDocumentSchema, default: () => ({}) },
    governmentId: { type: uploadedDocumentSchema, default: () => ({}) },
    dateOfBirth: { type: Date },
    address: {
      line1: String,
      city: String,
      state: String,
      country: String,
      pincode: String,
    },
    emergencyContact: { type: emergencyContactSchema },

    wallet: {
      balance: { type: Number, default: 0, min: 0 },
      currency: { type: String, default: 'INR' },
    },

    ownerVerification: {
      status: { type: String, enum: ['not_submitted', 'pending', 'verified', 'rejected'], default: 'not_submitted' },
      panCardUrl: String,
      bankAccountVerified: { type: Boolean, default: false },
      submittedAt: Date,
    },

    lastLoginAt: { type: Date },
  },
  { timestamps: true }
);

userSchema.index({ role: 1, isActive: 1 });
userSchema.index({ createdAt: -1 });

userSchema.pre('save', async function (next) {
  if (!this.isModified('password') || !this.password) return next();
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.comparePassword = async function (candidate: string): Promise<boolean> {
  if (!this.password) return false;
  return bcrypt.compare(candidate, this.password);
};

// Never leak sensitive/internal fields through res.json(user)
userSchema.set('toJSON', {
  transform: (_doc, ret: any) => {
    delete ret.password;
    delete ret.refreshTokenHash;
    delete ret.otpHash;
    delete ret.otpExpires;
    delete ret.otpPurpose;
    delete ret.emailVerificationTokenHash;
    delete ret.emailVerificationExpires;
    delete ret.passwordResetTokenHash;
    delete ret.passwordResetExpires;
    delete ret.__v;
    return ret;
  },
});

export const User = model<IUser>('User', userSchema);
