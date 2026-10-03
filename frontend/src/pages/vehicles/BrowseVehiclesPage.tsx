import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, Navigate } from 'react-router-dom';
import {
  ArrowLeft,
  MapPin,
  Sparkles,
  Car,
  SlidersHorizontal,
  RotateCcw,
  IndianRupee,
  Filter,
} from 'lucide-react';
import { VehicleCard } from '@/components/vehicles/VehicleCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { SkeletonGrid } from '@/components/ui/Skeleton';
import { useAppSelector } from '@/hooks/useAppRedux';
import { searchVehicles } from '@/services/vehicleApi';
import type { VehicleSummary, SearchFilters } from '@/services/vehicleApi';
import { FadeIn } from '@/components/ui/FadeIn';

const CATEGORIES = [
  { id: '', label: 'All Fleet', icon: '✨' },
  { id: 'bike', label: 'Bikes', icon: '🏍️' },
  { id: 'scooter', label: 'Scooters', icon: '🛵' },
  { id: 'hatchback', label: 'Hatchbacks', icon: '🚗' },
  { id: 'sedan', label: 'Sedans', icon: '🚘' },
  { id: 'suv', label: 'SUVs & 4x4', icon: '🚙' },
  { id: 'luxury', label: 'Luxury', icon: '👑' },
  { id: 'van', label: 'Vans & Fleet', icon: '🚐' },
];

