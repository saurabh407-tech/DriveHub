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
      <section className="mx-auto max-w-5xl px-6 py-20">
        <span className="text-xs font-medium uppercase tracking-wider text-slate">Features</span>
        <h1 className="mt-3 font-display text-3xl font-semibold text-ink sm:text-4xl">
          Built for renters, owners, and the people running the platform.
        </h1>

        <div className="mt-8 flex flex-wrap gap-2">
          {(Object.keys(ROLE_LABELS) as RoleKey[]).map((key) => (
            <button
              key={key}
              onClick={() => setRole(key)}
              className={`rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
                role === key ? 'border-route bg-route/10 text-ink' : 'border-paper-line text-slate hover:border-ink/20'
              }`}
            >
              {ROLE_LABELS[key]}
            </button>
          ))}
        </div>

        <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2">
          {ROLE_FEATURES[role].map((f) => (
            <div key={f.title} className="rounded-2xl border border-paper-line bg-paper-soft p-6">
              <h3 className="font-display text-base font-semibold text-ink">{f.title}</h3>
              <p className="mt-2 text-sm text-slate">{f.description}</p>
            </div>
          ))}
        </div>
      </section>
    </MarketingLayout>
  );
}