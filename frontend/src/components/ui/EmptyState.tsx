import type { ReactNode } from 'react';

export function EmptyState({
  title,
  description,
  icon,
}: {
  title: string;
  description: string;
  icon?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-paper-line px-6 py-16 text-center">
      {icon && <div className="mb-4 text-slate">{icon}</div>}
      <h3 className="font-display text-base font-semibold text-ink">{title}</h3>
      <p className="mt-1.5 max-w-sm text-sm text-slate">{description}</p>
    </div>
  );
}
