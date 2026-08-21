import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiError } from '../utils/ApiError';
import * as vehicleService from '../services/vehicle.service';
import { uploadBuffer, deleteAsset } from '../services/upload.service';
import { Vehicle } from '../models/Vehicle.model';
import { createNotification } from '../services/notification.service';

export const createVehicle = asyncHandler(async (req: Request, res: Response) => {
  const vehicle = await vehicleService.createVehicle({ ownerId: req.user!.id, body: req.body });
  res.status(201).json({ success: true, message: 'Vehicle created as a draft. Add photos and documents next.', data: { vehicle } });
});

export const getVehicle = asyncHandler(async (req: Request, res: Response) => {
  const vehicle = await vehicleService.getVehicleById(req.params.id);
  res.status(200).json({ success: true, data: { vehicle } });
});

export const updateVehicle = asyncHandler(async (req: Request, res: Response) => {
  const vehicle = await vehicleService.updateVehicle({
    vehicleId: req.params.id,
    ownerId: req.user!.id,
    isAdmin: req.user!.role === 'admin',
    updates: req.body,
  });
  res.status(200).json({ success: true, message: 'Vehicle updated', data: { vehicle } });
});

export const deleteVehicle = asyncHandler(async (req: Request, res: Response) => {
  await vehicleService.deleteVehicle(req.params.id, req.user!.id, req.user!.role === 'admin');
  res.status(200).json({ success: true, message: 'Vehicle removed' });
});

export const submitForVerification = asyncHandler(async (req: Request, res: Response) => {
  const vehicle = await vehicleService.submitForVerification(req.params.id, req.user!.id);
  res.status(200).json({
    success: true,
    message: 'Submitted for admin verification',
    data: { vehicle },
  });
});

export const searchVehicles = asyncHandler(async (req: Request, res: Response) => {
  const q = req.query;
  const result = await vehicleService.searchVehicles({
    page: parseInt(String(q.page || '1'), 10),
    limit: Math.min(parseInt(String(q.limit || '12'), 10), 50),
    city: q.city as string | undefined,
    category: q.category as string | undefined,
    fuelType: q.fuelType as string | undefined,
    transmission: q.transmission as string | undefined,
    minPrice: q.minPrice ? Number(q.minPrice) : undefined,
    maxPrice: q.maxPrice ? Number(q.maxPrice) : undefined,
    seats: q.seats ? Number(q.seats) : undefined,
    q: q.q as string | undefined,
    sortBy: q.sortBy as any,
    startDate: q.startDate as string | undefined,
    endDate: q.endDate as string | undefined,
  });
  res.status(200).json({ success: true, data: result });
});

export const checkAvailability = asyncHandler(async (req: Request, res: Response) => {
  const { startDate, endDate } = req.query;
  const available = await vehicleService.checkAvailability(
    req.params.id,
    new Date(String(startDate)),
    new Date(String(endDate))
  );
  res.status(200).json({ success: true, data: { available } });
});

export const listMyVehicles = asyncHandler(async (req: Request, res: Response) => {
  const vehicles = await vehicleService.listOwnerVehicles(req.user!.id, req.query.status as any);
  res.status(200).json({ success: true, data: { vehicles } });
});

export const uploadVehicleImages = asyncHandler(async (req: Request, res: Response) => {
  const files = req.files as Express.Multer.File[] | undefined;
  if (!files || files.length === 0) throw ApiError.badRequest('No images uploaded');

  const vehicle = await Vehicle.findById(req.params.id);
  if (!vehicle) throw ApiError.notFound('Vehicle not found');
  if (vehicle.owner.toString() !== req.user!.id && req.user!.role !== 'admin') {
    throw ApiError.forbidden('You do not own this vehicle');
  }
  if (vehicle.images.length + files.length > 10) {
    throw ApiError.badRequest('A vehicle can have at most 10 images');
  }

  const uploaded = await Promise.all(files.map((f) => uploadBuffer(f.buffer, 'vehicles', f.originalname)));

  uploaded.forEach((result, i) => {
    vehicle.images.push({
      url: result.url,
      publicId: result.publicId,
      isPrimary: vehicle.images.length === 0 && i === 0,
    });
  });

  await vehicle.save();
  res.status(201).json({ success: true, message: 'Images uploaded', data: { vehicle } });
});

