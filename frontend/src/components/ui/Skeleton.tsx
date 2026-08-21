import clsx from 'clsx';

interface SkeletonProps {
  className?: string;
  /** Renders `count` copies stacked with a gap — for list/card grids. */
  count?: number;
}

/** A single pulsing placeholder block. Compose with a className for size/shape. */
export function Skeleton({ className }: SkeletonProps) {
  return <div className={clsx('animate-pulse rounded-lg bg-ink/5', className)} aria-hidden="true" />;
}

/** A vertical stack of skeleton rows, for lists that are loading. */
export function SkeletonList({ count = 3, className }: SkeletonProps) {
  return (
    <div className="flex flex-col gap-4" role="status" aria-label="Loading">
      <span className="sr-only">Loading…</span>
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} className={clsx('h-24 w-full', className)} />
      ))}
    </div>
  );
}

/** A responsive grid of skeleton cards, for card-grid pages like vehicle browsing. */
export function SkeletonGrid({ count = 6, className }: SkeletonProps) {
  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3" role="status" aria-label="Loading">
      <span className="sr-only">Loading…</span>
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} className={clsx('aspect-[4/3] w-full', className)} />
      ))}
    </div>
  );
}
