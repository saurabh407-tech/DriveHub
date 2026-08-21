import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { BookingCard } from '@/components/bookings/BookingCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { SkeletonList } from '@/components/ui/Skeleton';
import { listMyBookingsAsOwner } from '@/services/bookingApi';
import type { Booking } from '@/services/bookingApi';

export default function OwnerBookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    listMyBookingsAsOwner()
      .then((res) => setBookings(res.data.bookings))
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <DashboardLayout>
      <h1 className="font-display text-2xl font-semibold text-ink">Bookings on your fleet</h1>
      <p className="mt-1 text-sm text-slate">Every reservation made against your vehicles.</p>

      <div className="mt-6 flex flex-col gap-4">
        {isLoading ? (
          <SkeletonList count={3} className="rounded-2xl" />
        ) : bookings.length === 0 ? (
          <EmptyState title="No bookings yet" description="Once customers book your vehicles, they'll show up here." />
        ) : (
          bookings.map((b) => <BookingCard key={b._id} booking={b} viewerRole="owner" />)
        )}
      </div>
    </DashboardLayout>
  );
}
