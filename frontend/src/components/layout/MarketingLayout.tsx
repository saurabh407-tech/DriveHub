import type { ReactNode } from 'react';
import { MarketingNavbar } from './MarketingNavbar';
import { MarketingFooter } from './MarketingFooter';

export function MarketingLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-[#ffcbe3] via-[#e9d5ff] to-[#c4b5fd]">
      <MarketingNavbar />
      <main className="flex-1">{children}</main>
      <MarketingFooter />
    </div>
  );
}