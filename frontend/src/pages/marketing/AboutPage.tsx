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
      <section className="mx-auto max-w-4xl px-6 py-20">
        <span className="text-xs font-medium uppercase tracking-wider text-slate">About us</span>
        <h1 className="mt-3 font-display text-3xl font-semibold text-ink sm:text-4xl">
          Making vehicle rental straightforward, for everyone involved.
        </h1>
        <p className="mt-6 text-base leading-relaxed text-slate">
          DriveHub was built to close the gap between people who need a vehicle for a few days and
          owners who have one sitting idle. Instead of a patchwork of phone calls, cash handoffs, and
          informal agreements, DriveHub gives both sides one place to search, book, pay, message, and
          track a trip — with the verification and payment infrastructure a real rental platform needs.
        </p>
        <p className="mt-4 text-base leading-relaxed text-slate">
          Every vehicle listed goes through a document review before it's searchable. Every booking
          computes its price up front, server-side, so there's no ambiguity between what's quoted and
          what's charged. And once a trip starts, both sides can see it through — live location
          sharing, in-app messaging, and a clear cancellation and refund policy.
        </p>

        <h2 className="mt-14 font-display text-xl font-semibold text-ink">What we care about</h2>
        <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-3">
          {VALUES.map((v) => (
            <div key={v.title} className="rounded-2xl border border-paper-line bg-white p-6">
              <h3 className="font-display text-base font-semibold text-ink">{v.title}</h3>
              <p className="mt-2 text-sm text-slate">{v.description}</p>
            </div>
          ))}
        </div>
      </section>
    </MarketingLayout>
  );
}