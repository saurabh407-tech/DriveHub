import mongoose from 'mongoose';
import { Booking } from '../models/Booking.model';
import { Vehicle } from '../models/Vehicle.model';
import { Payment } from '../models/Payment.model';
import { User } from '../models/User.model';

const REVENUE_STATUSES = ['confirmed', 'ongoing', 'completed'];

function monthsAgo(n: number): Date {
  const d = new Date();
  d.setMonth(d.getMonth() - n);
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d;
}

interface MonthlyPoint {
  label: string;
  revenue: number;
  bookings: number;
}

/**
 * Groups booking revenue/count by calendar month via an aggregation
 * pipeline, then fills in any months with zero activity so charts always
 * show a full, evenly-spaced series rather than gaps.
 */
async function monthlyRevenueSeries(matchStage: Record<string, unknown>, months = 6): Promise<MonthlyPoint[]> {
  const since = monthsAgo(months - 1);
  const rows = await Booking.aggregate([
    { $match: { ...matchStage, createdAt: { $gte: since }, status: { $in: REVENUE_STATUSES } } },
    {
      $group: {
        _id: { y: { $year: '$createdAt' }, m: { $month: '$createdAt' } },
        revenue: { $sum: '$pricing.totalAmount' },
        bookings: { $sum: 1 },
      },
    },
    { $sort: { '_id.y': 1, '_id.m': 1 } },
  ]);

  const points: MonthlyPoint[] = [];
  for (let i = months - 1; i >= 0; i--) {
    const d = monthsAgo(i);
    const y = d.getFullYear();
    const m = d.getMonth() + 1;
    const found = rows.find((r) => r._id.y === y && r._id.m === m);
    points.push({
      label: d.toLocaleString('en-IN', { month: 'short' }),
      revenue: found?.revenue || 0,
      bookings: found?.bookings || 0,
    });
  }
  return points;
}

export async function getOwnerAnalytics(ownerId: string) {
  const ownerObjectId = new mongoose.Types.ObjectId(ownerId);

  const [vehicleCount, activeBookings, completedTrips, ratingAgg, monthlyRevenue, recentBookings] = await Promise.all([
    Vehicle.countDocuments({ owner: ownerId, isDeleted: { $ne: true } }),
    Booking.countDocuments({ owner: ownerId, status: { $in: ['confirmed', 'ongoing'] } }),
    Booking.countDocuments({ owner: ownerId, status: 'completed' }),
    Vehicle.aggregate([
      { $match: { owner: ownerObjectId, ratingCount: { $gt: 0 } } },
      { $group: { _id: null, avg: { $avg: '$ratingAverage' } } },
    ]),
    monthlyRevenueSeries({ owner: ownerObjectId }),
    Booking.find({ owner: ownerId })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('vehicle', 'title')
      .populate('customer', 'name'),
  ]);

  return {
    vehicleCount,
    activeBookings,
    completedTrips,
    avgRating: Number((ratingAgg[0]?.avg || 0).toFixed(1)),
    thisMonthRevenue: monthlyRevenue[monthlyRevenue.length - 1]?.revenue || 0,
    monthlyRevenue,
    recentBookings,
  };
}

export async function getAdminAnalytics() {
  const [
    usersByRoleRaw,
    vehiclesByStatusRaw,
    totalBookings,
    platformRevenueAgg,
    monthlyRevenue,
    pendingVerifications,
    recentCancellations,
  ] = await Promise.all([
    User.aggregate([{ $group: { _id: '$role', count: { $sum: 1 } } }]),
    Vehicle.aggregate([{ $match: { isDeleted: { $ne: true } } }, { $group: { _id: '$status', count: { $sum: 1 } } }]),
    Booking.countDocuments({}),
    Payment.aggregate([
      { $match: { status: { $in: ['captured', 'partially_refunded'] } } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]),
    monthlyRevenueSeries({}),
    Vehicle.countDocuments({ status: 'pending_verification' }),
    Booking.find({ status: { $in: ['cancelled_by_customer', 'cancelled_by_owner'] } })
      .sort({ updatedAt: -1 })
      .limit(5)
      .populate('vehicle', 'title')
      .populate('customer', 'name')
      .populate('owner', 'name'),
  ]);

  const usersByRole = Object.fromEntries(usersByRoleRaw.map((r) => [r._id, r.count]));
  const vehiclesByStatus = Object.fromEntries(vehiclesByStatusRaw.map((r) => [r._id, r.count]));

  return {
    totalUsers: usersByRoleRaw.reduce((sum, r) => sum + r.count, 0),
    usersByRole,
    totalVehicles: vehiclesByStatusRaw.reduce((sum, r) => sum + r.count, 0),
    vehiclesByStatus,
    totalBookings,
    platformRevenue: platformRevenueAgg[0]?.total || 0,
    monthlyRevenue,
    pendingVerifications,
    recentCancellations,
  };
}

export async function getCustomerAnalytics(customerId: string) {
  const customerObjectId = new mongoose.Types.ObjectId(customerId);

  const [totalBookings, upcomingBookings, completedTrips, spentAgg] = await Promise.all([
    Booking.countDocuments({ customer: customerId }),
    Booking.countDocuments({ customer: customerId, status: 'confirmed', startDate: { $gte: new Date() } }),
    Booking.countDocuments({ customer: customerId, status: 'completed' }),
    Payment.aggregate([
      { $match: { customer: customerObjectId, status: { $in: ['captured', 'partially_refunded'] } } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]),
  ]);

  return {
    totalBookings,
    upcomingBookings,
    completedTrips,
    totalSpent: spentAgg[0]?.total || 0,
  };
}
