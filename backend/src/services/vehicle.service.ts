import { FilterQuery } from 'mongoose';
import { Vehicle, IVehicle, VehicleStatus } from '../models/Vehicle.model';
import { ApiError } from '../utils/ApiError';

function slugify(text: string): string {
  return (
    text
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '') +
    '-' +
    Math.random().toString(36).slice(2, 7)
  );
}

interface CreateVehicleInput {
  ownerId: string;
  body: Record<string, any>;
}

export async function createVehicle({ ownerId, body }: CreateVehicleInput): Promise<IVehicle> {
  const existingReg = await Vehicle.findOne({ registrationNumber: body.registrationNumber?.toUpperCase() });
  if (existingReg) {
    throw ApiError.conflict('A vehicle with this registration number is already listed');
  }

  const vehicle = new Vehicle({
    owner: ownerId,
    title: body.title,
    slug: slugify(body.title),
    category: body.category,
    make: body.make,
    vehicleModel: body.model,
    year: body.year,
    registrationNumber: body.registrationNumber,
    color: body.color,
    fuelType: body.fuelType,
    transmission: body.transmission,
    seats: body.seats,
    mileageKmpl: body.mileageKmpl,
    features: Array.isArray(body.features) ? body.features : [],
    description: body.description,
    pricing: {
      perHour: body.pricing?.perHour,
      perDay: body.pricing?.perDay,
      weeklyDiscountPercent: body.pricing?.weeklyDiscountPercent || 0,
      monthlyDiscountPercent: body.pricing?.monthlyDiscountPercent || 0,
      securityDeposit: body.pricing?.securityDeposit || 0,
      currency: body.pricing?.currency || 'INR',
    },
    location: {
      address: body.location?.address,
      city: body.location?.city,
      state: body.location?.state,
      country: body.location?.country || 'India',
      pincode: body.location?.pincode,
      coordinates: {
        type: 'Point',
        coordinates: [
          body.location?.coordinates?.[0] || 0, // lng
          body.location?.coordinates?.[1] || 0, // lat
        ],
      },
    },
    status: 'draft', // owner must submit documents + request verification before it goes live
  });

  await vehicle.save();
  return vehicle;
}

export async function getVehicleById(id: string): Promise<IVehicle> {
  const vehicle = await Vehicle.findOne({ _id: id, isDeleted: { $ne: true } }).populate(
    'owner',
    'name avatar createdAt'
  );
  if (!vehicle) throw ApiError.notFound('Vehicle not found');
  return vehicle;
}

interface UpdateVehicleInput {
  vehicleId: string;
  ownerId: string;
  isAdmin: boolean;
  updates: Record<string, any>;
}

const OWNER_EDITABLE_FIELDS = [
  'title',
  'description',
  'features',
  'color',
  'mileageKmpl',
  'seats',
  'pricing',
  'location',
];

export async function updateVehicle({ vehicleId, ownerId, isAdmin, updates }: UpdateVehicleInput): Promise<IVehicle> {
  const vehicle = await Vehicle.findOne({ _id: vehicleId, isDeleted: { $ne: true } });
  if (!vehicle) throw ApiError.notFound('Vehicle not found');
  if (!isAdmin && vehicle.owner.toString() !== ownerId) {
    throw ApiError.forbidden('You do not own this vehicle');
  }

  for (const field of OWNER_EDITABLE_FIELDS) {
    if (field in updates) {
      if (field === 'pricing' || field === 'location') {
        (vehicle as any)[field] = { ...(vehicle as any)[field].toObject(), ...updates[field] };
      } else {
        (vehicle as any)[field] = updates[field];
      }
    }
  }

  await vehicle.save();
  return vehicle;
}

export async function deleteVehicle(vehicleId: string, ownerId: string, isAdmin: boolean): Promise<void> {
  const vehicle = await Vehicle.findById(vehicleId);
  if (!vehicle) throw ApiError.notFound('Vehicle not found');
  if (!isAdmin && vehicle.owner.toString() !== ownerId) {
    throw ApiError.forbidden('You do not own this vehicle');
  }
  vehicle.isDeleted = true;
  vehicle.status = 'inactive';
  await vehicle.save();
}

