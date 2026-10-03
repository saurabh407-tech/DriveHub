import { useState } from 'react';
import { MarketingLayout } from '@/components/layout/MarketingLayout';

type RoleKey = 'customer' | 'owner' | 'admin';

const ROLE_FEATURES: Record<RoleKey, { title: string; description: string }[]> = {
  customer: [
    { title: 'Search & filter', description: 'City, category, fuel type, transmission, seats, price range, and free-text search.' },
    { title: 'Transparent pricing', description: 'Day-rate, discounts, GST, and a refundable deposit shown before you book.' },
    { title: 'Secure checkout', description: 'Razorpay-backed payment with an automatic PDF invoice on success.' },
    { title: 'Live trip tracking', description: "Share your location during a trip, or see the vehicle owner's, right on the map." },
    { title: 'Direct messaging', description: 'Chat with the owner about pickup details — no phone number exchange needed.' },
    { title: 'Booking history', description: 'Every past and upcoming trip, with status, price breakdown, and invoice, in one place.' },
  ],
  owner: [
    { title: 'Vehicle listings', description: 'Add vehicles with photos, pricing, and location in a few steps.' },
    { title: 'Document verification', description: 'Upload RC and insurance; get admin-reviewed before going live.' },
    { title: 'Booking management', description: 'See every booking against your fleet, with customer details and status.' },
    { title: 'Revenue dashboard', description: 'Real monthly revenue and booking charts, computed from actual transactions.' },
    { title: 'Trip lifecycle control', description: 'Mark trips started and completed, and track them live while ongoing.' },
    { title: 'Cancellation handling', description: 'A clear, time-based refund policy applied automatically on cancellation.' },
  ],
  admin: [
    { title: 'Verification queue', description: 'Review and approve or reject vehicle listings before they go public.' },
    { title: 'User management', description: 'Ban or reinstate accounts, with an audit trail of every action.' },
    { title: 'Platform analytics', description: 'Total users, vehicles, bookings, and revenue, aggregated in real time.' },
    { title: 'Dispute visibility', description: 'A dedicated view of every cancelled or rejected booking on the platform.' },
    { title: 'Broadcast notifications', description: 'Send a message to every active user, delivered instantly.' },
  ],
};

const ROLE_LABELS: Record<RoleKey, string> = {
  customer: 'For renters',
  owner: 'For vehicle owners',
  admin: 'For admins',
};

export default function FeaturesPage() {
  const [role, setRole] = useState<RoleKey>('customer');

  return (
    <MarketingLayout>
      <section className="mx-auto max-w-5xl px-3.5 sm:px-6 py-12 sm:py-24">
        <div className="relative">
          <div className="relative z-10">
            <span className="inline-flex items-center gap-2.5 rounded-full border border-amber-400/50 bg-gradient-to-r from-amber-500/25 via-amber-400/15 to-orange-500/20 px-5 py-2 text-xs sm:text-sm font-extrabold uppercase tracking-widest text-amber-200 backdrop-blur-xl shadow-[0_0_20px_rgba(245,158,11,0.25),inset_0_1px_1px_rgba(255,255,255,0.35)]">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-400 shadow-[0_0_10px_#fbbf24]" />
              </span>
              <span className="drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)]">⚡ Key Features</span>
            </span>
            <h1 className="mt-4 font-display text-3xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight drop-shadow-[0_2px_12px_rgba(0,0,0,0.85)]">
              Built for renters, owners, and the people{' '}
              <span className="bg-gradient-to-r from-amber-400 via-orange-400 to-amber-200 bg-clip-text text-transparent">
                running the platform.
              </span>
            </h1>

            <div className="mt-8 flex flex-wrap gap-2.5">
              {(Object.keys(ROLE_LABELS) as RoleKey[]).map((key) => (
                <button
                  key={key}
                  onClick={() => setRole(key)}
                  className={`rounded-xl border px-4 py-2.5 text-xs sm:text-sm font-bold transition-all ${
                    role === key
                      ? 'border-amber-400 bg-amber-500/30 text-amber-200 shadow-md shadow-amber-500/25 scale-[1.02]'
                      : 'border-white/20 bg-white/[0.10] text-white/90 hover:bg-white/[0.18] hover:text-white hover:border-white/40'
                  }`}
                >
                  {ROLE_LABELS[key]}
                </button>
              ))}
            </div>

            <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2">
              {ROLE_FEATURES[role].map((f) => (
                <div
                  key={f.title}
                  className="rounded-2xl border border-white/15 bg-gradient-to-b from-white/[0.08] via-black/[0.25] to-black/[0.45] p-6 backdrop-blur-xl shadow-[0_12px_28px_rgba(0,0,0,0.35),inset_0_1px_1px_rgba(255,255,255,0.15)] hover:border-amber-400/50 hover:scale-[1.01] transition-all"
                >
                  <div className="flex items-start gap-3.5">
                    <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-amber-500/25 border border-amber-400/50 text-amber-300 text-xs font-bold mt-0.5 shadow-sm">
                      ✓
                    </span>
                    <div>
                      <h3 className="font-display text-base font-bold text-white drop-shadow-[0_1px_4px_rgba(0,0,0,0.85)]">{f.title}</h3>
                      <p className="mt-1.5 text-sm text-white/80 leading-relaxed font-medium drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)]">{f.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </MarketingLayout>
  );
}