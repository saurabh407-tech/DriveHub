import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MarketingLayout } from '@/components/layout/MarketingLayout';
import { Button } from '@/components/ui/Button';
import { RouteMap } from '@/components/ui/RouteMap';

const FEATURES = [
  {
    title: 'Verified vehicles',
    description: 'Every listing is document-checked and admin-approved before it ever appears in search.',
    icon: (
      <path
        d="M9 12l2 2 4-4m5 2a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    ),
  },
  {
    title: 'Secure payments',
    description: 'Razorpay-backed checkout with automatic invoices and a transparent refund policy.',
    icon: (
      <path
        d="M3 7a2 2 0 0 1 2-2h13a1 1 0 0 1 1 1v3M3 7v11a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-6a1 1 0 0 0-1-1h-4a2 2 0 1 0 0 4h5"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    ),
  },
  {
    title: 'Real-time chat',
    description: 'Message the owner or renter directly, right inside your booking — no phone numbers needed.',
    icon: (
      <path
        d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    ),
  },
  {
    title: 'Live trip tracking',
    description: 'Share and follow a live location during an active trip — right on the map, no extra app.',
    icon: (
      <path
        d="M12 21s-7-5.686-7-11a7 7 0 1 1 14 0c0 5.314-7 11-7 11ZM12 13a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    ),
  },
  {
    title: 'Instant booking',
    description: 'Pick your dates, see the price up front, and book in a couple of clicks — no back and forth.',
    icon: <path d="M4 5h16v15H4zM4 9h16M8 3v4M16 3v4" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />,
  },
  {
    title: 'Built-in analytics',
    description: 'Owners get real revenue and booking dashboards; admins get platform-wide visibility.',
    icon: <path d="M4 20V10M11 20V4M18 20v-7" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />,
  },
];

const STEPS = [
  { title: 'Search', description: 'Filter by city, category, price, and dates to find the right vehicle.' },
  { title: 'Book', description: 'See the full price breakdown up front, then confirm and pay securely.' },
  { title: 'Drive', description: 'Pick up, track the trip live, and message the other side if you need to.' },
];

export default function LandingPage() {
  return (
    <MarketingLayout>
      {/* Hero */}
      <section className="mx-auto max-w-6xl px-6 pb-20 pt-16 sm:pt-24">
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          >
            <span className="inline-flex items-center rounded-full border border-paper-line bg-paper-soft px-3 py-1 text-xs font-medium text-slate">
              Smart vehicle rental & fleet management
            </span>
            <h1 className="mt-5 font-display text-4xl font-semibold leading-tight text-ink sm:text-5xl">
              Rent a vehicle in minutes.
              <br />
              List your fleet in an afternoon.
            </h1>
            <p className="mt-5 max-w-md text-base text-slate">
              DriveHub connects renters with verified vehicle owners — with secure payments, live trip
              tracking, and direct messaging built in from day one.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/register">
                <Button size="lg">Get started</Button>
              </Link>
              <Link to="/vehicles">
                <Button size="lg" variant="secondary">
                  Browse vehicles
                </Button>
              </Link>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.1, ease: 'easeOut' }}
            className="overflow-hidden rounded-3xl border border-paper-line bg-ink shadow-xl"
          >
            <div className="aspect-[4/3]">
              <RouteMap />
            </div>
          </motion.div>
        </div>
      </section>

      {/* How it works */}
      <section className="border-t border-paper-line bg-paper-soft py-20">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="font-display text-2xl font-semibold text-ink sm:text-3xl">How it works</h2>
          <div className="mt-10 grid grid-cols-1 gap-8 sm:grid-cols-3">
            {STEPS.map((step, i) => (
              <div key={step.title}>
                <span className="font-display text-sm font-semibold text-route-dim">0{i + 1}</span>
                <h3 className="mt-2 font-display text-lg font-semibold text-ink">{step.title}</h3>
                <p className="mt-2 text-sm text-slate">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="font-display text-2xl font-semibold text-ink sm:text-3xl">Everything you need, built in</h2>
          <p className="mt-2 max-w-xl text-sm text-slate">
            No third-party add-ons required to get a full rental experience running end to end.
          </p>
          <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f) => (
              <div key={f.title} className="rounded-2xl border border-paper-line bg-paper-soft p-6">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-route/10 text-route-dim">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="h-5 w-5" aria-hidden="true">
                    {f.icon}
                  </svg>
                </div>
                <h3 className="mt-4 font-display text-base font-semibold text-ink">{f.title}</h3>
                <p className="mt-1.5 text-sm text-slate">{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA banner */}
      <section className="border-t border-paper-line bg-ink py-16">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-6 px-6 text-center sm:flex-row sm:justify-between sm:text-left">
          <div>
            <h2 className="font-display text-2xl font-semibold text-paper">Ready to get on the road?</h2>
            <p className="mt-2 text-sm text-mist">
              Create an account as a renter or a vehicle owner — takes under a minute.
            </p>
          </div>
          <Link to="/register">
            <Button size="lg">Get started</Button>
          </Link>
        </div>
      </section>
    </MarketingLayout>
  );
}