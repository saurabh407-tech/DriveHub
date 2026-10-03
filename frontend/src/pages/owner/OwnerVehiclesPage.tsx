import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import { listMyVehicles } from '@/services/vehicleApi';
import type { VehicleSummary } from '@/services/vehicleApi';

const STATUS_TONE: Record<string, 'neutral' | 'success' | 'warning' | 'danger'> = {
  draft: 'neutral',
  pending_verification: 'warning',
  active: 'success',
  inactive: 'neutral',
  maintenance: 'warning',
  rejected: 'danger',
};

const STATUS_LABEL: Record<string, string> = {
  draft: 'Draft',
  pending_verification: 'Pending verification',
  active: 'Live',
  inactive: 'Inactive',
  maintenance: 'In maintenance',
  rejected: 'Rejected',
};

export default function OwnerVehiclesPage() {
  const [vehicles, setVehicles] = useState<VehicleSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    listMyVehicles()
      .then((res) => setVehicles(res.data.vehicles))
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <DashboardLayout>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold text-ink">Your vehicles</h1>
          <p className="mt-1 text-sm text-slate">Manage listings, photos, and documents.</p>
        </div>
        <Link to="/owner/vehicles/new" className="self-start sm:self-auto">
          <Button>+ Add vehicle</Button>
        </Link>
      </div>

      <div className="mt-8">
        {isLoading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3" role="status" aria-label="Loading">
            <span className="sr-only">Loading…</span>
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-40 rounded-2xl" />
            ))}
          </div>
        ) : vehicles.length === 0 ? (
          <EmptyState
            title="No vehicles listed yet"
            description="Add your first vehicle, upload photos and documents, then submit it for verification to go live."
          />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {vehicles.map((v) => (
              <Link
                key={v._id}
                to={`/owner/vehicles/${v._id}`}
                className="flex flex-col gap-3 rounded-2xl border border-paper-line bg-paper-soft p-5 transition-shadow hover:shadow-md"
              >
                <div className="flex items-start justify-between">
                  <h3 className="font-display text-base font-semibold text-ink">{v.title}</h3>
                  <Badge tone={STATUS_TONE[v.status]}>{STATUS_LABEL[v.status]}</Badge>
                </div>
                <p className="text-xs text-slate">
                  {v.make} {v.vehicleModel} · {v.year}
                </p>
                <p className="font-display text-lg font-semibold text-ink">
                  ₹{v.pricing.perDay.toLocaleString('en-IN')}
                  <span className="text-xs font-normal text-slate"> / day</span>
                </p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
