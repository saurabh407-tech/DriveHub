import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { User, Mail, MessageSquare, Send, CheckCircle2 } from 'lucide-react';
import { MarketingLayout } from '@/components/layout/MarketingLayout';
import { Button } from '@/components/ui/Button';
import { useAppSelector } from '@/hooks/useAppRedux';
import { sendContactMessage } from '@/services/contactApi';

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

const FEATURE_THEMES = [
  {
    // 01 Verified vehicles - Transparent Emerald Glass (harmonizes with roadside greenery)
    cardBg: 'bg-gradient-to-b from-emerald-500/[0.10] via-white/[0.04] to-black/[0.30] hover:bg-emerald-500/[0.16]',
    border: 'border-emerald-400/30 hover:border-emerald-400/60',
    shadow: 'shadow-[0_15px_35px_rgba(0,0,0,0.35),inset_0_1px_1px_rgba(110,231,183,0.3)] hover:shadow-[0_20px_40px_rgba(16,185,129,0.25)]',
    badge: 'bg-emerald-500/20 border border-emerald-400/50 text-emerald-300 shadow-[0_0_20px_rgba(16,185,129,0.35)]',
    title: 'text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]',
    desc: 'text-white/80 drop-shadow-[0_1px_4px_rgba(0,0,0,0.85)]',
    footerText: 'text-emerald-300',
    footerBorder: 'border-white/10',
  },
  {
    // 02 Secure payments - Transparent Warm Amber / Sunset Gold (harmonizes with sunlight)
    cardBg: 'bg-gradient-to-b from-amber-500/[0.10] via-white/[0.04] to-black/[0.30] hover:bg-amber-500/[0.16]',
    border: 'border-amber-400/30 hover:border-amber-400/60',
    shadow: 'shadow-[0_15px_35px_rgba(0,0,0,0.35),inset_0_1px_1px_rgba(252,211,77,0.3)] hover:shadow-[0_20px_40px_rgba(245,158,11,0.25)]',
    badge: 'bg-amber-500/20 border border-amber-400/50 text-amber-300 shadow-[0_0_20px_rgba(245,158,11,0.35)]',
    title: 'text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]',
    desc: 'text-white/80 drop-shadow-[0_1px_4px_rgba(0,0,0,0.85)]',
    footerText: 'text-amber-300',
    footerBorder: 'border-white/10',
  },
  {
    // 03 Real-time chat - Transparent Steel Cyan (harmonizes with clear sky)
    cardBg: 'bg-gradient-to-b from-cyan-500/[0.10] via-white/[0.04] to-black/[0.30] hover:bg-cyan-500/[0.16]',
    border: 'border-cyan-400/30 hover:border-cyan-400/60',
    shadow: 'shadow-[0_15px_35px_rgba(0,0,0,0.35),inset_0_1px_1px_rgba(103,232,249,0.3)] hover:shadow-[0_20px_40px_rgba(6,182,212,0.25)]',
    badge: 'bg-cyan-500/20 border border-cyan-400/50 text-cyan-300 shadow-[0_0_20px_rgba(6,182,212,0.35)]',
    title: 'text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]',
    desc: 'text-white/80 drop-shadow-[0_1px_4px_rgba(0,0,0,0.85)]',
    footerText: 'text-cyan-300',
    footerBorder: 'border-white/10',
  },
  {
    // 04 Live trip tracking - Transparent Indigo Twilight (harmonizes with dusk road)
    cardBg: 'bg-gradient-to-b from-indigo-500/[0.10] via-white/[0.04] to-black/[0.30] hover:bg-indigo-500/[0.16]',
    border: 'border-indigo-400/30 hover:border-indigo-400/60',
    shadow: 'shadow-[0_15px_35px_rgba(0,0,0,0.35),inset_0_1px_1px_rgba(165,180,252,0.3)] hover:shadow-[0_20px_40px_rgba(99,102,241,0.25)]',
    badge: 'bg-indigo-500/20 border border-indigo-400/50 text-indigo-300 shadow-[0_0_20px_rgba(99,102,241,0.35)]',
    title: 'text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]',
    desc: 'text-white/80 drop-shadow-[0_1px_4px_rgba(0,0,0,0.85)]',
    footerText: 'text-indigo-300',
    footerBorder: 'border-white/10',
  },
  {
    // 05 Instant booking - Transparent Sunset Terracotta (harmonizes with desert road shoulder)
    cardBg: 'bg-gradient-to-b from-orange-500/[0.10] via-white/[0.04] to-black/[0.30] hover:bg-orange-500/[0.16]',
    border: 'border-orange-400/30 hover:border-orange-400/60',
    shadow: 'shadow-[0_15px_35px_rgba(0,0,0,0.35),inset_0_1px_1px_rgba(253,186,116,0.3)] hover:shadow-[0_20px_40px_rgba(249,115,22,0.25)]',
    badge: 'bg-orange-500/20 border border-orange-400/50 text-orange-300 shadow-[0_0_20px_rgba(249,115,22,0.35)]',
    title: 'text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]',
    desc: 'text-white/80 drop-shadow-[0_1px_4px_rgba(0,0,0,0.85)]',
    footerText: 'text-orange-300',
    footerBorder: 'border-white/10',
  },
  {
    // 06 Built-in analytics - Transparent Taillight Rose / Copper (harmonizes with vehicle rear reflections)
    cardBg: 'bg-gradient-to-b from-rose-500/[0.10] via-white/[0.04] to-black/[0.30] hover:bg-rose-500/[0.16]',
    border: 'border-rose-400/30 hover:border-rose-400/60',
    shadow: 'shadow-[0_15px_35px_rgba(0,0,0,0.35),inset_0_1px_1px_rgba(253,164,175,0.3)] hover:shadow-[0_20px_40px_rgba(244,63,94,0.25)]',
    badge: 'bg-rose-500/20 border border-rose-400/50 text-rose-300 shadow-[0_0_20px_rgba(244,63,94,0.35)]',
    title: 'text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]',
    desc: 'text-white/80 drop-shadow-[0_1px_4px_rgba(0,0,0,0.85)]',
    footerText: 'text-rose-300',
    footerBorder: 'border-white/10',
  },
];

