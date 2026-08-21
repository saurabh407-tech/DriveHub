import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { StatCard } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { useAppSelector } from '@/hooks/useAppRedux';

export default function CustomerWalletPage() {
  const user = useAppSelector((s) => s.auth.user);

  return (
    <DashboardLayout>
      <h1 className="font-display text-2xl font-semibold text-ink">Wallet</h1>
      <p className="mt-1 text-sm text-slate">Your DriveHub balance.</p>

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <StatCard
          label="Current balance"
          value={`₹${(user?.wallet?.balance ?? 0).toLocaleString('en-IN')}`}
        />
        <StatCard label="Currency" value={user?.wallet?.currency ?? 'INR'} />
      </div>

      <div className="mt-8">
        <h2 className="font-display text-base font-semibold text-ink">Transaction history</h2>
        <div className="mt-3">
          <EmptyState
            title="No transactions yet"
            description="Wallet top-ups and spend history aren't wired up yet — bookings are currently paid directly through checkout, not through this balance. This page shows your stored balance only."
          />
        </div>
      </div>
    </DashboardLayout>
  );
}