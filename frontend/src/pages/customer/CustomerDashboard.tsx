// import { useEffect, useState } from 'react';
// import { Link } from 'react-router-dom';
// import { DashboardLayout } from '@/components/layout/DashboardLayout';
// import { StatCard, Badge } from '@/components/ui/Card';
// import { EmptyState } from '@/components/ui/EmptyState';
// import { Button } from '@/components/ui/Button';
// import { useAppSelector } from '@/hooks/useAppRedux';
// import { getCustomerAnalytics } from '@/services/analyticsApi';
// import type { CustomerAnalytics } from '@/services/analyticsApi';
// import { FadeIn } from '@/components/ui/FadeIn';

// export default function CustomerDashboard() {
//   const user = useAppSelector((s) => s.auth.user);
//   const [analytics, setAnalytics] = useState<CustomerAnalytics | null>(null);

//   useEffect(() => {
//     getCustomerAnalytics().then((res) => setAnalytics(res.data));
//   }, []);

//   return (
//     <DashboardLayout>
//       <FadeIn>
//       <div className="flex items-center justify-between">
//         <div>
//           <h1 className="font-display text-2xl font-semibold text-ink">Welcome back, {user?.name?.split(' ')[0]}</h1>
//           <p className="mt-1 text-sm text-slate">Here's what's happening with your account.</p>
//         </div>
//         <Badge tone={user?.isEmailVerified ? 'success' : 'warning'}>
//           {user?.isEmailVerified ? 'Email verified' : 'Email unverified'}
//         </Badge>
//       </div>

//       <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-4">
//         <StatCard label="Total bookings" value={String(analytics?.totalBookings ?? '—')} />
//         <StatCard label="Upcoming trips" value={String(analytics?.upcomingBookings ?? '—')} />
//         <StatCard label="Completed trips" value={String(analytics?.completedTrips ?? '—')} />
//         <StatCard label="Total spent" value={analytics ? `₹${analytics.totalSpent.toLocaleString('en-IN')}` : '—'} />
//       </div>

//       {analytics && analytics.totalBookings === 0 && (
//         <div className="mt-8">
//           <EmptyState
//             title="No bookings yet"
//             description="Browse the vehicles already listed on DriveHub and book your first ride."
//           />
//           <div className="mt-4 flex justify-center">
//             <Link to="/vehicles">
//               <Button variant="secondary">Browse vehicles</Button>
//             </Link>
//           </div>
//         </div>
//       )}
//       </FadeIn>
//     </DashboardLayout>
//   );
// }



import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  CalendarDays,
  Car,
  CheckCircle2,
  Clock3,
  CreditCard,
  MapPin,
  Search,
  ShieldCheck,
  Sparkles,
  Wallet,
} from 'lucide-react';

import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Badge } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useAppSelector } from '@/hooks/useAppRedux';
import { getCustomerAnalytics } from '@/services/analyticsApi';
import type { CustomerAnalytics } from '@/services/analyticsApi';
import { FadeIn } from '@/components/ui/FadeIn';

