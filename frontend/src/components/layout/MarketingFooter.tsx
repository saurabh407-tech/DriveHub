import { Link } from 'react-router-dom';

const TRUST_BADGES = [
  { icon: '🛡️', title: '100% Verified Fleet', desc: 'Admin-inspected RC & fitness' },
  { icon: '⚡', title: 'Instant Booking', desc: 'Zero wait, paperless checkout' },
  { icon: '📍', title: 'Live Trip Telematics', desc: 'Real-time GPS tracking & safety' },
  { icon: '📞', title: '24/7 Roadside Assistance', desc: 'Pan-India support hotline' },
];

const FOOTER_LINKS: Record<string, { label: string; to: string; badge?: string }[]> = {
  Product: [
    { label: 'Browse Vehicles', to: '/vehicles', badge: '140+' },
    { label: 'Key Features', to: '/features' },
    { label: 'List Your Fleet', to: '/register', badge: 'Earn' },
    { label: 'Instant Booking Flow', to: '/vehicles' },
  ],
  Company: [
    { label: 'About DriveHub', to: '/about' },
    { label: 'Support & Contact', to: '/contact' },
    { label: 'Safety & Insurance', to: '/about' },
    { label: 'Host Guidelines', to: '/about' },
  ],
  Account: [
    { label: 'Member Login', to: '/login' },
    { label: 'Create Account', to: '/register' },
    { label: 'Fleet Owner Portal', to: '/register' },
    { label: 'Admin Access', to: '/login' },
  ],
};

export function MarketingFooter() {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="relative border-t border-white/15 bg-gradient-to-b from-white/[0.08] via-white/[0.03] to-black/[0.30] backdrop-blur-2xl text-white">
      {/* Subtle top golden light reflection */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 max-w-4xl h-[1px] bg-gradient-to-r from-transparent via-amber-400/40 to-transparent pointer-events-none" />

      <div className="mx-auto max-w-[92rem] px-4 sm:px-6 lg:px-8 pt-12 pb-8">
        {/* 1. TOP ROW: TRUST & VALUE HIGHLIGHTS BANNER */}
        <div className="grid grid-cols-2 gap-4 pb-10 sm:grid-cols-4 border-b border-white/10">
          {TRUST_BADGES.map((b) => (
            <div
              key={b.title}
              className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] hover:bg-white/[0.08] p-3.5 backdrop-blur-md transition-all duration-200"
            >
              <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-amber-500/15 border border-amber-400/30 text-lg shadow-sm">
                {b.icon}
              </span>
              <div>
                <h4 className="font-display text-xs sm:text-sm font-bold text-white tracking-tight drop-shadow-sm">{b.title}</h4>
                <p className="text-[11px] text-white/70 mt-0.5">{b.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* 2. MAIN FOOTER NAVIGATION GRID */}
        <div className="mt-12 grid grid-cols-2 gap-10 sm:grid-cols-3 lg:grid-cols-5">
          {/* Brand Info Column */}
          <div className="col-span-2 sm:col-span-3 lg:col-span-2">
            <Link to="/" className="inline-flex items-center gap-3 group">
              <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 text-black font-black text-lg shadow-[0_0_20px_rgba(251,191,36,0.35)] group-hover:scale-105 transition-transform">
                DH
              </span>
              <span className="font-display text-2xl sm:text-3xl font-black tracking-tight text-white">
                Drive<span className="bg-gradient-to-r from-amber-400 via-orange-400 to-amber-200 bg-clip-text text-transparent">Hub</span>
              </span>
            </Link>

            <p className="mt-4 max-w-sm text-sm text-white/80 leading-relaxed font-medium drop-shadow-sm">
              Smart vehicle rental and fleet management ecosystem, built for modern renters and vehicle owners alike. Verified hosts, transparent pricing, zero hidden surprises.
            </p>

            {/* Operational Status Pill */}
            <div className="mt-5 inline-flex items-center gap-2.5 rounded-full border border-emerald-400/40 bg-emerald-500/15 px-3.5 py-1 text-xs font-bold text-emerald-300 backdrop-blur-md shadow-sm">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Platform Online • 24/7 Operations</span>
            </div>
          </div>

          {/* Categorized Navigation Columns */}
          {Object.entries(FOOTER_LINKS).map(([heading, links]) => (
            <div key={heading}>
              <h3 className="font-display text-xs font-extrabold uppercase tracking-widest text-amber-400 drop-shadow-sm">
                {heading}
              </h3>
              <ul className="mt-4 flex flex-col gap-2.5">
                {links.map((link) => (
                  <li key={link.label}>
                    <Link
                      to={link.to}
                      className="group inline-flex items-center gap-1.5 text-sm text-white/85 hover:text-white font-medium transition-all hover:translate-x-1"
                    >
                      <span className="text-white/40 group-hover:text-amber-400 text-xs transition-colors">&rarr;</span>
                      <span className="group-hover:text-amber-200 transition-colors drop-shadow-sm">{link.label}</span>
                      {link.badge && (
                        <span className="ml-1 rounded-md bg-amber-500/25 border border-amber-400/40 px-1.5 py-0.2 text-[10px] font-extrabold text-amber-300">
                          {link.badge}
                        </span>
                      )}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* 3. BOTTOM UTILITY BAR */}
        <div className="mt-12 pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-white/60">
          <div className="flex flex-wrap items-center gap-4">
            <span className="font-medium text-white/80">
              &copy; {new Date().getFullYear()} DriveHub Technologies Inc. All rights reserved.
            </span>
            <span className="hidden sm:inline text-white/20">&bull;</span>
            <span className="text-white/60">Razorpay Verified Escrow</span>
            <span className="hidden sm:inline text-white/20">&bull;</span>
            <span className="text-white/60">256-Bit SSL Encrypted</span>
          </div>

          <button
            type="button"
            onClick={scrollToTop}
            className="inline-flex items-center gap-1.5 rounded-full border border-amber-400/40 bg-amber-500/15 hover:bg-amber-500/30 text-amber-300 hover:text-white px-4 py-1.5 text-xs font-extrabold transition-all shadow-sm hover:scale-105 cursor-pointer backdrop-blur-md"
          >
            <span>Back to top</span>
            <span>&uarr;</span>
          </button>
        </div>
      </div>
    </footer>
  );
}