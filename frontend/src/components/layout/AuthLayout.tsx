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
    <div className="grid min-h-screen grid-cols-1 lg:grid-cols-12 bg-black text-white selection:bg-route selection:text-white">
      {/* Form panel */}
      <div className="lg:col-span-6 xl:col-span-5 flex flex-col justify-center px-3.5 sm:px-12 lg:px-16 py-8 sm:py-12 relative overflow-hidden">
        {/* Subtle Ambient Glow */}
        <div className="absolute -top-24 -left-24 h-80 w-80 rounded-full bg-amber-500/10 blur-[100px] pointer-events-none" />

        <div className="mx-auto w-full max-w-md relative z-10 rounded-3xl border border-white/20 bg-black/60 p-5 sm:p-9 backdrop-blur-2xl shadow-[0_25px_60px_rgba(0,0,0,0.85)]">
          <div className="mb-6 flex justify-center">
            <Link to="/" className="transition-transform hover:scale-105">
              <img
                src="/drivehub-logo.png"
                alt="DriveHub Logo"
                className="h-10 sm:h-12 w-auto object-contain drop-shadow"
              />
            </Link>
          </div>

          <div className="mb-6 text-center">
            <h1 className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight text-white">{title}</h1>
            <p className="mt-1.5 text-xs sm:text-sm text-white/70">{subtitle}</p>
          </div>

          <div>{children}</div>
        </div>
      </div>

      {/* Signature route-line panel with dark automotive styling */}
      <div className="relative hidden overflow-hidden bg-black lg:col-span-6 xl:col-span-7 lg:block border-l border-white/10">
        <RouteMap />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent pointer-events-none" />
        <div className="absolute inset-x-0 bottom-0 p-12 pointer-events-none">
          <span className="inline-flex items-center gap-2 rounded-full border border-emerald-500/40 bg-emerald-500/15 px-3 py-1 text-xs font-semibold text-emerald-300 mb-3">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            Verified Fleet & Smart Mobility
          </span>
          <p className="font-display text-3xl font-extrabold leading-snug text-white">
            Every trip starts with a pin
            <br />
            <span className="bg-gradient-to-r from-amber-400 via-orange-400 to-amber-200 bg-clip-text text-transparent">
              and ends with a story.
            </span>
          </p>
          <p className="mt-3 max-w-md text-sm text-white/70 leading-relaxed">
            Verified owners, comprehensive insurance, and instant digital handover generated the moment you book.
          </p>
        </div>
      </div>
    </div>
  );
}
