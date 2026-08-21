import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { RouteMap } from '@/components/ui/RouteMap';

export function AuthLayout({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  return (
    <div className="grid min-h-screen grid-cols-1 lg:grid-cols-2">
      {/* Form panel */}
      <div className="flex flex-col justify-center px-6 py-12 sm:px-12 lg:px-20">
        <div className="mx-auto w-full max-w-sm">
          <Link to="/" className="font-display text-xl font-bold tracking-tight text-ink">
            DriveHub
          </Link>
          <h1 className="mt-8 font-display text-2xl font-semibold text-ink">{title}</h1>
          <p className="mt-1.5 text-sm text-slate">{subtitle}</p>
          <div className="mt-8">{children}</div>
        </div>
      </div>

      {/* Signature route-line panel */}
      <div className="relative hidden overflow-hidden bg-ink lg:block">
        <RouteMap />
        <div className="absolute inset-x-0 bottom-0 p-12">
          <p className="font-display text-2xl font-medium leading-snug text-paper">
            Every trip starts with a pin
            <br />
            and ends with a story.
          </p>
          <p className="mt-3 max-w-sm text-sm text-mist">
            Verified owners, insured vehicles, and a rental agreement generated the moment you book.
          </p>
        </div>
      </div>
    </div>
  );
}




