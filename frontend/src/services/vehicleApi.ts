import { api } from './api';

export interface VehicleSummary {
  _id: string;
  title: string;
  category: string;
  make: string;
  vehicleModel?: string;
  year: number;
  fuelType: string;
  transmission: string;
  seats: number;
  images: { url: string; publicId: string; isPrimary: boolean }[];
  pricing: { perDay: number; securityDeposit: number; currency: string };
  location: { city: string; state: string };
  status: string;
  ratingAverage: number;
  ratingCount: number;
  documents: {
    rc: { status: string };
    insurance: { status: string };
  };
  rejectionReason?: string;
}

export interface SearchFilters {
  page?: number;
  limit?: number;
  city?: string;
  category?: string;
  fuelType?: string;
  transmission?: string;
  minPrice?: number;
  maxPrice?: number;
  seats?: number;
  q?: string;
  sortBy?: 'price_asc' | 'price_desc' | 'rating' | 'newest';
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export async function searchVehicles(filters: SearchFilters) {
  const res = await api.get('/vehicles', { params: filters });
  return res.data as { success: boolean; data: { vehicles: VehicleSummary[]; pagination: Pagination } };
}

export async function getVehicle(id: string) {
  const res = await api.get(`/vehicles/${id}`);
  return res.data as { success: boolean; data: { vehicle: VehicleSummary & { description?: string; owner: any } } };
}

export interface CreateVehiclePayload {
  title: string;
  category: string;
  make: string;
  model: string;
  year: number;
  registrationNumber: string;
  fuelType: string;
  transmission: string;
  seats: number;
  pricing: { perDay: number; securityDeposit: number };
  location: { address: string; city: string; state: string };
}

export async function createVehicle(payload: CreateVehiclePayload) {
  const res = await api.post('/vehicles', payload);
  return res.data as { success: boolean; message: string; data: { vehicle: VehicleSummary } };
}

export async function listMyVehicles() {
  const res = await api.get('/vehicles/owner/mine');
  return res.data as { success: boolean; data: { vehicles: VehicleSummary[] } };
}

export async function uploadVehicleImages(vehicleId: string, files: File[]) {
  const formData = new FormData();
  files.forEach((f) => formData.append('images', f));
  const res = await api.post(`/vehicles/${vehicleId}/images`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data as { success: boolean; data: { vehicle: VehicleSummary } };
}

export async function uploadVehicleDocument(vehicleId: string, docType: 'rc' | 'insurance', file: File) {
  const formData = new FormData();
  formData.append('document', file);
  const res = await api.post(`/vehicles/${vehicleId}/documents/${docType}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data as { success: boolean; data: { vehicle: VehicleSummary } };
}

export async function submitForVerification(vehicleId: string) {
  const res = await api.post(`/vehicles/${vehicleId}/submit-verification`);
  return res.data as { success: boolean; message: string };
}

export async function adminListPendingVehicles() {
  const res = await api.get('/vehicles/admin/pending');
  return res.data as { success: boolean; data: { vehicles: (VehicleSummary & { owner: { name: string; email: string } })[] } };
}

export async function adminVerifyVehicle(vehicleId: string) {
  const res = await api.post(`/vehicles/${vehicleId}/verify`);
  return res.data as { success: boolean; message: string };
}

export async function adminRejectVehicle(vehicleId: string, reason?: string) {
  const res = await api.post(`/vehicles/${vehicleId}/reject`, { reason });
  return res.data as { success: boolean; message: string };
}
