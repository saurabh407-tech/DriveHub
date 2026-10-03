import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { SkeletonList } from '@/components/ui/Skeleton';
import { adminListPendingVehicles, adminVerifyVehicle, adminRejectVehicle } from '@/services/vehicleApi';
import type { VehicleSummary } from '@/services/vehicleApi';

type PendingVehicle = VehicleSummary & { owner: { name: string; email: string } };

export default function AdminVehiclesPage() {
  const [vehicles, setVehicles] = useState<PendingVehicle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actingOn, setActingOn] = useState<string | null>(null);

  const refresh = () => {
    adminListPendingVehicles()
      .then((res) => setVehicles(res.data.vehicles))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    refresh();
  }, []);

  const onVerify = async (id: string) => {
    setActingOn(id);
    try {
      await adminVerifyVehicle(id);
      refresh();
    } finally {
      setActingOn(null);
    }
  };

  const onReject = async (id: string) => {
    const reason = window.prompt('Reason for rejection (shown to the owner):') || undefined;
    setActingOn(id);
    try {
      await adminRejectVehicle(id, reason);
      refresh();
    } finally {
      setActingOn(null);
    }
  };

  return (
    <DashboardLayout>
      <h1 className="font-display text-2xl font-semibold text-ink">Vehicle verification queue</h1>
      <p className="mt-1 text-sm text-slate">Review documents and publish or reject each listing.</p>

      <div className="mt-6 flex flex-col gap-4">
        {isLoading ? (
          <SkeletonList count={3} className="h-24 rounded-2xl" />
        ) : vehicles.length === 0 ? (
          <EmptyState title="Queue is empty" description="No vehicles are currently waiting for verification." />
        ) : (
          vehicles.map((v) => (
            <div
              key={v._id}
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-paper-line bg-paper-soft p-4 sm:p-5"
            >
              <div className="min-w-0">
                <p className="font-display text-base font-semibold text-ink">{v.title}</p>
                <p className="mt-1 text-xs text-slate">
                  {v.make} {v.vehicleModel} · {v.year} · {v.location.city}
                </p>
                <p className="mt-1 text-xs text-slate">
                  Owner: {v.owner.name} ({v.owner.email})
                </p>
                <p className="mt-1 text-xs text-slate">
                  RC: {v.documents.rc.status} · Insurance: {v.documents.insurance.status} · {v.images.length} photo
                  {v.images.length === 1 ? '' : 's'}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="danger" onClick={() => onReject(v._id)} isLoading={actingOn === v._id}>
                  Reject
                </Button>
                <Button size="sm" onClick={() => onVerify(v._id)} isLoading={actingOn === v._id}>
                  Verify &amp; publish
                </Button>
              </div>
            </div>
          ))
        )}
      </div>
    </DashboardLayout>
  );
}
