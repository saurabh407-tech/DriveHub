import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { VehicleCard } from '@/components/vehicles/VehicleCard';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { SkeletonGrid } from '@/components/ui/Skeleton';
import { searchVehicles } from '@/services/vehicleApi';
import type { VehicleSummary, SearchFilters } from '@/services/vehicleApi';

const CATEGORIES = ['hatchback', 'sedan', 'suv', 'bike', 'scooter', 'van', 'luxury'];

export default function BrowseVehiclesPage() {
  const [filters, setFilters] = useState<SearchFilters>({ page: 1, limit: 12 });
  const [vehicles, setVehicles] = useState<VehicleSummary[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setError(null);
    searchVehicles(filters)
      .then((res) => {
        if (cancelled) return;
        setVehicles(res.data.vehicles);
        setTotalPages(res.data.pagination.totalPages);
      })
      .catch(() => {
        if (!cancelled) setError('Could not load vehicles. Please try again.');
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [filters]);

  const updateFilter = (patch: Partial<SearchFilters>) => setFilters((f) => ({ ...f, ...patch, page: 1 }));

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <div className="flex items-center justify-between">
        <div>
          <Link to="/" className="font-display text-lg font-bold tracking-tight text-ink">
            DriveHub
          </Link>
          <h1 className="mt-4 font-display text-2xl font-semibold text-ink">Find a vehicle to rent</h1>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-3 rounded-2xl border border-paper-line bg-paper-soft p-4 sm:grid-cols-4">
        <Input placeholder="City" onChange={(e) => updateFilter({ city: e.target.value || undefined })} />
        <select
          className="rounded-lg border border-paper-line bg-paper-soft px-3 py-2.5 text-sm text-ink"
          onChange={(e) => updateFilter({ category: e.target.value || undefined })}
          defaultValue=""
        >
          <option value="">Any category</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c[0].toUpperCase() + c.slice(1)}
            </option>
          ))}
        </select>
        <Input
          type="number"
          placeholder="Max price / day"
          onChange={(e) => updateFilter({ maxPrice: e.target.value ? Number(e.target.value) : undefined })}
        />
        <select
          className="rounded-lg border border-paper-line bg-paper-soft px-3 py-2.5 text-sm text-ink"
          onChange={(e) => updateFilter({ sortBy: (e.target.value || undefined) as SearchFilters['sortBy'] })}
          defaultValue=""
        >
          <option value="">Sort: newest</option>
          <option value="price_asc">Price: low to high</option>
          <option value="price_desc">Price: high to low</option>
          <option value="rating">Top rated</option>
        </select>
      </div>

      {error && <p className="mt-6 text-sm text-alert">{error}</p>}

      {isLoading ? (
        <div className="mt-8">
          <SkeletonGrid count={6} className="rounded-2xl" />
        </div>
      ) : vehicles.length === 0 ? (
        <div className="mt-8">
          <EmptyState
            title="No vehicles match your search"
            description="Try widening your filters, or check back soon as more owners list their vehicles."
          />
        </div>
      ) : (
        <>
          <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {vehicles.map((v) => (
              <VehicleCard key={v._id} vehicle={v} />
            ))}
          </div>

          {totalPages > 1 && (
            <div className="mt-8 flex items-center justify-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                disabled={(filters.page || 1) <= 1}
                onClick={() => setFilters((f) => ({ ...f, page: (f.page || 1) - 1 }))}
              >
                Previous
              </Button>
              <span className="text-sm text-slate">
                Page {filters.page || 1} of {totalPages}
              </span>
              <Button
                variant="ghost"
                size="sm"
                disabled={(filters.page || 1) >= totalPages}
                onClick={() => setFilters((f) => ({ ...f, page: (f.page || 1) + 1 }))}
              >
                Next
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
