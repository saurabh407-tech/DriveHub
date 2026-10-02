import { MarketingLayout } from '@/components/layout/MarketingLayout';

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

export default function AboutPage() {
  return (
    <MarketingLayout>
      <section className="mx-auto max-w-5xl px-6 py-24">
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
            <h1 className="mt-4 font-display text-3xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight max-w-4xl">
              Making vehicle rental straightforward,{' '}
              <span className="bg-gradient-to-r from-amber-400 via-orange-400 to-amber-200 bg-clip-text text-transparent">
                for everyone involved.
              </span>
            </h1>
            
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
                <h2 className="font-display text-xl sm:text-2xl font-bold text-white tracking-tight">What we care about</h2>
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
                      <h3 className="font-display text-lg font-bold text-white tracking-tight group-hover:text-amber-300 transition-colors">
                        {v.title}
                      </h3>
                      <p className="mt-2 text-sm text-white/75 leading-relaxed">{v.description}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </section>
    </MarketingLayout>
  );
}