export default function CustomerDashboard() {
  const user = useAppSelector((s) => s.auth.user);

  const [analytics, setAnalytics] =
    useState<CustomerAnalytics | null>(null);

  useEffect(() => {
    getCustomerAnalytics()
      .then((res) => setAnalytics(res.data))
      .catch((error) => {
        console.error('Failed to load customer analytics:', error);
      });
  }, []);

  const firstName = user?.name?.split(' ')[0] || 'Customer';

  const stats = [
    {
      label: 'Total Bookings',
      value: String(analytics?.totalBookings ?? '—'),
      icon: CalendarDays,
      description: 'All your vehicle bookings',
      iconClass: 'bg-violet-100 text-violet-700',
    },
    {
      label: 'Upcoming Trips',
      value: String(analytics?.upcomingBookings ?? '—'),
      icon: Clock3,
      description: 'Trips planned ahead',
      iconClass: 'bg-sky-100 text-sky-700',
    },
    {
      label: 'Completed Trips',
      value: String(analytics?.completedTrips ?? '—'),
      icon: CheckCircle2,
      description: 'Successfully completed',
      iconClass: 'bg-emerald-100 text-emerald-700',
    },
    {
      label: 'Total Spent',
      value: analytics
        ? `₹${analytics.totalSpent.toLocaleString('en-IN')}`
        : '—',
      icon: Wallet,
      description: 'Your total booking amount',
      iconClass: 'bg-amber-100 text-amber-700',
    },
  ];

  return (
    <DashboardLayout>
      <FadeIn>
        <div className="space-y-7">

          {/* Welcome Hero Section */}
          <section className="relative overflow-hidden rounded-3xl border border-white/70 bg-gradient-to-r from-[#5b2c6f] via-[#7c3f8c] to-[#a85db4] p-7 shadow-xl sm:p-9">

            {/* Decorative circles */}
            <div className="absolute -right-16 -top-16 h-52 w-52 rounded-full bg-white/10" />
            <div className="absolute -bottom-20 right-32 h-48 w-48 rounded-full bg-white/10" />
            <div className="absolute left-1/2 top-0 h-full w-1/3 -skew-x-12 bg-white/5" />

            <div className="relative z-10 flex flex-col justify-between gap-6 lg:flex-row lg:items-center">

              <div>
                <div className="mb-3 flex w-fit items-center gap-2 rounded-full border border-white/25 bg-white/10 px-4 py-1.5 text-xs font-semibold text-white backdrop-blur">
                  <Sparkles className="h-4 w-4" />
                  DRIVE SMART WITH DRIVEHUB
                </div>

                <h1 className="font-display text-3xl font-bold text-white sm:text-4xl">
                  Welcome back, {firstName}! 👋
                </h1>

                <p className="mt-3 max-w-xl text-sm leading-6 text-white/80 sm:text-base">
                  Find the right vehicle for every journey. Browse,
                  compare, and book your next ride easily with DriveHub.
                </p>
              </div>

              <Link to="/vehicles">
                <button className="flex items-center justify-center gap-2 rounded-xl bg-white px-6 py-3.5 text-sm font-bold text-[#6d367c] shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-xl">
                  <Search className="h-4 w-4" />
                  Explore Vehicles
                </button>
              </Link>

            </div>
          </section>

          {/* Dashboard Heading */}
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">

            <div>
              <h2 className="font-display text-2xl font-bold text-ink">
                Your Dashboard
              </h2>

              <p className="mt-1 text-sm text-slate">
                Track your bookings, trips, and account activity.
              </p>
            </div>

            <Badge
              tone={
                user?.isEmailVerified
                  ? 'success'
                  : 'warning'
              }
            >
              {user?.isEmailVerified
                ? '✓ Email verified'
                : 'Email unverified'}
            </Badge>

          </div>

          {/* Statistics Cards */}
          <section className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">

            {stats.map((stat) => {
              const Icon = stat.icon;

              return (
                <div
                  key={stat.label}
                  className="group rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
                >

                  <div className="flex items-start justify-between">

                    <div
                      className={`flex h-12 w-12 items-center justify-center rounded-xl ${stat.iconClass}`}
                    >
                      <Icon className="h-6 w-6" />
                    </div>

                    <span className="rounded-full bg-slate-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate">
                      Overview
                    </span>

                  </div>

                  <p className="mt-5 text-xs font-bold uppercase tracking-wider text-slate">
                    {stat.label}
                  </p>

                  <h3 className="mt-2 text-3xl font-extrabold text-ink">
                    {stat.value}
                  </h3>

                  <p className="mt-2 text-xs text-slate">
                    {stat.description}
                  </p>

                </div>
              );
            })}

          </section>

          {/* Main Content */}
          <section className="grid grid-cols-1 gap-6 xl:grid-cols-3">

            {/* Quick Actions */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm xl:col-span-2">

              <div className="flex items-center justify-between">

                <div>
                  <h2 className="text-lg font-bold text-ink">
                    Quick Actions
                  </h2>

                  <p className="mt-1 text-sm text-slate">
                    Everything you need for your next journey.
                  </p>
                </div>

                <Car className="h-8 w-8 text-[#8b4d9b]/30" />

              </div>

              <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">

                <Link
                  to="/vehicles"
                  className="group rounded-2xl border border-[#8b4d9b]/15 bg-gradient-to-br from-[#f9effa] to-white p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
                >

                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#8b4d9b] text-white">
                    <Car className="h-5 w-5" />
                  </div>

                  <h3 className="mt-4 font-bold text-ink">
                    Find a Vehicle
                  </h3>

                  <p className="mt-1 text-sm leading-5 text-slate">
                    Browse available vehicles and book your next ride.
                  </p>

                  <span className="mt-4 inline-block text-sm font-bold text-[#7c3f8c]">
                    Browse vehicles →
                  </span>

                </Link>

                <Link
                  to="/customer/bookings"
                  className="group rounded-2xl border border-sky-100 bg-gradient-to-br from-sky-50 to-white p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
                >

                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-sky-600 text-white">
                    <CalendarDays className="h-5 w-5" />
                  </div>

                  <h3 className="mt-4 font-bold text-ink">
                    My Bookings
                  </h3>

                  <p className="mt-1 text-sm leading-5 text-slate">
                    View your upcoming and previous vehicle bookings.
                  </p>

                  <span className="mt-4 inline-block text-sm font-bold text-sky-700">
                    View bookings →
                  </span>

                </Link>

              </div>

            </div>

            {/* Account Status */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

              <div className="flex items-center gap-3">

                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                  <ShieldCheck className="h-6 w-6" />
                </div>

                <div>
                  <h2 className="font-bold text-ink">
                    Account Status
                  </h2>

                  <p className="text-xs text-slate">
                    Your DriveHub profile
                  </p>
                </div>

              </div>

              <div className="mt-7 space-y-5">

                <div className="flex items-center justify-between">

                  <div className="flex items-center gap-3">

                    <div className="h-2.5 w-2.5 rounded-full bg-emerald-500" />

                    <span className="text-sm font-medium text-ink">
                      Account created
                    </span>

                  </div>

                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />

                </div>

                <div className="flex items-center justify-between">

                  <div className="flex items-center gap-3">

                    <div
                      className={`h-2.5 w-2.5 rounded-full ${
                        user?.isEmailVerified
                          ? 'bg-emerald-500'
                          : 'bg-amber-500'
                      }`}
                    />

                    <span className="text-sm font-medium text-ink">
                      Email verification
                    </span>

                  </div>

                  {user?.isEmailVerified ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  ) : (
                    <Clock3 className="h-4 w-4 text-amber-600" />
                  )}

                </div>

                <div className="border-t border-slate-100 pt-5">

                  <p className="text-xs font-semibold uppercase tracking-wider text-slate">
                    DriveHub Benefits
                  </p>

                  <div className="mt-4 space-y-3">

                    <div className="flex items-center gap-2 text-sm text-slate">
                      <MapPin className="h-4 w-4 text-[#8b4d9b]" />
                      Easy vehicle discovery
                    </div>

                    <div className="flex items-center gap-2 text-sm text-slate">
                      <CreditCard className="h-4 w-4 text-[#8b4d9b]" />
                      Secure booking process
                    </div>

                  </div>

                </div>

              </div>

            </div>

          </section>

          {/* Empty Booking Section */}
          {analytics && analytics.totalBookings === 0 && (

            <section className="rounded-3xl border border-dashed border-[#8b4d9b]/30 bg-gradient-to-r from-[#fbf3fc] via-white to-[#f7eff9] p-8 text-center shadow-sm">

              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#8b4d9b]/10 text-[#7c3f8c]">
                <Car className="h-8 w-8" />
              </div>

              <h2 className="mt-5 text-xl font-bold text-ink">
                Ready for your first journey?
              </h2>

              <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-slate">
                You have not booked a vehicle yet. Explore DriveHub
                and find the perfect vehicle for your next trip.
              </p>

              <div className="mt-6">

                <Link to="/vehicles">

                  <Button variant="secondary">
                    <span className="flex items-center gap-2">
                      <Search className="h-4 w-4" />
                      Browse Vehicles
                    </span>
                  </Button>

                </Link>

              </div>

            </section>

          )}

        </div>
      </FadeIn>
    </DashboardLayout>
  );
}