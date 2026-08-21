import { api } from './api';

export type BookingStatus =
  | 'pending_payment'
  | 'confirmed'
  | 'ongoing'
  | 'completed'
  | 'cancelled_by_customer'
  | 'cancelled_by_owner'
  | 'rejected';

export interface BookingVehicleRef {
  _id: string;
  title: string;
  images: { url: string; isPrimary: boolean }[];
  location: { city: string; state: string };
}

export interface BookingUserRef {
  _id: string;
  name: string;
  email: string;
}

export interface Booking {
  _id: string;
  bookingCode: string;
  vehicle: BookingVehicleRef;
  customer: BookingUserRef;
  owner: BookingUserRef;
  startDate: string;
  endDate: string;
  pickupLocation: { address: string; lat?: number; lng?: number };
  dropLocation: { address: string; lat?: number; lng?: number };
  pricing: {
    baseAmount: number;
    discountAmount: number;
    taxAmount: number;
    securityDeposit: number;
    totalAmount: number;
    currency: string;
    couponCode?: string;
  };
  status: BookingStatus;
  cancellation?: { reason: string; cancelledAt: string; refundAmount?: number };
  tripStartedAt?: string;
  tripCompletedAt?: string;
  tracking?: { lat: number; lng: number; updatedAt: string };
  createdAt: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface CreateBookingPayload {
  vehicleId: string;
  startDate: string;
  endDate: string;
  pickupLocation: { address: string; lat?: number; lng?: number };
  dropLocation: { address: string; lat?: number; lng?: number };
  couponCode?: string;
}

export async function createBooking(payload: CreateBookingPayload) {
  const res = await api.post('/bookings', payload);
  return res.data as { success: boolean; message: string; data: { booking: Booking } };
}

export async function getBooking(id: string) {
  const res = await api.get(`/bookings/${id}`);
  return res.data as { success: boolean; data: { booking: Booking } };
}

export async function cancelBooking(id: string, reason?: string) {
  const res = await api.post(`/bookings/${id}/cancel`, { reason });
  return res.data as { success: boolean; message: string; data: { booking: Booking } };
}

export async function startTrip(id: string) {
  const res = await api.post(`/bookings/${id}/start`);
  return res.data as { success: boolean; message: string; data: { booking: Booking } };
}

export async function completeTrip(id: string) {
  const res = await api.post(`/bookings/${id}/complete`);
  return res.data as { success: boolean; message: string; data: { booking: Booking } };
}

export async function updateTripLocation(id: string, lat: number, lng: number) {
  const res = await api.post(`/bookings/${id}/location`, { lat, lng });
  return res.data as { success: boolean; message: string };
}

export async function getTripLocation(id: string) {
  const res = await api.get(`/bookings/${id}/location`);
  return res.data as { success: boolean; data: { tracking: { lat: number; lng: number; updatedAt: string } | null } };
}

export async function listMyBookingsAsCustomer(status?: BookingStatus) {
  const res = await api.get('/bookings/mine', { params: { status } });
  return res.data as { success: boolean; data: { bookings: Booking[]; pagination: Pagination } };
}

export async function listMyBookingsAsOwner(status?: BookingStatus) {
  const res = await api.get('/bookings/owner', { params: { status } });
  return res.data as { success: boolean; data: { bookings: Booking[]; pagination: Pagination } };
}

export async function adminListAllBookings(status?: BookingStatus) {
  const res = await api.get('/bookings', { params: { status, limit: 50 } });
  return res.data as { success: boolean; data: { bookings: Booking[]; pagination: Pagination } };
}

export async function checkVehicleAvailability(vehicleId: string, startDate: string, endDate: string) {
  const res = await api.get(`/vehicles/${vehicleId}/availability`, { params: { startDate, endDate } });
  return res.data as { success: boolean; data: { available: boolean } };
}
