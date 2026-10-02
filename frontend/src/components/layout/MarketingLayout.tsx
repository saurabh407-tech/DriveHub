import type { ReactNode } from 'react';
import { MarketingNavbar } from './MarketingNavbar';
import { MarketingFooter } from './MarketingFooter';
import { PublicScrollAnimation } from '@/components/ui/PublicScrollAnimation';

export function MarketingLayout({ children }: { children: ReactNode }) {
  return (
    <div className="relative min-h-screen flex flex-col bg-black text-white overflow-x-hidden selection:bg-route selection:text-white">
      {/* Continuous Website-Wide 3D Scroll Canvas */}
      <PublicScrollAnimation />

      {/* Foreground Interactive Content Layer */}
      <div className="relative z-10 flex min-h-screen flex-col">
        <MarketingNavbar />
        <main className="flex-1">{children}</main>
        <MarketingFooter />
      </div>
    </div>
  );
}