export async function submitForVerification(vehicleId: string, ownerId: string): Promise<IVehicle> {
  const vehicle = await Vehicle.findById(vehicleId);
  if (!vehicle) throw ApiError.notFound('Vehicle not found');
  if (vehicle.owner.toString() !== ownerId) throw ApiError.forbidden('You do not own this vehicle');

  if (vehicle.documents.rc.status === 'not_submitted' || vehicle.documents.insurance.status === 'not_submitted') {
    throw ApiError.badRequest('Upload RC and insurance documents before requesting verification');
  }
  if (vehicle.images.length === 0) {
    throw ApiError.badRequest('Add at least one photo before requesting verification');
  }

  vehicle.status = 'pending_verification';
  await vehicle.save();
  return vehicle;
}

interface SearchParams {
  page: number;
  limit: number;
  city?: string;
  category?: string;
  fuelType?: string;
  transmission?: string;
  minPrice?: number;
  maxPrice?: number;
  seats?: number;
  q?: string;
  sortBy?: 'price_asc' | 'price_desc' | 'rating' | 'newest';
  startDate?: string;
  endDate?: string;
}

export async function searchVehicles(params: SearchParams) {
  const filter: FilterQuery<IVehicle> = { status: 'active', isDeleted: { $ne: true } };

  if (params.city) filter['location.city'] = new RegExp(`^${escapeRegex(params.city)}`, 'i');
  if (params.category) filter.category = params.category as any;
  if (params.fuelType) filter.fuelType = params.fuelType as any;
  if (params.transmission) filter.transmission = params.transmission as any;
  if (params.seats) filter.seats = { $gte: params.seats };
  if (params.minPrice || params.maxPrice) {
    filter['pricing.perDay'] = {
      ...(params.minPrice ? { $gte: params.minPrice } : {}),
      ...(params.maxPrice ? { $lte: params.maxPrice } : {}),
    };
  }
  if (params.q) filter.$text = { $search: params.q };

  // Exclude vehicles that have an overlapping blocked/booked date range
  if (params.startDate && params.endDate) {
    const start = new Date(params.startDate);
    const end = new Date(params.endDate);
    filter.blockedDates = {
      $not: {
        $elemMatch: { from: { $lte: end }, to: { $gte: start } },
      },
    };
  }

  const sort: Record<string, 1 | -1> =
    params.sortBy === 'price_asc'
      ? { 'pricing.perDay': 1 }
      : params.sortBy === 'price_desc'
      ? { 'pricing.perDay': -1 }
      : params.sortBy === 'rating'
      ? { ratingAverage: -1 }
      : { createdAt: -1 };

  const [vehicles, total] = await Promise.all([
    Vehicle.find(filter)
      .sort(sort)
      .skip((params.page - 1) * params.limit)
      .limit(params.limit)
      .populate('owner', 'name avatar'),
    Vehicle.countDocuments(filter),
  ]);

  return {
    vehicles,
    pagination: {
      page: params.page,
      limit: params.limit,
      total,
      totalPages: Math.ceil(total / params.limit),
    },
  };
}

export async function checkAvailability(vehicleId: string, startDate: Date, endDate: Date): Promise<boolean> {
  const vehicle = await Vehicle.findById(vehicleId).select('blockedDates status');
  if (!vehicle || vehicle.status !== 'active') return false;

  const overlaps = vehicle.blockedDates.some((block) => block.from <= endDate && block.to >= startDate);
  return !overlaps;
}

export async function listOwnerVehicles(ownerId: string, status?: VehicleStatus) {
  const filter: FilterQuery<IVehicle> = { owner: ownerId, isDeleted: { $ne: true } };
  if (status) filter.status = status;
  return Vehicle.find(filter).sort({ createdAt: -1 });
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
