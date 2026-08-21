import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { BookingCard } from '@/components/bookings/BookingCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { SkeletonList } from '@/components/ui/Skeleton';
import { adminListAllBookings } from '@/services/bookingApi';
import type { Booking } from '@/services/bookingApi';

const DISPUTE_STATUSES: Booking['status'][] = ['cancelled_by_customer', 'cancelled_by_owner', 'rejected'];

export default function AdminDisputesPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    adminListAllBookings()
      .then((res) => setBookings(res.data.bookings.filter((b) => DISPUTE_STATUSES.includes(b.status))))
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <DashboardLayout>
      <h1 className="font-display text-2xl font-semibold text-ink">Disputes &amp; cancellations</h1>
      <p className="mt-1 text-sm text-slate">Bookings cancelled or rejected across the platform.</p>

      <div className="mt-6 flex flex-col gap-4">
        {isLoading ? (
          <SkeletonList count={3} className="rounded-2xl" />
        ) : bookings.length === 0 ? (
          <EmptyState title="Nothing to review" description="No cancelled or rejected bookings right now." />
        ) : (
          bookings.map((b) => <BookingCard key={b._id} booking={b} viewerRole="owner" />)
        )}
      </div>
    </DashboardLayout>
  );
}
