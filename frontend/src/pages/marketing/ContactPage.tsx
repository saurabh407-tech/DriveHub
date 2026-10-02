import { useState, type FormEvent } from 'react';
import { User, Mail, MessageSquare, Send, CheckCircle2 } from 'lucide-react';
import { MarketingLayout } from '@/components/layout/MarketingLayout';
import { sendContactMessage } from '@/services/contactApi';

export default function ContactPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !message.trim()) return;

    setSending(true);
    setStatus(null);

    try {
      await sendContactMessage({
        name: name.trim(),
        email: email.trim(),
        message: message.trim(),
      });
      setStatus({
        type: 'success',
        message: 'Message delivered directly to admin (sourabhshukla8318@gmail.com)! We will contact you shortly.',
      });
      setName('');
      setEmail('');
      setMessage('');
    } catch {
      // Direct mailto fallback if backend is unreachable
      const subject = encodeURIComponent(`DriveHub Inquiry from ${name.trim()}`);
      const body = encodeURIComponent(`${message.trim()}\n\nFrom: ${name.trim()} (${email.trim()})`);
      window.location.href = `mailto:sourabhshukla8318@gmail.com?subject=${subject}&body=${body}`;
      setStatus({
        type: 'success',
        message: 'Mail client opened to dispatch directly to sourabhshukla8318@gmail.com.',
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <MarketingLayout>
      <section className="mx-auto max-w-[92rem] px-3 sm:px-6 lg:px-8 py-16 sm:py-24">
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

                <h1 className="mt-4 font-display text-4xl sm:text-6xl font-extrabold tracking-tight text-white leading-tight drop-shadow-[0_2px_16px_rgba(0,0,0,0.95)]">
                  Get in{' '}
                  <span className="bg-gradient-to-r from-amber-400 via-orange-400 to-amber-200 bg-clip-text text-transparent">
                    touch
                  </span>
                </h1>

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
              <form onSubmit={onSubmit} className="flex flex-col gap-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  {/* Your name */}
                  <div className="flex flex-col gap-2">
                    <label htmlFor="contact-name" className="text-xs font-bold uppercase tracking-wider text-amber-300 flex items-center justify-between drop-shadow-sm">
                      <span className="flex items-center gap-1.5">
                        <span className="text-amber-400 font-extrabold">●</span>
                        <span className="text-white">Your name</span>
                      </span>
                      <span className="text-[10px] text-amber-400 font-bold tracking-normal bg-amber-500/20 border border-amber-400/30 px-2 py-0.5 rounded-full">Required</span>
                    </label>
                    <div className="group relative flex items-center rounded-2xl border border-white/20 bg-white/[0.08] px-4 py-3.5 backdrop-blur-xl transition-all duration-200 focus-within:border-amber-400 focus-within:ring-2 focus-within:ring-amber-400/30 focus-within:bg-black/50 hover:border-white/40 shadow-sm">
                      <input
                        id="contact-name"
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                        disabled={sending}
                        placeholder="Enter your full name"
                        className="w-full bg-transparent text-sm sm:text-base font-medium text-white placeholder-white/50 focus:outline-none disabled:opacity-50"
                      />
                      <User className="h-5 w-5 text-white/60 group-focus-within:text-amber-400 shrink-0 ml-2 transition-colors" aria-hidden="true" />
                    </div>
                  </div>

                  {/* Email address */}
                  <div className="flex flex-col gap-2">
                    <label htmlFor="contact-email" className="text-xs font-bold uppercase tracking-wider text-amber-300 flex items-center justify-between drop-shadow-sm">
                      <span className="flex items-center gap-1.5">
                        <span className="text-amber-400 font-extrabold">●</span>
                        <span className="text-white">Email address</span>
                      </span>
                      <span className="text-[10px] text-amber-400 font-bold tracking-normal bg-amber-500/20 border border-amber-400/30 px-2 py-0.5 rounded-full">Required</span>
                    </label>
                    <div className="group relative flex items-center rounded-2xl border border-white/20 bg-white/[0.08] px-4 py-3.5 backdrop-blur-xl transition-all duration-200 focus-within:border-amber-400 focus-within:ring-2 focus-within:ring-amber-400/30 focus-within:bg-black/50 hover:border-white/40 shadow-sm">
                      <input
                        id="contact-email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        disabled={sending}
                        placeholder="Enter your email address"
                        className="w-full bg-transparent text-sm sm:text-base font-medium text-white placeholder-white/50 focus:outline-none disabled:opacity-50"
                      />
                      <Mail className="h-5 w-5 text-white/60 group-focus-within:text-amber-400 shrink-0 ml-2 transition-colors" aria-hidden="true" />
                    </div>
                  </div>
                </div>

                {/* Message */}
                <div className="flex flex-col gap-2">
                  <label htmlFor="contact-message" className="text-xs font-bold uppercase tracking-wider text-amber-300 flex items-center justify-between drop-shadow-sm">
                    <span className="flex items-center gap-1.5">
                      <span className="text-amber-400 font-extrabold">●</span>
                      <span className="text-white">Message</span>
                    </span>
                    <span className="text-[10px] text-white/60 font-medium">Delivers to sourabhshukla8318@gmail.com</span>
                  </label>
                  <div className="group relative rounded-2xl border border-white/20 bg-white/[0.08] p-4 backdrop-blur-xl transition-all duration-200 focus-within:border-amber-400 focus-within:ring-2 focus-within:ring-amber-400/30 focus-within:bg-black/50 hover:border-white/40 shadow-sm">
                    <textarea
                      id="contact-message"
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      required
                      disabled={sending}
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
                {status && (
                  <div
                    className={`rounded-2xl p-4 text-xs sm:text-sm font-semibold flex items-center gap-3 backdrop-blur-xl border transition-all ${
                      status.type === 'success'
                        ? 'bg-emerald-500/20 text-emerald-200 border-emerald-400/50 shadow-[0_0_20px_rgba(16,185,129,0.25)]'
                        : 'bg-rose-500/20 text-rose-200 border-rose-400/50 shadow-[0_0_20px_rgba(244,63,94,0.25)]'
                    }`}
                  >
                    <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-400" />
                    <span>{status.message}</span>
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
                    disabled={sending}
                    className="w-full sm:w-auto rounded-full px-8 py-3.5 text-sm sm:text-base font-extrabold text-black tracking-wider uppercase bg-gradient-to-r from-amber-400 via-amber-500 to-orange-500 shadow-[0_0_25px_rgba(255,176,32,0.45)] hover:shadow-[0_0_35px_rgba(255,176,32,0.65)] hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    <span>{sending ? 'Sending dispatch...' : 'Send message'}</span>
                    <Send className={`h-4 w-4 ${sending ? 'animate-bounce' : ''}`} />
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </section>
    </MarketingLayout>
  );
}