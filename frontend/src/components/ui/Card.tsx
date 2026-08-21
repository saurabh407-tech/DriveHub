import type { HTMLAttributes } from 'react';
import clsx from 'clsx';

export function Card({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={clsx(
        'rounded-2xl border border-paper-line bg-paper-soft p-6 shadow-sm',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function Badge({
  tone = 'neutral',
  children,
}: {
  tone?: 'neutral' | 'success' | 'warning' | 'danger';
  children: React.ReactNode;
}) {
  const tones: Record<string, string> = {
    neutral: 'bg-ink/5 text-ink border-ink/10',
    success: 'bg-signal/10 text-signal-dim border-signal/30',
    warning: 'bg-route/10 text-route-dim border-route/30',
    danger: 'bg-alert/10 text-alert border-alert/30',
  };
  return (
    <span
      className={clsx(
        'inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium',
        tones[tone]
      )}
    >
      {children}
    </span>
  );
}

export function StatCard({
  label,
  value,
  delta,
  deltaTone = 'success',
}: {
  label: string;
  value: string;
  delta?: string;
  deltaTone?: 'success' | 'danger';
}) {
  return (
    <Card className="flex flex-col gap-2">
      <span className="text-xs font-medium uppercase tracking-wider text-slate">{label}</span>
      <span className="font-display text-3xl font-semibold text-ink">{value}</span>
      {delta && (
        <span className={clsx('text-xs font-medium', deltaTone === 'success' ? 'text-signal-dim' : 'text-alert')}>
          {delta}
        </span>
      )}
    </Card>
  );
}
