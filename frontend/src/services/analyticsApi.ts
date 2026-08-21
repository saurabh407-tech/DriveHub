import { api } from './api';

export interface MonthlyPoint {
  label: string;
  revenue: number;
  bookings: number;
}

export interface OwnerAnalytics {
  vehicleCount: number;
  activeBookings: number;
  completedTrips: number;
  avgRating: number;
  thisMonthRevenue: number;
  monthlyRevenue: MonthlyPoint[];
  recentBookings: {
    _id: string;
    bookingCode: string;
    status: string;
    vehicle: { title: string };
    customer: { name: string };
    pricing: { totalAmount: number };
    createdAt: string;
  }[];
}

export interface AdminAnalytics {
  totalUsers: number;
  usersByRole: Record<string, number>;
  totalVehicles: number;
  vehiclesByStatus: Record<string, number>;
  totalBookings: number;
  platformRevenue: number;
  monthlyRevenue: MonthlyPoint[];
  pendingVerifications: number;
  recentCancellations: {
    _id: string;
    bookingCode: string;
    status: string;
    vehicle: { title: string };
    customer: { name: string };
    owner: { name: string };
  }[];
}

export interface CustomerAnalytics {
  totalBookings: number;
  upcomingBookings: number;
  completedTrips: number;
  totalSpent: number;
}

export async function getOwnerAnalytics() {
  const res = await api.get('/analytics/owner');
  return res.data as { success: boolean; data: OwnerAnalytics };
}

export async function getAdminAnalytics() {
  const res = await api.get('/analytics/admin');
  return res.data as { success: boolean; data: AdminAnalytics };
}

export async function getCustomerAnalytics() {
  const res = await api.get('/analytics/customer');
  return res.data as { success: boolean; data: CustomerAnalytics };
}