const ROLE_FEATURES = {
  customer: [
    { title: 'Search & filter', description: 'City, category, fuel type, transmission, seats, price range, and free-text search.' },
    { title: 'Transparent pricing', description: 'Day-rate, discounts, GST, and a refundable deposit shown before you book.' },
    { title: 'Secure checkout', description: 'Razorpay-backed payment with an automatic PDF invoice on success.' },
    { title: 'Live trip tracking', description: "Share your location during a trip, or see the vehicle owner's, right on the map." },
  ],
  owner: [
    { title: 'Vehicle listings', description: 'Add vehicles with photos, pricing, and location in a few steps.' },
    { title: 'Document verification', description: 'Upload RC and insurance; get admin-reviewed before going live.' },
    { title: 'Booking management', description: 'See every booking against your fleet, with customer details and status.' },
    { title: 'Revenue dashboard', description: 'Real monthly revenue and booking charts, computed from actual transactions.' },
  ],
  admin: [
    { title: 'Verification queue', description: 'Review and approve or reject vehicle listings before they go public.' },
    { title: 'User management', description: 'Ban or reinstate accounts, with an audit trail of every action.' },
    { title: 'Platform analytics', description: 'Total users, vehicles, bookings, and revenue, aggregated in real time.' },
    { title: 'Dispute visibility', description: 'A dedicated view of every cancelled or rejected booking on the platform.' },
  ],
};

const VALUES = [
  {
    title: 'Trust first',
    description: 'Every vehicle is document-verified and every payment is handled securely, before anything else.',
  },
  {
    title: 'Built for both sides',
    description: 'Renters get transparent pricing; owners get real tools — analytics, verification, and a fleet dashboard.',
  },
  {
    title: 'No hidden steps',
    description: 'What you see at checkout is what you pay. No surprise fees, no unclear cancellation terms.',
  },
];

const STEPS = [
  {
    title: 'Search',
    description: 'Filter by city, category, price, and dates to find the right vehicle.',
    icon: '🔍',
    cardBg: 'bg-gradient-to-b from-cyan-500/[0.12] via-white/[0.04] to-black/[0.30] hover:bg-cyan-500/[0.18]',
    border: 'border-cyan-400/35 hover:border-cyan-400/70',
    shadow: 'shadow-[0_15px_35px_rgba(0,0,0,0.35),inset_0_1px_1px_rgba(103,232,249,0.35)] hover:shadow-[0_20px_40px_rgba(6,182,212,0.25)]',
    badge: 'bg-cyan-500/25 border border-cyan-400/50 text-cyan-300',
    tag: 'text-cyan-300',
  },
  {
    title: 'Book',
    description: 'See the full price breakdown up front, then confirm and pay securely.',
    icon: '⚡',
    cardBg: 'bg-gradient-to-b from-amber-500/[0.12] via-white/[0.04] to-black/[0.30] hover:bg-amber-500/[0.18]',
    border: 'border-amber-400/35 hover:border-amber-400/70',
    shadow: 'shadow-[0_15px_35px_rgba(0,0,0,0.35),inset_0_1px_1px_rgba(252,211,77,0.35)] hover:shadow-[0_20px_40px_rgba(245,158,11,0.25)]',
    badge: 'bg-amber-500/25 border border-amber-400/50 text-amber-300',
    tag: 'text-amber-300',
  },
  {
    title: 'Drive',
    description: 'Pick up, track the trip live, and message the other side if you need to.',
    icon: '🚗',
    cardBg: 'bg-gradient-to-b from-emerald-500/[0.12] via-white/[0.04] to-black/[0.30] hover:bg-emerald-500/[0.18]',
    border: 'border-emerald-400/35 hover:border-emerald-400/70',
    shadow: 'shadow-[0_15px_35px_rgba(0,0,0,0.35),inset_0_1px_1px_rgba(110,231,183,0.35)] hover:shadow-[0_20px_40px_rgba(16,185,129,0.25)]',
    badge: 'bg-emerald-500/25 border border-emerald-400/50 text-emerald-300',
    tag: 'text-emerald-300',
  },
];

const POPULAR_CITIES = ['Delhi NCR', 'Mumbai', 'Bengaluru', 'Goa', 'Pune', 'Hyderabad', 'Jaipur'];
const CATEGORY_TABS = [
  { id: 'all', label: 'All', icon: '🚗' },
  { id: 'suv', label: 'SUVs', icon: '🚙' },
  { id: 'sedan', label: 'Sedans', icon: '🚘' },
  { id: 'bike', label: 'Bikes', icon: '🏍️' },
  { id: 'luxury', label: 'Luxury', icon: '✨' },
];

