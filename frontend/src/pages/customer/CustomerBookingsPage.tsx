


import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  CalendarDays,
  Car,
  CheckCircle2,
  Clock3,
  Search,
  Sparkles,
} from 'lucide-react';

import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { BookingCard } from '@/components/bookings/BookingCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { SkeletonList } from '@/components/ui/Skeleton';
import { Button } from '@/components/ui/Button';
import { listMyBookingsAsCustomer } from '@/services/bookingApi';
import type { Booking } from '@/services/bookingApi';
import { FadeIn } from '@/components/ui/FadeIn';

export default function CustomerBookingsPage() {
  const location = useLocation();

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const justBooked =
    (location.state as { justBooked?: boolean } | null)?.justBooked;

  useEffect(() => {
    listMyBookingsAsCustomer()
      .then((res) => setBookings(res.data.bookings))
      .catch((error) => {
        console.error('Failed to load bookings:', error);
      })
      .finally(() => setIsLoading(false));
  }, []);

  /*
    Booking status names can be different in your backend.
    This safely checks common values.
  */
  const bookingStats = useMemo(() => {
    const upcoming = bookings.filter((booking) =>
      ['pending', 'confirmed', 'approved', 'upcoming'].includes(
        String(booking.status).toLowerCase()
      )
    ).length;

    const completed = bookings.filter(
      (booking) =>
        String(booking.status).toLowerCase() === 'completed'
    ).length;

    return {
      total: bookings.length,
      upcoming,
      completed,
    };
  }, [bookings]);

  return (
    <DashboardLayout>
      <FadeIn>
        <div className="space-y-7">

          {/* Premium Header */}
          <section className="relative overflow-hidden rounded-3xl border border-white/60 bg-gradient-to-r from-[#5b2c6f] via-[#7c3f8c] to-[#a85db4] p-7 shadow-xl sm:p-9">

            {/* Decorative background */}
            <div className="absolute -right-16 -top-16 h-52 w-52 rounded-full bg-white/10" />
            <div className="absolute -bottom-24 right-28 h-56 w-56 rounded-full bg-white/10" />
            <div className="absolute left-[45%] top-0 h-full w-40 -skew-x-12 bg-white/5" />

            <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">

              <div>
                <div className="mb-3 flex w-fit items-center gap-2 rounded-full border border-white/25 bg-white/10 px-4 py-1.5 text-xs font-bold tracking-wide text-white backdrop-blur">
                  <Sparkles className="h-4 w-4" />
                  DRIVEHUB JOURNEYS
                </div>

                <h1 className="font-display text-3xl font-bold text-white sm:text-4xl">
                  Your Bookings
                </h1>

                <p className="mt-3 max-w-xl text-sm leading-6 text-white/80 sm:text-base">
                  Manage your upcoming rides, review past journeys,
                  and keep track of every vehicle booking in one place.
                </p>
              </div>

              <Link to="/vehicles">
                <button className="flex items-center justify-center gap-2 rounded-xl bg-white px-6 py-3.5 text-sm font-bold text-[#6d367c] shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-xl">
                  <Search className="h-4 w-4" />
                  Find a Vehicle
                </button>
              </Link>

            </div>
          </section>

          {/* Page Information */}
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">

            <div>
              <h2 className="text-2xl font-bold text-ink">
                Booking Overview
              </h2>

              <p className="mt-1 text-sm text-slate">
                View and manage all your vehicle reservations.
              </p>
            </div>

            {!isLoading && (
              <span className="rounded-full border border-[#8b4d9b]/20 bg-[#8b4d9b]/5 px-4 py-2 text-xs font-semibold text-[#6d367c]">
                {bookingStats.total}{' '}
                {bookingStats.total === 1
                  ? 'Booking'
                  : 'Bookings'}
              </span>
            )}

          </div>

          {/* Booking Statistics */}
          <section className="grid grid-cols-1 gap-5 sm:grid-cols-3">

            {/* Total */}
            <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">

              <div className="flex items-center justify-between">

                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-violet-100 text-violet-700">
                  <CalendarDays className="h-6 w-6" />
                </div>

                <span className="text-xs font-bold uppercase tracking-wider text-slate">
                  All time
                </span>

              </div>

              <p className="mt-5 text-xs font-bold uppercase tracking-wider text-slate">
                Total Bookings
              </p>

              <h3 className="mt-2 text-3xl font-extrabold text-ink">
                {isLoading ? '—' : bookingStats.total}
              </h3>

              <p className="mt-2 text-xs text-slate">
                All vehicle reservations
              </p>

            </div>

            {/* Upcoming */}
            <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">

              <div className="flex items-center justify-between">

                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-sky-100 text-sky-700">
                  <Clock3 className="h-6 w-6" />
                </div>

                <span className="text-xs font-bold uppercase tracking-wider text-slate">
                  Active
                </span>

              </div>

              <p className="mt-5 text-xs font-bold uppercase tracking-wider text-slate">
                Upcoming Trips
              </p>

              <h3 className="mt-2 text-3xl font-extrabold text-ink">
                {isLoading ? '—' : bookingStats.upcoming}
              </h3>

              <p className="mt-2 text-xs text-slate">
                Trips waiting to begin
              </p>

            </div>

            {/* Completed */}
            <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">

              <div className="flex items-center justify-between">

                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                  <CheckCircle2 className="h-6 w-6" />
                </div>

                <span className="text-xs font-bold uppercase tracking-wider text-slate">
                  Finished
                </span>

              </div>

              <p className="mt-5 text-xs font-bold uppercase tracking-wider text-slate">
                Completed Trips
              </p>

              <h3 className="mt-2 text-3xl font-extrabold text-ink">
                {isLoading ? '—' : bookingStats.completed}
              </h3>

              <p className="mt-2 text-xs text-slate">
                Successfully completed trips
              </p>

            </div>

          </section>

          {/* Booking Confirmation */}
          {justBooked && (
            <div className="flex items-start gap-4 rounded-2xl border border-emerald-200 bg-gradient-to-r from-emerald-50 to-white p-5 shadow-sm">

              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                <CheckCircle2 className="h-6 w-6" />
              </div>

              <div>
                <h3 className="font-bold text-emerald-900">
                  Booking Confirmed Successfully!
                </h3>

                <p className="mt-1 text-sm leading-6 text-emerald-700">
                  Your vehicle reservation has been created.
                  You can review the complete booking details below.
                </p>
              </div>

            </div>
          )}

          {/* Booking List */}
          <section className="rounded-3xl border border-slate-200/80 bg-white/80 p-5 shadow-sm backdrop-blur sm:p-7">

            <div className="mb-6 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">

              <div>
                <h2 className="text-xl font-bold text-ink">
                  Your Rental History
                </h2>

                <p className="mt-1 text-sm text-slate">
                  Upcoming, active, and completed bookings.
                </p>
              </div>

              <div className="flex items-center gap-2 rounded-lg bg-[#8b4d9b]/5 px-3 py-2 text-xs font-semibold text-[#6d367c]">

                <Car className="h-4 w-4" />

                {!isLoading
                  ? `${bookingStats.total} booking${
                      bookingStats.total === 1 ? '' : 's'
                    }`
                  : 'Loading bookings...'}

              </div>

            </div>

            <div className="flex flex-col gap-5">

              {isLoading ? (

                <SkeletonList
                  count={3}
                  className="rounded-2xl"
                />

              ) : bookings.length === 0 ? (

                <div className="rounded-2xl border border-dashed border-[#8b4d9b]/30 bg-gradient-to-br from-[#fbf3fc] via-white to-[#f7eff9] py-12">

                  <EmptyState
                    title="No bookings yet"
                    description="Your next journey is waiting. Browse available vehicles and make your first booking."
                  />

                  <div className="mt-5 flex justify-center">

                    <Link to="/vehicles">

                      <Button variant="secondary">

                        <span className="flex items-center gap-2">
                          <Car className="h-4 w-4" />
                          Browse Vehicles
                        </span>

                      </Button>

                    </Link>

                  </div>

                </div>

              ) : (

                bookings.map((booking) => (

                  <div
                    key={booking._id}
                    className="overflow-hidden rounded-2xl transition-all duration-300 hover:shadow-lg"
                  >

                    <BookingCard
                      booking={booking}
                      viewerRole="customer"
                    />

                  </div>

                ))

              )}

            </div>

          </section>

        </div>
      </FadeIn>
    </DashboardLayout>
  );
}