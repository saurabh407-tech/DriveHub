import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { StatCard } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { RevenueChart } from '@/components/charts/RevenueChart';
import { getAdminAnalytics } from '@/services/analyticsApi';
import type { AdminAnalytics } from '@/services/analyticsApi';
import { broadcastNotification } from '@/services/notificationApi';
import { FadeIn } from '@/components/ui/FadeIn';

export default function AdminDashboard() {
  const [analytics, setAnalytics] = useState<AdminAnalytics | null>(null);
  const [broadcastTitle, setBroadcastTitle] = useState('');
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [broadcastStatus, setBroadcastStatus] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    getAdminAnalytics().then((res) => setAnalytics(res.data));
  }, []);

  const onBroadcast = async () => {
    if (!broadcastTitle.trim() || !broadcastMessage.trim()) return;
    setIsSending(true);
    setBroadcastStatus(null);
    try {
      const res = await broadcastNotification(broadcastTitle, broadcastMessage);
      setBroadcastStatus(res.message);
      setBroadcastTitle('');
      setBroadcastMessage('');
    } catch {
      setBroadcastStatus('Could not send broadcast.');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <DashboardLayout>
      <FadeIn>
      <div>
        <h1 className="font-display text-2xl font-semibold text-ink">Platform overview</h1>
        <p className="mt-1 text-sm text-slate">Users, vehicles, and revenue across DriveHub.</p>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-4">
        <StatCard label="Total users" value={String(analytics?.totalUsers ?? '—')} />
        <StatCard label="Vehicle owners" value={String(analytics?.usersByRole.owner ?? 0)} />
        <StatCard label="Listed vehicles" value={String(analytics?.totalVehicles ?? '—')} />
        <StatCard
          label="Platform revenue"
          value={analytics ? `₹${analytics.platformRevenue.toLocaleString('en-IN')}` : '—'}
        />
      </div>

      {analytics && (
        <div className="mt-6 rounded-2xl border border-paper-line bg-paper-soft p-5">
          <h2 className="font-display text-base font-semibold text-ink">Revenue, last 6 months</h2>
          <div className="mt-2">
            <RevenueChart data={analytics.monthlyRevenue} />
          </div>
        </div>
      )}

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-paper-line bg-paper-soft p-5">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-base font-semibold text-ink">Vehicle verification queue</h2>
            <span className="font-display text-lg font-semibold text-route-dim">{analytics?.pendingVerifications ?? 0}</span>
          </div>
          <p className="mt-1 text-sm text-slate">Vehicles waiting for document review.</p>
          <Link to="/admin/vehicles">
            <Button size="sm" variant="secondary" className="mt-3">
              Review queue
            </Button>
          </Link>
        </div>

        <div className="rounded-2xl border border-paper-line bg-paper-soft p-5">
          <h2 className="font-display text-base font-semibold text-ink">Recent cancellations</h2>
          {analytics && analytics.recentCancellations.length === 0 ? (
            <p className="mt-3 text-sm text-slate">No recent cancellations.</p>
          ) : (
            <div className="mt-3 flex flex-col gap-2">
              {analytics?.recentCancellations.map((b) => (
                <Link key={b._id} to={`/bookings/${b._id}`} className="block rounded-lg bg-alert/5 px-3 py-2 text-xs hover:bg-alert/10">
                  <span className="font-medium text-ink">{b.bookingCode}</span> · {b.vehicle.title} —{' '}
                  {b.customer.name} / {b.owner.name}
                </Link>
              ))}
            </div>
          )}
          <Link to="/admin/disputes">
            <Button size="sm" variant="secondary" className="mt-3">
              View all
            </Button>
          </Link>
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-paper-line bg-paper-soft p-5">
        <h2 className="font-display text-base font-semibold text-ink">Send a broadcast notification</h2>
        <p className="mt-1 text-sm text-slate">Delivered instantly to every active user.</p>
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Input placeholder="Title" value={broadcastTitle} onChange={(e) => setBroadcastTitle(e.target.value)} />
          <Input placeholder="Message" value={broadcastMessage} onChange={(e) => setBroadcastMessage(e.target.value)} />
        </div>
        {broadcastStatus && <p className="mt-2 text-xs text-signal-dim">{broadcastStatus}</p>}
        <Button size="sm" className="mt-3" onClick={onBroadcast} isLoading={isSending}>
          Send broadcast
        </Button>
      </div>
      </FadeIn>
    </DashboardLayout>
  );
}