export default function LandingPage() {
  const { user } = useAppSelector((s) => s.auth);
  const [role, setRole] = useState<'customer' | 'owner' | 'admin'>('customer');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedCity, setSelectedCity] = useState('Delhi NCR');
  const [pickupDate, setPickupDate] = useState(() => {
    const d = new Date();
    return d.toISOString().split('T')[0];
  });
  const [dropoffDate, setDropoffDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 3);
    return d.toISOString().split('T')[0];
  });

  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactMessage, setContactMessage] = useState('');
  const [contactSending, setContactSending] = useState(false);
  const [contactStatus, setContactStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const onContactSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!contactName.trim() || !contactEmail.trim() || !contactMessage.trim()) return;

    setContactSending(true);
    setContactStatus(null);

    try {
      await sendContactMessage({
        name: contactName.trim(),
        email: contactEmail.trim(),
        message: contactMessage.trim(),
      });
      setContactStatus({
        type: 'success',
        message: 'Message delivered directly to admin (sourabhshukla8318@gmail.com)! We will contact you shortly.',
      });
      setContactName('');
      setContactEmail('');
      setContactMessage('');
    } catch {
      // Direct mailto fallback if backend is unreachable
      const subject = encodeURIComponent(`DriveHub Inquiry from ${contactName.trim()}`);
      const body = encodeURIComponent(`${contactMessage.trim()}\n\nFrom: ${contactName.trim()} (${contactEmail.trim()})`);
      window.location.href = `mailto:sourabhshukla8318@gmail.com?subject=${subject}&body=${body}`;
      setContactStatus({
        type: 'success',
        message: 'Mail client opened to dispatch directly to sourabhshukla8318@gmail.com.',
      });
    } finally {
      setContactSending(false);
    }
  };

  return (
    <MarketingLayout>
      {/* 1. COMMERCIAL VEHICLE RENTAL HERO SECTION - 2:4 WIDESCREEN RECTANGLE */}
      <section id="home" className="mx-auto max-w-[92rem] px-3 sm:px-6 lg:px-8 pt-0 pb-12 sm:pb-16">
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="relative p-4 sm:p-6 lg:p-8 mt-0 sm:mt-0.5"
        >

          {/* Top Row: Colorful Status Badges & List Fleet Link */}
          <div className="flex flex-wrap items-center justify-between gap-3 relative z-10">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="inline-flex items-center gap-2 rounded-full border border-emerald-400/50 bg-emerald-500/20 px-4 py-1 text-xs font-bold text-emerald-300 shadow-sm shadow-emerald-500/15 backdrop-blur-md">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                140+ Vehicles Ready for Rent
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-400/50 bg-amber-500/20 px-4 py-1 text-xs font-bold text-amber-200 shadow-sm shadow-amber-500/15 backdrop-blur-md">
                <span>⭐</span>
                <span>4.9/5 (12.5k+ Trips)</span>
              </span>
            </div>

            <Link
              to="/register"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-cyan-300 hover:text-cyan-200 bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-400/40 px-3.5 py-1 rounded-full shadow-sm shadow-cyan-500/15 backdrop-blur-md transition-all"
            >
              <span>Own a vehicle? List Your Fleet</span>
              <span>&rarr;</span>
            </Link>
          </div>

          {/* Hero Typography & Core Content (Widescreen 2:4 Proportions) */}
          <div className="mt-5 sm:mt-7 max-w-4xl relative z-10">
            <h1 className="font-display text-3xl sm:text-5xl lg:text-5xl font-extrabold tracking-tight text-white leading-[1.12] drop-shadow-[0_2px_12px_rgba(0,0,0,0.85)]">
              Rent Verified Cars & Bikes.{' '}
              <span className="bg-gradient-to-r from-amber-400 via-orange-400 to-amber-200 bg-clip-text text-transparent">
                Drive With Freedom.
              </span>
            </h1>
            <p className="mt-3 text-sm sm:text-base text-white/95 leading-relaxed max-w-3xl drop-shadow-[0_1px_6px_rgba(0,0,0,0.85)]">
              Doorstep delivery, 100% verified hosts, zero security deposit options, and 24/7 roadside assistance.
            </p>

            {/* Quick Hero CTA Buttons */}
            <div className="mt-5 flex flex-wrap items-center gap-3.5">
              <Link
                to={user ? '/vehicles' : '/register'}
                state={
                  user
                    ? undefined
                    : {
                        from: '/vehicles',
                        alert: 'Please sign up or log in first to view listed vehicles. Account creation is required to browse our fleet.',
                      }
                }
              >
                <button
                  type="button"
                  className="rounded-full px-7 py-3 text-xs sm:text-sm font-extrabold text-black tracking-wide bg-gradient-to-r from-amber-400 via-amber-500 to-orange-500 shadow-[0_0_25px_rgba(255,176,32,0.45)] hover:shadow-[0_0_35px_rgba(255,176,32,0.65)] hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-2 cursor-pointer"
                >
                  <span>BOOK YOUR RIDE</span>
                  <span className="text-base">&rarr;</span>
                </button>
              </Link>
              <Link to="/register">
                <Button
                  size="lg"
                  variant="secondary"
                  className="rounded-full border-cyan-400/40 bg-cyan-500/10 text-cyan-200 hover:bg-cyan-500/20 hover:border-cyan-300 font-bold px-6 py-3 text-xs sm:text-sm shadow-sm shadow-cyan-500/10 backdrop-blur-md"
                >
                  List Your Fleet
                </Button>
              </Link>
            </div>
          </div>

          {/* Wide Horizontal Search & Rental Console with Colorful Accents */}
          <div className="mt-7 rounded-2xl border border-white/20 bg-white/[0.06] p-4 sm:p-5 backdrop-blur-2xl relative z-10 shadow-xl shadow-black/20">
            {/* Category Selector Tabs with Individual Harmonious Colors */}
            <div className="flex items-center gap-2.5 overflow-x-auto pb-3 mb-4 border-b border-white/15 scrollbar-none">
              {CATEGORY_TABS.map((tab) => {
                const isSelected = selectedCategory === tab.id;
                let activeStyle = 'border-amber-400 bg-amber-500/25 text-amber-300 shadow-md shadow-amber-500/20 scale-[1.02]';
                let hoverStyle = 'border-white/15 bg-white/[0.07] text-white/80 hover:bg-white/15 hover:text-white hover:border-white/30';

                if (tab.id === 'suv' && !isSelected) {
                  hoverStyle = 'border-white/15 bg-white/[0.07] text-white/80 hover:border-cyan-400/60 hover:text-cyan-300 hover:bg-cyan-500/15';
                } else if (tab.id === 'sedan' && !isSelected) {
                  hoverStyle = 'border-white/15 bg-white/[0.07] text-white/80 hover:border-indigo-400/60 hover:text-indigo-300 hover:bg-indigo-500/15';
                } else if (tab.id === 'bike' && !isSelected) {
                  hoverStyle = 'border-white/15 bg-white/[0.07] text-white/80 hover:border-emerald-400/60 hover:text-emerald-300 hover:bg-emerald-500/15';
                } else if (tab.id === 'luxury' && !isSelected) {
                  hoverStyle = 'border-white/15 bg-white/[0.07] text-white/80 hover:border-rose-400/60 hover:text-rose-300 hover:bg-rose-500/15';
                }

                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setSelectedCategory(tab.id)}
                    className={`flex items-center gap-2 whitespace-nowrap rounded-xl px-4 py-2 text-xs sm:text-sm font-bold transition-all ${
                      isSelected ? activeStyle : hoverStyle
                    }`}
                  >
                    <span className="text-sm sm:text-base">{tab.icon}</span>
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Horizontal Input Row with Individual Accent Colors */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3.5 items-end">
              {/* Pickup Location - Amber Theme */}
              <div className="lg:col-span-4 flex flex-col gap-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
                  <span>📍</span>
                  <span>Pickup Location</span>
                </label>
                <div className="relative">
                  <select
                    value={selectedCity}
                    onChange={(e) => setSelectedCity(e.target.value)}
                    className="w-full rounded-xl border border-amber-400/35 bg-white/[0.08] hover:bg-white/[0.12] px-3.5 py-3 text-xs sm:text-sm font-semibold text-white focus:border-amber-400 focus:ring-2 focus:ring-amber-400/30 focus:outline-none appearance-none cursor-pointer transition-all backdrop-blur-md"
                  >
                    {POPULAR_CITIES.map((c) => (
                      <option key={c} value={c} className="bg-neutral-900 text-white font-medium">
                        📍 {c}
                      </option>
                    ))}
                  </select>
                  <span className="pointer-events-none absolute right-3.5 top-3.5 text-xs text-amber-400">▼</span>
                </div>
              </div>

              {/* Trip Start - Sky Cyan Theme */}
              <div className="lg:col-span-3 flex flex-col gap-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-cyan-300 flex items-center gap-1.5">
                  <span>📅</span>
                  <span>Trip Start</span>
                </label>
                <input
                  type="date"
                  value={pickupDate}
                  onChange={(e) => setPickupDate(e.target.value)}
                  className="w-full rounded-xl border border-cyan-400/35 bg-white/[0.08] hover:bg-white/[0.12] px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-white focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/30 focus:outline-none cursor-pointer transition-all [color-scheme:dark] backdrop-blur-md"
                />
              </div>

              {/* Return Date - Violet Purple Theme */}
              <div className="lg:col-span-3 flex flex-col gap-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-purple-300 flex items-center gap-1.5">
                  <span>📅</span>
                  <span>Return Date</span>
                </label>
                <input
                  type="date"
                  value={dropoffDate}
                  onChange={(e) => setDropoffDate(e.target.value)}
                  className="w-full rounded-xl border border-purple-400/35 bg-white/[0.08] hover:bg-white/[0.12] px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-white focus:border-purple-400 focus:ring-2 focus:ring-purple-400/30 focus:outline-none cursor-pointer transition-all [color-scheme:dark] backdrop-blur-md"
                />
              </div>

              {/* Search CTA Button */}
              <div className="lg:col-span-2">
                <Link
                  to={user ? '/vehicles' : '/register'}
                  state={
                    user
                      ? undefined
                      : {
                          from: '/vehicles',
                          alert: 'Please sign up or log in first to view listed vehicles. Account creation is required to browse our fleet.',
                        }
                  }
                  className="block w-full"
                >
                  <button
                    type="button"
                    className="w-full rounded-xl py-3 px-4 text-xs sm:text-sm font-extrabold text-black tracking-wide bg-gradient-to-r from-amber-400 via-orange-500 to-amber-500 shadow-[0_0_25px_rgba(255,176,32,0.45)] hover:shadow-[0_0_35px_rgba(255,176,32,0.65)] hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <span>🔍</span>
                    <span>Search Vehicles</span>
                  </button>
                </Link>
              </div>
            </div>

            {/* List Your Fleet Inline Link */}
            <div className="mt-3.5 pt-3 border-t border-white/15 flex flex-wrap items-center justify-between gap-3 text-xs text-white/70">
              <div className="flex items-center gap-2">
                <span className="text-amber-400 font-bold">⚡</span>
                <span>Fast online booking with zero paperwork delay</span>
              </div>
              <Link to="/register" className="font-semibold text-white hover:text-cyan-300 transition-colors">
                Have a car or bike to list? <span className="underline text-cyan-400 hover:text-cyan-300">List Your Fleet</span>
              </Link>
            </div>
          </div>

          {/* Bottom Benefits Row with Distinctive Automotive Color Palettes */}
          <div className="mt-6 pt-5 border-t border-white/15 grid grid-cols-1 sm:grid-cols-3 gap-4 text-left relative z-10">
            {/* Benefit 1 - Emerald/Mint Theme */}
            <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/[0.08] hover:bg-emerald-500/[0.14] hover:border-emerald-400/60 p-4 flex items-center gap-3.5 transition-all duration-200 hover:scale-[1.01] backdrop-blur-xl shadow-sm shadow-emerald-500/10">
              <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-emerald-500/25 border border-emerald-400/50 text-emerald-300 text-lg shadow-sm shadow-emerald-500/20">
                🛡️
              </div>
              <div>
                <h4 className="text-sm font-extrabold text-emerald-100">100% Insured</h4>
                <p className="text-xs text-emerald-300/80 mt-0.5">Damage protection</p>
              </div>
            </div>

            {/* Benefit 2 - Warm Amber/Gold Theme */}
            <div className="rounded-2xl border border-amber-500/30 bg-amber-500/[0.08] hover:bg-amber-500/[0.14] hover:border-amber-400/60 p-4 flex items-center gap-3.5 transition-all duration-200 hover:scale-[1.01] backdrop-blur-xl shadow-sm shadow-amber-500/10">
              <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-amber-500/25 border border-amber-400/50 text-amber-300 text-lg shadow-sm shadow-amber-500/20">
                ⚡
              </div>
              <div>
                <h4 className="text-sm font-extrabold text-amber-100">Instant Booking</h4>
                <p className="text-xs text-amber-300/80 mt-0.5">Keyless / Fast Handover</p>
              </div>
            </div>

            {/* Benefit 3 - Sky/Indigo Blue Theme */}
            <div className="rounded-2xl border border-sky-500/30 bg-sky-500/[0.08] hover:bg-sky-500/[0.14] hover:border-sky-400/60 p-4 flex items-center gap-3.5 transition-all duration-200 hover:scale-[1.01] backdrop-blur-xl shadow-sm shadow-sky-500/10">
              <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-sky-500/25 border border-sky-400/50 text-sky-300 text-lg shadow-sm shadow-sky-500/20">
                📍
              </div>
              <div>
                <h4 className="text-sm font-extrabold text-sky-100">Doorstep Delivery</h4>
                <p className="text-xs text-sky-300/80 mt-0.5">Home or Airport</p>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* 2. HOW IT WORKS */}
      <section id="how-it-works" className="py-16 sm:py-24 mx-auto max-w-[92rem] px-3 sm:px-6 lg:px-8">
        <div className="relative">
          <div className="relative z-10">
            <span className="inline-flex items-center gap-2.5 rounded-full border border-amber-400/50 bg-gradient-to-r from-amber-500/25 via-amber-400/15 to-orange-500/20 px-5 py-2 text-xs sm:text-sm font-extrabold uppercase tracking-widest text-amber-200 backdrop-blur-xl shadow-[0_0_20px_rgba(245,158,11,0.25),inset_0_1px_1px_rgba(255,255,255,0.35)]">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-400 shadow-[0_0_10px_#fbbf24]" />
              </span>
              <span className="drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)]">⚡ Fast & Effortless</span>
            </span>
            <h2 className="mt-4 font-display text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white leading-tight drop-shadow-[0_2px_16px_rgba(0,0,0,0.95)]">
              How It{' '}
              <span className="bg-gradient-to-r from-amber-400 via-orange-400 to-amber-200 bg-clip-text text-transparent">
                Works
              </span>
            </h2>
            <p className="mt-3 max-w-2xl text-base sm:text-lg text-white/90 leading-relaxed font-medium drop-shadow-[0_1px_6px_rgba(0,0,0,0.85)]">
              A seamless 3-step rental journey designed for speed and peace of mind.
            </p>

            <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-3">
              {STEPS.map((step, i) => (
                <div
                  key={step.title}
                  className={`group rounded-3xl border ${step.border} ${step.cardBg} ${step.shadow} p-7 sm:p-8 backdrop-blur-xl transition-all duration-300 hover:scale-[1.02] hover:-translate-y-1 flex flex-col justify-between`}
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-1 text-xs font-extrabold tracking-wider uppercase backdrop-blur-md shadow-sm ${step.badge}`}>
                        <span>Step 0{i + 1}</span>
                      </span>
                      <span className="text-2xl transform group-hover:scale-125 transition-transform duration-300">
                        {step.icon}
                      </span>
                    </div>

                    <h3 className="mt-6 font-display text-2xl sm:text-3xl font-extrabold text-white tracking-tight drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]">
                      {step.title}
                    </h3>
                    <p className="mt-3 text-sm sm:text-base text-white/85 leading-relaxed font-medium drop-shadow-[0_1px_4px_rgba(0,0,0,0.8)]">
                      {step.description}
                    </p>
                  </div>

                  <div className="mt-8 pt-4 border-t border-white/10 flex items-center justify-between text-xs font-bold tracking-wider uppercase">
                    <span className={step.tag}>DriveHub Journey</span>
                    <span className="text-white/50 group-hover:text-white transition-colors">0{i + 1} / 03</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 3. FEATURES SECTION */}
      <section id="features" className="py-16 sm:py-20 mx-auto max-w-[92rem] px-3 sm:px-6 lg:px-8">
        <div className="relative">
          <div className="relative z-10">
            <span className="inline-flex items-center gap-2.5 rounded-full border border-amber-400/50 bg-gradient-to-r from-amber-500/25 via-amber-400/15 to-orange-500/20 px-5 py-2 text-xs sm:text-sm font-extrabold uppercase tracking-widest text-amber-200 backdrop-blur-xl shadow-[0_0_20px_rgba(245,158,11,0.25),inset_0_1px_1px_rgba(255,255,255,0.35)]">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-400 shadow-[0_0_10px_#fbbf24]" />
              </span>
              <span className="drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)]">⚡ Key Features</span>
            </span>
            <h2 className="mt-4 font-display text-3xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight drop-shadow-[0_2px_12px_rgba(0,0,0,0.85)]">
              Everything you need,{' '}
              <span className="bg-gradient-to-r from-amber-400 via-orange-400 to-amber-200 bg-clip-text text-transparent">
                built in
              </span>
            </h2>
            <p className="mt-3 max-w-2xl text-sm sm:text-base text-white/95 leading-relaxed font-medium drop-shadow-[0_1px_6px_rgba(0,0,0,0.85)]">
              No third-party add-ons required to get a full rental experience running end to end.
            </p>

            {/* Core 6 Feature Cards with Individual Light Background Colors & High-Contrast Text */}
            <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {FEATURES.map((f, i) => {
                const theme = FEATURE_THEMES[i % FEATURE_THEMES.length];

                return (
                  <div
                    key={f.title}
                    className={`group rounded-2xl border ${theme.border} ${theme.cardBg} ${theme.shadow} p-6 backdrop-blur-xl transition-all duration-300 hover:scale-[1.02] hover:-translate-y-1 flex flex-col justify-between`}
                  >
                    <div>
                      <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${theme.badge} group-hover:scale-110 transition-all`}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="h-6 w-6 stroke-[2]" aria-hidden="true">
                          {f.icon}
                        </svg>
                      </div>
                      <h3 className={`mt-5 font-display text-lg sm:text-xl font-extrabold ${theme.title} tracking-tight`}>
                        {f.title}
                      </h3>
                      <p className={`mt-2.5 text-sm ${theme.desc} leading-relaxed font-medium`}>
                        {f.description}
                      </p>
                    </div>
                    <div className={`mt-6 pt-3.5 border-t ${theme.footerBorder} flex items-center justify-between text-xs font-bold tracking-wider uppercase ${theme.footerText}`}>
                      <span>DriveHub Standard</span>
                      <span>0{i + 1}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Role-Based Capabilities Tabs with Light Luminous Styling */}
            <div className="mt-16 border-t border-white/15 pt-10">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-amber-400">Ecosystem Matrix</span>
                  <h3 className="font-display text-xl sm:text-2xl font-extrabold text-white mt-1 drop-shadow-[0_1px_6px_rgba(0,0,0,0.85)]">
                    Built for every user in the ecosystem
                  </h3>
                </div>
                <div className="flex flex-wrap gap-2.5">
                  {(['customer', 'owner', 'admin'] as const).map((key) => (
                    <button
                      key={key}
                      onClick={() => setRole(key)}
                      className={`rounded-xl border px-4 py-2.5 text-xs sm:text-sm font-bold transition-all ${
                        role === key
                          ? 'border-amber-400 bg-amber-500/30 text-amber-200 shadow-md shadow-amber-500/25 scale-[1.02]'
                          : 'border-white/20 bg-white/[0.10] text-white/90 hover:bg-white/[0.18] hover:text-white hover:border-white/40'
                      }`}
                    >
                      {key === 'customer' ? '🚗 For Renters' : key === 'owner' ? '💼 For Fleet Owners' : '🛡️ For Admins'}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2">
                {ROLE_FEATURES[role].map((item) => (
                  <div
                    key={item.title}
                    className="rounded-2xl border border-white/15 bg-gradient-to-b from-white/[0.08] via-black/[0.25] to-black/[0.45] p-5 backdrop-blur-xl shadow-[0_12px_28px_rgba(0,0,0,0.35),inset_0_1px_1px_rgba(255,255,255,0.15)] hover:border-amber-400/50 hover:scale-[1.01] transition-all"
                  >
                    <div className="flex items-start gap-3.5">
                      <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-amber-500/25 border border-amber-400/50 text-amber-300 text-xs font-bold mt-0.5 shadow-sm">
                        ✓
                      </span>
                      <div>
                        <h4 className="font-display text-base font-bold text-white drop-shadow-[0_1px_4px_rgba(0,0,0,0.85)]">{item.title}</h4>
                        <p className="mt-1 text-sm text-white/80 leading-relaxed font-medium drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)]">{item.description}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. ABOUT US SECTION */}
      <section id="about" className="py-24">
        <div className="mx-auto max-w-6xl px-6">
          <div className="rounded-3xl section-translucent-container p-8 sm:p-14 glitter-border-box relative overflow-hidden">
            {/* Subtle ambient warm lighting accents */}
            <div className="absolute -top-24 -left-24 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-24 -right-24 w-80 h-80 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10">
              <span className="inline-flex items-center gap-2.5 rounded-full border border-amber-400/50 bg-gradient-to-r from-amber-500/25 via-amber-400/15 to-orange-500/20 px-5 py-2 text-xs sm:text-sm font-extrabold uppercase tracking-widest text-amber-200 backdrop-blur-xl shadow-[0_0_20px_rgba(245,158,11,0.25),inset_0_1px_1px_rgba(255,255,255,0.35)]">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-400 shadow-[0_0_10px_#fbbf24]" />
                </span>
                <span className="drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)]">📍 About Us</span>
              </span>
              <h2 className="mt-4 font-display text-3xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight max-w-4xl">
                Making vehicle rental straightforward,{' '}
                <span className="bg-gradient-to-r from-amber-400 via-orange-400 to-amber-200 bg-clip-text text-transparent">
                  for everyone involved.
                </span>
              </h2>
              
              <div className="mt-8 space-y-5 max-w-4xl text-base sm:text-lg leading-relaxed text-white/85">
                <p>
                  DriveHub was built to close the gap between people who need a vehicle for a few days and
                  owners who have one sitting idle. Instead of a patchwork of phone calls, cash handoffs, and
                  informal agreements, DriveHub gives both sides one place to search, book, pay, message, and
                  track a trip — with the verification and payment infrastructure a real rental platform needs.
                </p>
                <p className="text-white/75">
                  Every vehicle listed goes through a document review before it's searchable. Every booking
                  computes its price up front, server-side, so there's no ambiguity between what's quoted and
                  what's charged. And once a trip starts, both sides can see it through — live location
                  sharing, in-app messaging, and a clear cancellation and refund policy.
                </p>
              </div>

              {/* What we care about */}
              <div className="mt-14 pt-10 border-t border-white/10">
                <div className="flex items-center gap-3">
                  <div className="h-4 w-1 rounded-full bg-amber-400" />
                  <h3 className="font-display text-xl sm:text-2xl font-bold text-white tracking-tight">What we care about</h3>
                </div>

                <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-3">
                  {VALUES.map((v, i) => {
                    const cardToneClass = i === 0 ? 'card-tone-amber' : i === 1 ? 'card-tone-slate' : 'card-tone-gold';
                    return (
                      <div
                        key={v.title}
                        className={`card-edge-glitter ${cardToneClass} group rounded-2xl p-6 transition-all duration-300 hover:scale-[1.02]`}
                      >
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400/20 to-orange-500/10 border border-amber-400/30 text-amber-300 text-sm font-bold mb-4 shadow-sm shadow-amber-500/10 group-hover:border-amber-400 group-hover:scale-105 transition-all">
                          ✓
                        </div>
                        <h4 className="font-display text-lg font-bold text-white tracking-tight group-hover:text-amber-300 transition-colors">
                          {v.title}
                        </h4>
                        <p className="mt-2 text-sm text-white/75 leading-relaxed">{v.description}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. CONTACT SECTION - WIDESCREEN RECTANGLE */}
      <section id="contact" className="py-16 sm:py-24 mx-auto max-w-[92rem] px-3 sm:px-6 lg:px-8">
        <div className="relative">
          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
            {/* Left Column: Heading, Context & Concierge Cards (5 cols) */}
            <div className="lg:col-span-5 flex flex-col justify-between">
              <div>
                <span className="inline-flex items-center gap-2.5 rounded-full border border-amber-400/50 bg-gradient-to-r from-amber-500/25 via-amber-400/15 to-orange-500/20 px-5 py-2 text-xs sm:text-sm font-extrabold uppercase tracking-widest text-amber-200 backdrop-blur-xl shadow-[0_0_20px_rgba(245,158,11,0.25),inset_0_1px_1px_rgba(255,255,255,0.35)]">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-400 shadow-[0_0_10px_#fbbf24]" />
                  </span>
                  <span className="drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)]">✉️ Concierge Support</span>
                </span>

                <h2 className="mt-4 font-display text-4xl sm:text-6xl font-extrabold tracking-tight text-white leading-tight drop-shadow-[0_2px_16px_rgba(0,0,0,0.95)]">
                  Get in{' '}
                  <span className="bg-gradient-to-r from-amber-400 via-orange-400 to-amber-200 bg-clip-text text-transparent">
                    touch
                  </span>
                </h2>

                <p className="mt-3 text-sm sm:text-base text-white/90 leading-relaxed font-medium drop-shadow-[0_1px_4px_rgba(0,0,0,0.85)]">
                  Questions about vehicle rentals, fleet listing, enterprise bookings, or road assistance? Drop us a dispatch and our team will respond right away.
                </p>

                {/* 3 High-Contrast Support Highlights */}
                <div className="mt-8 space-y-3.5">
                  <div className="flex items-center gap-3.5 rounded-2xl border border-white/15 bg-gradient-to-b from-white/[0.08] via-white/[0.03] to-black/[0.30] p-4 backdrop-blur-xl shadow-lg">
                    <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-amber-500/20 border border-amber-400/40 text-amber-300 text-lg shadow-sm">
                      📧
                    </span>
                    <div>
                      <h4 className="text-sm font-bold text-white tracking-tight drop-shadow-sm">Direct Support Desk</h4>
                      <p className="text-xs text-amber-300 font-semibold mt-0.5">sourabhshukla8318@gmail.com</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3.5 rounded-2xl border border-white/15 bg-gradient-to-b from-white/[0.08] via-white/[0.03] to-black/[0.30] p-4 backdrop-blur-xl shadow-lg">
                    <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-lg shadow-sm">
                      ⚡
                    </span>
                    <div>
                      <h4 className="text-sm font-bold text-white tracking-tight drop-shadow-sm">Priority Dispatch</h4>
                      <p className="text-xs text-white/80 mt-0.5">Average response under 15 minutes</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3.5 rounded-2xl border border-white/15 bg-gradient-to-b from-white/[0.08] via-white/[0.03] to-black/[0.30] p-4 backdrop-blur-xl shadow-lg">
                    <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-cyan-500/20 border border-cyan-400/40 text-cyan-300 text-lg shadow-sm">
                      🛡️
                    </span>
                    <div>
                      <h4 className="text-sm font-bold text-white tracking-tight drop-shadow-sm">Host & Renter Concierge</h4>
                      <p className="text-xs text-white/80 mt-0.5">Pan-India verification & booking desk</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Interactive Contact Console (7 cols) */}
            <div className="lg:col-span-7 rounded-3xl border border-white/20 bg-gradient-to-b from-white/[0.09] via-white/[0.04] to-black/[0.35] p-6 sm:p-8 backdrop-blur-2xl shadow-2xl">
              <form onSubmit={onContactSubmit} className="flex flex-col gap-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  {/* Your name */}
                  <div className="flex flex-col gap-2">
                    <label htmlFor="landing-contact-name" className="text-xs font-bold uppercase tracking-wider text-amber-300 flex items-center justify-between drop-shadow-sm">
                      <span className="flex items-center gap-1.5">
                        <span className="text-amber-400 font-extrabold">●</span>
                        <span className="text-white">Your name</span>
                      </span>
                      <span className="text-[10px] text-amber-400 font-bold tracking-normal bg-amber-500/20 border border-amber-400/30 px-2 py-0.5 rounded-full">Required</span>
                    </label>
                    <div className="group relative flex items-center rounded-2xl border border-white/20 bg-white/[0.08] px-4 py-3.5 backdrop-blur-xl transition-all duration-200 focus-within:border-amber-400 focus-within:ring-2 focus-within:ring-amber-400/30 focus-within:bg-black/50 hover:border-white/40 shadow-sm">
                      <input
                        id="landing-contact-name"
                        type="text"
                        value={contactName}
                        onChange={(e) => setContactName(e.target.value)}
                        required
                        disabled={contactSending}
                        placeholder="Enter your full name"
                        className="w-full bg-transparent text-sm sm:text-base font-medium text-white placeholder-white/50 focus:outline-none disabled:opacity-50"
                      />
                      <User className="h-5 w-5 text-white/60 group-focus-within:text-amber-400 shrink-0 ml-2 transition-colors" aria-hidden="true" />
                    </div>
                  </div>

                  {/* Email address */}
                  <div className="flex flex-col gap-2">
                    <label htmlFor="landing-contact-email" className="text-xs font-bold uppercase tracking-wider text-amber-300 flex items-center justify-between drop-shadow-sm">
                      <span className="flex items-center gap-1.5">
                        <span className="text-amber-400 font-extrabold">●</span>
                        <span className="text-white">Email address</span>
                      </span>
                      <span className="text-[10px] text-amber-400 font-bold tracking-normal bg-amber-500/20 border border-amber-400/30 px-2 py-0.5 rounded-full">Required</span>
                    </label>
                    <div className="group relative flex items-center rounded-2xl border border-white/20 bg-white/[0.08] px-4 py-3.5 backdrop-blur-xl transition-all duration-200 focus-within:border-amber-400 focus-within:ring-2 focus-within:ring-amber-400/30 focus-within:bg-black/50 hover:border-white/40 shadow-sm">
                      <input
                        id="landing-contact-email"
                        type="email"
                        value={contactEmail}
                        onChange={(e) => setContactEmail(e.target.value)}
                        required
                        disabled={contactSending}
                        placeholder="Enter your email address"
                        className="w-full bg-transparent text-sm sm:text-base font-medium text-white placeholder-white/50 focus:outline-none disabled:opacity-50"
                      />
                      <Mail className="h-5 w-5 text-white/60 group-focus-within:text-amber-400 shrink-0 ml-2 transition-colors" aria-hidden="true" />
                    </div>
                  </div>
                </div>

                {/* Message */}
                <div className="flex flex-col gap-2">
                  <label htmlFor="landing-contact-message" className="text-xs font-bold uppercase tracking-wider text-amber-300 flex items-center justify-between drop-shadow-sm">
                    <span className="flex items-center gap-1.5">
                      <span className="text-amber-400 font-extrabold">●</span>
                      <span className="text-white">Message</span>
                    </span>
                    <span className="text-[10px] text-white/60 font-medium">Delivers to sourabhshukla8318@gmail.com</span>
                  </label>
                  <div className="group relative rounded-2xl border border-white/20 bg-white/[0.08] p-4 backdrop-blur-xl transition-all duration-200 focus-within:border-amber-400 focus-within:ring-2 focus-within:ring-amber-400/30 focus-within:bg-black/50 hover:border-white/40 shadow-sm">
                    <textarea
                      id="landing-contact-message"
                      value={contactMessage}
                      onChange={(e) => setContactMessage(e.target.value)}
                      required
                      disabled={contactSending}
                      rows={4}
                      className="w-full bg-transparent text-sm sm:text-base font-medium text-white placeholder-white/50 focus:outline-none resize-none leading-relaxed disabled:opacity-50"
                      placeholder="Write your questions about vehicle rentals, fleet listing, or booking details..."
                    />
                    <div className="mt-2.5 flex items-center justify-between border-t border-white/10 pt-2.5 text-[11px] text-white/65">
                      <span className="flex items-center gap-1.5">
                        <MessageSquare className="h-3.5 w-3.5 text-amber-400" />
                        <span>Direct response team</span>
                      </span>
                      <span className="text-amber-300/80 font-medium">Direct delivery to admin email</span>
                    </div>
                  </div>
                </div>

                {/* Status Message Notification */}
                {contactStatus && (
                  <div
                    className={`rounded-2xl p-4 text-xs sm:text-sm font-semibold flex items-center gap-3 backdrop-blur-xl border transition-all ${
                      contactStatus.type === 'success'
                        ? 'bg-emerald-500/20 text-emerald-200 border-emerald-400/50 shadow-[0_0_20px_rgba(16,185,129,0.25)]'
                        : 'bg-rose-500/20 text-rose-200 border-rose-400/50 shadow-[0_0_20px_rgba(244,63,94,0.25)]'
                    }`}
                  >
                    <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-400" />
                    <span>{contactStatus.message}</span>
                  </div>
                )}

                {/* Action Row */}
                <div className="mt-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="flex items-center gap-2 text-xs text-white/80 font-medium">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                    <span>Instant dispatch to sourabhshukla8318@gmail.com</span>
                  </div>

                  <button
                    type="submit"
                    disabled={contactSending}
                    className="w-full sm:w-auto rounded-full px-8 py-3.5 text-sm sm:text-base font-extrabold text-black tracking-wider uppercase bg-gradient-to-r from-amber-400 via-amber-500 to-orange-500 shadow-[0_0_25px_rgba(255,176,32,0.45)] hover:shadow-[0_0_35px_rgba(255,176,32,0.65)] hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    <span>{contactSending ? 'Sending dispatch...' : 'Send message'}</span>
                    <Send className={`h-4 w-4 ${contactSending ? 'animate-bounce' : ''}`} />
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* 6. CTA BANNER */}
      <section className="py-20">
        <div className="mx-auto max-w-6xl px-6">
          <div className="rounded-3xl border border-white/15 bg-black/50 p-10 sm:p-12 backdrop-blur-2xl shadow-2xl flex flex-col items-center gap-6 text-center sm:flex-row sm:justify-between sm:text-left">
            <div>
              <h2 className="font-display text-2xl font-semibold text-white">Ready to get on the road?</h2>
              <p className="mt-2 text-sm text-white/70">
                Create an account as a renter or a vehicle owner — takes under a minute.
              </p>
            </div>
            <Link to="/register">
              <Button size="lg">Get started</Button>
            </Link>
          </div>
        </div>
      </section>
    </MarketingLayout>
  );
}