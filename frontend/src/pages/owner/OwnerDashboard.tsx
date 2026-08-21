import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { StatCard, Badge } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Button } from '@/components/ui/Button';
import { RevenueChart } from '@/components/charts/RevenueChart';
import { useAppSelector } from '@/hooks/useAppRedux';
import { getOwnerAnalytics } from '@/services/analyticsApi';
import type { OwnerAnalytics } from '@/services/analyticsApi';
import { BOOKING_STATUS_TONE, BOOKING_STATUS_LABEL } from '@/utils/bookingStatus';
import { FadeIn } from '@/components/ui/FadeIn';

export default function OwnerDashboard() {
  const user = useAppSelector((s) => s.auth.user);
  const [analytics, setAnalytics] = useState<OwnerAnalytics | null>(null);

  useEffect(() => {
    getOwnerAnalytics().then((res) => setAnalytics(res.data));
  }, []);

  return (
    <DashboardLayout>
      <FadeIn>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold text-ink">Fleet overview</h1>
          <p className="mt-1 text-sm text-slate">Welcome back, {user?.name?.split(' ')[0]}.</p>
        </div>
        <Link to="/owner/vehicles/new">
          <Button size="sm">+ Add vehicle</Button>
        </Link>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-4">
        <StatCard label="Listed vehicles" value={String(analytics?.vehicleCount ?? '—')} />
        <StatCard label="Active bookings" value={String(analytics?.activeBookings ?? '—')} />
        <StatCard
          label="This month's revenue"
          value={analytics ? `₹${analytics.thisMonthRevenue.toLocaleString('en-IN')}` : '—'}
        />
        <StatCard label="Avg. rating" value={analytics && analytics.avgRating > 0 ? analytics.avgRating.toFixed(1) : '—'} />
      </div>

      {analytics && (
        <div className="mt-6 rounded-2xl border border-paper-line bg-paper-soft p-5">
          <h2 className="font-display text-base font-semibold text-ink">Revenue, last 6 months</h2>
          <div className="mt-2">
            <RevenueChart data={analytics.monthlyRevenue} />
          </div>
        </div>
      )}

      <div className="mt-6">
        <h2 className="font-display text-base font-semibold text-ink">Recent bookings</h2>
        {analytics && analytics.recentBookings.length === 0 ? (
          <div className="mt-3">
            <EmptyState
              title="No vehicles listed yet"
              description="Add your first vehicle, upload its photos and documents, then submit it for admin verification to go live."
            />
            <div className="mt-4 flex justify-center">
              <Link to="/owner/vehicles/new">
                <Button>+ Add your first vehicle</Button>
              </Link>
            </div>
          </div>
        ) : (
          <div className="mt-3 flex flex-col gap-2">
            {analytics?.recentBookings.map((b) => (
              <Link
                key={b._id}
                to={`/bookings/${b._id}`}
                className="flex items-center justify-between rounded-xl border border-paper-line bg-paper-soft p-4 hover:shadow-sm"
              >
                <div>
                  <p className="text-sm font-medium text-ink">{b.vehicle.title}</p>
                  <p className="text-xs text-slate">
                    {b.customer.name} · {b.bookingCode}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-ink">₹{b.pricing.totalAmount.toLocaleString('en-IN')}</span>
                  <Badge tone={BOOKING_STATUS_TONE[b.status as keyof typeof BOOKING_STATUS_TONE]}>
                    {BOOKING_STATUS_LABEL[b.status as keyof typeof BOOKING_STATUS_LABEL]}
                  </Badge>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
      </FadeIn>
    </DashboardLayout>
  );
}