export default function BrowseVehiclesPage() {
  const { user, bootstrapped } = useAppSelector((s) => s.auth);
  const location = useLocation();
  const navigate = useNavigate();

  const mainDashboardPath = user
    ? user.role === 'owner'
      ? '/owner'
      : user.role === 'admin'
      ? '/admin'
      : '/customer'
    : '/';

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

  const hasActiveFilters = Boolean(
    filters.city || filters.category || filters.maxPrice || filters.sortBy
  );

  const resetFilters = () => {
    setFilters({ page: 1, limit: 12 });
  };

  // If session is bootstrapped and user is not authenticated, redirect to register with alert
  if (bootstrapped && !user) {
    return (
      <Navigate
        to="/register"
        state={{
          from: location.pathname,
          alert: 'Please sign up or log in first to view listed vehicles. Account creation is required to browse our fleet.',
        }}
        replace
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f8f4fa] via-[#faefe0] to-[#eee8f2] text-[#2d163d]">
      {/* ================= TOP NAVIGATION BAR ================= */}
      <header className="sticky top-0 z-30 border-b border-[#8b4d9b]/15 bg-white/85 backdrop-blur-xl shadow-xs">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-3 sm:px-6 lg:px-8 py-2.5 sm:py-3 gap-2">
          {/* Left: Back Button & Single Brand Logo */}
          <div className="flex items-center gap-2 sm:gap-4 min-w-0">
            <button
              type="button"
              onClick={() => navigate(mainDashboardPath)}
              className="inline-flex items-center gap-1.5 sm:gap-2 rounded-2xl border border-[#8b4d9b]/20 bg-gradient-to-r from-[#2d163d] to-[#4b235e] px-3 sm:px-4 py-2 text-xs sm:text-sm font-bold text-white shadow-md shadow-purple-950/20 transition-all hover:scale-[1.02] hover:from-[#3d1952] hover:to-[#5b2c6f] active:scale-95 cursor-pointer flex-shrink-0"
              title="Return to Dashboard"
            >
              <ArrowLeft className="h-4 w-4 text-[#ffc15a]" />
              <span className="hidden sm:inline">Back to Main Page</span>
              <span className="sm:hidden">Back</span>
            </button>

            {/* Clean Single Logo */}
            <Link
              to={mainDashboardPath}
              className="flex items-center gap-2 transition-transform hover:scale-105 min-w-0"
            >
              <div className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#ffc45d] via-[#ff9f2d] to-[#f56a3d] shadow-md shadow-orange-950/20 flex-shrink-0">
                <img
                  src="/drivehub-logo.png"
                  alt="DriveHub Logo"
                  className="h-6 w-auto sm:h-7 object-contain"
                />
              </div>
              <div className="hidden xs:block min-w-0">
                <h1 className="font-display text-base sm:text-xl font-extrabold tracking-wide text-[#2d163d] leading-none truncate">
                  Drive<span className="text-[#f56a3d]">Hub</span>
                </h1>
                <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-[#7c3f8c] mt-0.5 truncate">
                  Verified Fleet
                </p>
              </div>
            </Link>
          </div>

          {/* Right: Dashboard Link & User Pill */}
          <div className="flex items-center gap-1.5 sm:gap-3 flex-shrink-0">
            <Link
              to={mainDashboardPath}
              className="rounded-xl px-2.5 sm:px-3.5 py-1.5 sm:py-2 text-xs sm:text-sm font-bold text-[#4b235e] hover:bg-[#8b4d9b]/10 transition-all border border-transparent hover:border-[#8b4d9b]/20"
            >
              Dashboard
            </Link>

            {user && (
              <div className="flex items-center gap-1.5 rounded-full border border-[#8b4d9b]/20 bg-white/95 px-2.5 sm:px-3.5 py-1 sm:py-1.5 text-xs font-bold text-[#2d163d] shadow-xs">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse flex-shrink-0" />
                <span className="truncate max-w-[70px] xs:max-w-[110px] sm:max-w-none">{user.name}</span>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ================= MAIN CONTAINER ================= */}
      <main className="mx-auto max-w-7xl px-3 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-6 sm:space-y-8">
        <FadeIn>
          {/* ================= 1. LUXURY PURPLE HERO BANNER (MATCHES DASHBOARD) ================= */}
          <section className="relative overflow-hidden rounded-2xl sm:rounded-3xl border border-white/70 bg-gradient-to-r from-[#5b2c6f] via-[#7c3f8c] to-[#a85db4] p-5 sm:p-7 lg:p-9 shadow-xl text-white">
            {/* Ambient decorative glowing elements */}
            <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-white/10 blur-xl pointer-events-none" />
            <div className="absolute -bottom-20 right-32 h-52 w-52 rounded-full bg-white/10 blur-lg pointer-events-none" />
            <div className="absolute left-1/2 top-0 h-full w-1/3 -skew-x-12 bg-white/5 pointer-events-none" />

            <div className="relative z-10 flex flex-col justify-between gap-5 sm:gap-6 lg:flex-row lg:items-center">
              <div>
                {/* Drive Smart Pill Badge */}
                <div className="mb-3 flex w-fit items-center gap-2 rounded-full border border-white/25 bg-white/15 px-3.5 sm:px-4 py-1.5 text-xs font-bold text-white backdrop-blur shadow-sm">
                  <Sparkles className="h-3.5 w-3.5 text-[#ffc15a]" />
                  <span>DRIVE SMART WITH DRIVEHUB</span>
                </div>

                <h1 className="font-display text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-white leading-tight">
                  Find a vehicle to rent <span className="inline-block animate-bounce">🚗</span>
                </h1>

                <p className="mt-2.5 max-w-2xl text-xs sm:text-base text-purple-100 font-medium leading-relaxed">
                  Browse our verified fleet available for instant booking. Verified documentation, seamless Razorpay payments, and 24/7 road concierge.
                </p>
              </div>

              {/* Verified Fleet Metric Card */}
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-3 rounded-2xl bg-white/15 px-4 py-3 sm:px-5 sm:py-3.5 backdrop-blur-md border border-white/20 shadow-md">
                  <div className="flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-xl bg-gradient-to-br from-[#ffc45d] via-[#ff9f2d] to-[#f56a3d] text-white shadow-md font-extrabold text-base sm:text-lg flex-shrink-0">
                    ✨
                  </div>
                  <div>
                    <p className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-purple-200">
                      Live Inventory
                    </p>
                    <p className="text-sm sm:text-base lg:text-lg font-extrabold text-white">
                      {vehicles.length > 0 ? `${vehicles.length} Vehicles Listed` : 'Verified Fleet'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* ================= 2. CATEGORY PILLS FILTER BAR ================= */}
          <section className="mt-6 flex items-center gap-2.5 overflow-x-auto pb-2 scrollbar-none">
            {CATEGORIES.map((cat) => {
              const isActive = (filters.category || '') === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => updateFilter({ category: cat.id || undefined })}
                  className={`flex items-center gap-2 rounded-2xl px-4 py-2.5 text-xs sm:text-sm font-bold whitespace-nowrap transition-all duration-200 cursor-pointer ${
                    isActive
                      ? 'bg-gradient-to-r from-[#ea580c] via-[#f56a3d] to-[#ff9f2d] text-white shadow-md shadow-orange-950/20 scale-[1.03]'
                      : 'bg-white/80 border border-[#8b4d9b]/15 text-[#5b2c6f] hover:bg-white hover:border-[#8b4d9b]/30 hover:text-[#2d163d] shadow-2xs'
                  }`}
                >
                  <span>{cat.icon}</span>
                  <span>{cat.label}</span>
                </button>
              );
            })}
          </section>

          {/* ================= 3. ADVANCED SEARCH & FILTER CONSOLE ================= */}
          <section className="mt-4 rounded-3xl border border-[#8b4d9b]/20 bg-white/90 p-5 sm:p-6 backdrop-blur-xl shadow-xl shadow-purple-950/5">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <div className="flex items-center gap-2 text-xs sm:text-sm font-extrabold uppercase tracking-wider text-[#5b2c6f]">
                <Filter className="h-4 w-4 text-[#ea580c]" />
                <span>Filter Fleet Catalog</span>
              </div>

              {hasActiveFilters && (
                <button
                  onClick={resetFilters}
                  className="flex items-center gap-1.5 text-xs font-bold text-[#ea580c] hover:text-[#c2410c] transition-colors cursor-pointer"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  <span>Reset All Filters</span>
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
              {/* City Input */}
              <div className="relative flex items-center rounded-2xl border border-[#8b4d9b]/20 bg-[#8b4d9b]/5 px-3.5 py-2.5 transition-all focus-within:border-[#7c3f8c] focus-within:ring-2 focus-within:ring-[#7c3f8c]/20 focus-within:bg-white shadow-2xs">
                <MapPin className="h-4 w-4 text-[#7c3f8c] shrink-0 mr-2" />
                <input
                  type="text"
                  placeholder="Enter city (e.g. Mumbai, Prayagraj)..."
                  value={filters.city || ''}
                  onChange={(e) => updateFilter({ city: e.target.value || undefined })}
                  className="w-full bg-transparent text-xs sm:text-sm font-semibold text-[#2d163d] placeholder-[#8b4d9b]/50 focus:outline-none"
                />
              </div>

              {/* Category Dropdown */}
              <div className="relative flex items-center rounded-2xl border border-[#8b4d9b]/20 bg-[#8b4d9b]/5 px-3.5 py-2.5 transition-all focus-within:border-[#7c3f8c] focus-within:ring-2 focus-within:ring-[#7c3f8c]/20 focus-within:bg-white shadow-2xs">
                <Car className="h-4 w-4 text-[#7c3f8c] shrink-0 mr-2" />
                <select
                  value={filters.category || ''}
                  onChange={(e) => updateFilter({ category: e.target.value || undefined })}
                  className="w-full bg-transparent text-xs sm:text-sm font-semibold text-[#2d163d] focus:outline-none cursor-pointer"
                >
                  <option value="">Any Category</option>
                  <option value="bike">Bikes</option>
                  <option value="scooter">Scooters</option>
                  <option value="hatchback">Hatchbacks</option>
                  <option value="sedan">Sedans</option>
                  <option value="suv">SUVs</option>
                  <option value="van">Vans</option>
                  <option value="luxury">Luxury</option>
                </select>
              </div>

              {/* Max Price Input */}
              <div className="relative flex items-center rounded-2xl border border-[#8b4d9b]/20 bg-[#8b4d9b]/5 px-3.5 py-2.5 transition-all focus-within:border-[#7c3f8c] focus-within:ring-2 focus-within:ring-[#7c3f8c]/20 focus-within:bg-white shadow-2xs">
                <IndianRupee className="h-4 w-4 text-[#7c3f8c] shrink-0 mr-2" />
                <input
                  type="number"
                  placeholder="Max budget / day"
                  value={filters.maxPrice || ''}
                  onChange={(e) =>
                    updateFilter({ maxPrice: e.target.value ? Number(e.target.value) : undefined })
                  }
                  className="w-full bg-transparent text-xs sm:text-sm font-semibold text-[#2d163d] placeholder-[#8b4d9b]/50 focus:outline-none"
                />
              </div>

              {/* Sort By Dropdown */}
              <div className="relative flex items-center rounded-2xl border border-[#8b4d9b]/20 bg-[#8b4d9b]/5 px-3.5 py-2.5 transition-all focus-within:border-[#7c3f8c] focus-within:ring-2 focus-within:ring-[#7c3f8c]/20 focus-within:bg-white shadow-2xs">
                <SlidersHorizontal className="h-4 w-4 text-[#7c3f8c] shrink-0 mr-2" />
                <select
                  value={filters.sortBy || ''}
                  onChange={(e) =>
                    updateFilter({ sortBy: (e.target.value || undefined) as SearchFilters['sortBy'] })
                  }
                  className="w-full bg-transparent text-xs sm:text-sm font-semibold text-[#2d163d] focus:outline-none cursor-pointer"
                >
                  <option value="">Sort: Newest First</option>
                  <option value="price_asc">Price: Low to High</option>
                  <option value="price_desc">Price: High to Low</option>
                  <option value="rating">Top Rated Only</option>
                </select>
              </div>
            </div>
          </section>

          {/* Error Message */}
          {error && (
            <div className="rounded-2xl border border-rose-300 bg-rose-50 p-4 text-xs sm:text-sm font-semibold text-rose-700">
              {error}
            </div>
          )}

          {/* ================= 4. VEHICLES GRID DISPLAY ================= */}
          {isLoading ? (
            <div className="mt-8">
              <SkeletonGrid count={6} className="rounded-3xl" />
            </div>
          ) : vehicles.length === 0 ? (
            <div className="mt-8 rounded-3xl border border-[#8b4d9b]/15 bg-white/80 p-10 text-center shadow-md">
              <EmptyState
                title="No vehicles match your search"
                description="Try widening your filters or selecting a different category to view available rides."
              />
              {hasActiveFilters && (
                <div className="mt-5 flex justify-center">
                  <button
                    onClick={resetFilters}
                    className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-[#ea580c] to-[#ff9f2d] px-5 py-2.5 text-xs sm:text-sm font-bold text-white shadow-md hover:scale-105 transition-all cursor-pointer"
                  >
                    <RotateCcw className="h-4 w-4" />
                    <span>Clear All Filters</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-8 mt-6">
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {vehicles.map((v) => (
                  <VehicleCard key={v._id} vehicle={v} />
                ))}
              </div>

              {/* ================= 5. LUXURY PAGINATION ================= */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-3 pt-6 border-t border-[#8b4d9b]/15">
                  <button
                    type="button"
                    disabled={(filters.page || 1) <= 1}
                    onClick={() => setFilters((f) => ({ ...f, page: (f.page || 1) - 1 }))}
                    className="inline-flex items-center gap-1.5 rounded-2xl border border-[#8b4d9b]/20 bg-white px-4 py-2.5 text-xs sm:text-sm font-bold text-[#2d163d] shadow-sm transition-all hover:bg-[#8b4d9b]/10 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                  >
                    <span>← Previous</span>
                  </button>

                  <div className="rounded-2xl border border-[#8b4d9b]/20 bg-white px-4 py-2.5 text-xs sm:text-sm font-bold text-[#5b2c6f] shadow-sm">
                    Page <span className="text-[#ea580c]">{filters.page || 1}</span> of{' '}
                    <span>{totalPages}</span>
                  </div>

                  <button
                    type="button"
                    disabled={(filters.page || 1) >= totalPages}
                    onClick={() => setFilters((f) => ({ ...f, page: (f.page || 1) + 1 }))}
                    className="inline-flex items-center gap-1.5 rounded-2xl border border-[#8b4d9b]/20 bg-gradient-to-r from-[#2d163d] to-[#4b235e] px-5 py-2.5 text-xs sm:text-sm font-bold text-white shadow-md hover:from-[#3d1952] hover:to-[#5b2c6f] transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                  >
                    <span>Next →</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </FadeIn>
      </main>
    </div>
  );
}
