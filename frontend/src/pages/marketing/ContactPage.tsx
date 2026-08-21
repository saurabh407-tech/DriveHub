import { useState, type FormEvent } from 'react';
import { MarketingLayout } from '@/components/layout/MarketingLayout';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

export default function ContactPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    const subject = encodeURIComponent(`Message from ${name || 'DriveHub visitor'}`);
    const body = encodeURIComponent(`${message}\n\nFrom: ${name} (${email})`);
    window.location.href = `mailto:support@drivehub.com?subject=${subject}&body=${body}`;
  };

  return (
    <MarketingLayout>
      <section className="mx-auto max-w-2xl px-6 py-20">
        <span className="text-xs font-medium uppercase tracking-wider text-slate">Contact</span>
        <h1 className="mt-3 font-display text-3xl font-semibold text-ink sm:text-4xl">Get in touch</h1>
        <p className="mt-4 text-sm text-slate">
          Questions about renting, listing a vehicle, or anything else — send a message and it'll open
          in your email client, ready to send.
        </p>

        <form onSubmit={onSubmit} className="mt-10 flex flex-col gap-4">
          <Input label="Your name" value={name} onChange={(e) => setName(e.target.value)} required />
          <Input label="Email address" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-ink">Message</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              required
              rows={5}
              className="w-full rounded-lg border border-paper-line bg-paper-soft px-3.5 py-2.5 text-sm text-ink placeholder:text-slate/60 focus:outline-none focus:ring-2 focus:ring-route/40 focus:border-route"
            />
          </div>
          <Button type="submit" size="lg">
            Send message
          </Button>
        </form>
      </section>
    </MarketingLayout>
  );
}