export const deleteVehicleImage = asyncHandler(async (req: Request, res: Response) => {
  const vehicle = await Vehicle.findById(req.params.id);
  if (!vehicle) throw ApiError.notFound('Vehicle not found');
  if (vehicle.owner.toString() !== req.user!.id && req.user!.role !== 'admin') {
    throw ApiError.forbidden('You do not own this vehicle');
  }

  const image = vehicle.images.find((img) => img.publicId === req.params.publicId);
  if (!image) throw ApiError.notFound('Image not found');

  await deleteAsset(image.publicId);
  vehicle.images = vehicle.images.filter((img) => img.publicId !== req.params.publicId) as any;
  await vehicle.save();

  res.status(200).json({ success: true, message: 'Image removed', data: { vehicle } });
});

const DOC_FIELDS = ['rc', 'insurance', 'pollutionCertificate'] as const;

export const uploadVehicleDocument = asyncHandler(async (req: Request, res: Response) => {
  const docType = req.params.docType as (typeof DOC_FIELDS)[number];
  if (!DOC_FIELDS.includes(docType)) throw ApiError.badRequest('Invalid document type');

  const file = req.file as Express.Multer.File | undefined;
  if (!file) throw ApiError.badRequest('No file uploaded');

  const vehicle = await Vehicle.findById(req.params.id);
  if (!vehicle) throw ApiError.notFound('Vehicle not found');
  if (vehicle.owner.toString() !== req.user!.id) throw ApiError.forbidden('You do not own this vehicle');

  const result = await uploadBuffer(file.buffer, `vehicles/documents/${docType}`, file.originalname);

  vehicle.documents[docType] = {
    url: result.url,
    publicId: result.publicId,
    status: 'pending',
  };
  await vehicle.save();

  res.status(201).json({ success: true, message: `${docType.toUpperCase()} uploaded, pending admin review`, data: { vehicle } });
});

// ---- Admin verification actions ----

export const adminVerifyVehicle = asyncHandler(async (req: Request, res: Response) => {
  const vehicle = await Vehicle.findById(req.params.id);
  if (!vehicle) throw ApiError.notFound('Vehicle not found');

  vehicle.status = 'active';
  vehicle.documents.rc.status = 'verified';
  vehicle.documents.insurance.status = 'verified';
  await vehicle.save();

  await createNotification({
    userId: vehicle.owner.toString(),
    type: 'document_verified',
    title: 'Vehicle verified',
    message: `${vehicle.title} passed verification and is now live on DriveHub.`,
    link: `/owner/vehicles/${vehicle.id}`,
  });

  res.status(200).json({ success: true, message: 'Vehicle verified and published', data: { vehicle } });
});

export const adminRejectVehicle = asyncHandler(async (req: Request, res: Response) => {
  const { reason } = req.body;
  const vehicle = await Vehicle.findById(req.params.id);
  if (!vehicle) throw ApiError.notFound('Vehicle not found');

  vehicle.status = 'rejected';
  vehicle.rejectionReason = reason || 'Documents did not pass verification';
  await vehicle.save();

  await createNotification({
    userId: vehicle.owner.toString(),
    type: 'document_rejected',
    title: 'Vehicle verification rejected',
    message: `${vehicle.title} was rejected: ${vehicle.rejectionReason}`,
    link: `/owner/vehicles/${vehicle.id}`,
  });

  res.status(200).json({ success: true, message: 'Vehicle rejected', data: { vehicle } });
});

export const adminListPendingVehicles = asyncHandler(async (_req: Request, res: Response) => {
  const vehicles = await Vehicle.find({ status: 'pending_verification' })
    .sort({ createdAt: 1 })
    .populate('owner', 'name email');
  res.status(200).json({ success: true, data: { vehicles } });
});
