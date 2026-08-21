import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/Card';
import type { VehicleSummary } from '@/services/vehicleApi';

export function VehicleCard({
  vehicle,
}: {
  vehicle: VehicleSummary;
}) {
  const images = vehicle.images ?? [];

  const primaryImage =
    images.find((img) => img?.isPrimary) ||
    images[0];

  const locationText = [
    vehicle.location?.city,
    vehicle.location?.state,
  ]
    .filter(Boolean)
    .join(', ');

  const pricePerDay =
    vehicle.pricing?.perDay ?? 0;

  const ratingCount =
    vehicle.ratingCount ?? 0;

  const ratingAverage =
    vehicle.ratingAverage ?? 0;

  return (
    <Link
      to={`/vehicles/${vehicle._id}`}
      className="group relative flex h-full flex-col overflow-hidden rounded-3xl border border-[#8b4d9b]/15 bg-white shadow-sm transition-all duration-500 hover:-translate-y-2 hover:border-[#8b4d9b]/35 hover:shadow-2xl hover:shadow-purple-200/50"
    >
      {/* Vehicle Image */}
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-gradient-to-br from-[#f5edf7] via-[#eee5f1] to-[#e4d8e9]">
        {primaryImage?.url ? (
          <img
            src={primaryImage.url}
            alt={vehicle.title || 'Vehicle'}
            className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
            loading="lazy"
            onError={(event) => {
              event.currentTarget.style.display = 'none';
            }}
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-3 text-[#7c3f8c]">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/70 shadow-sm">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.7"
                className="h-8 w-8"
                aria-hidden="true"
              >
                <path
                  d="M3 13l1.5-5A2 2 0 0 1 6.4 6.5h11.2A2 2 0 0 1 19.5 8L21 13v6a1 1 0 0 1-1 1h-1a1 1 0 0 1-1-1v-1H6v1a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1z"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M5 13h14"
                  strokeLinecap="round"
                />
              </svg>
            </div>

            <span className="text-sm font-semibold">
              Vehicle image unavailable
            </span>
          </div>
        )}

        {/* Image overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-transparent opacity-70" />

        {/* Category */}
        <div className="absolute left-4 top-4">
          <div className="rounded-full border border-white/50 bg-white/85 px-3 py-1.5 shadow-md backdrop-blur-md">
            <Badge tone="neutral">
              {vehicle.category || 'Vehicle'}
            </Badge>
          </div>
        </div>

        {/* Rating */}
        {ratingCount > 0 && (
          <div className="absolute right-4 top-4 flex items-center gap-1.5 rounded-full border border-white/30 bg-black/45 px-3 py-1.5 text-xs font-bold text-white shadow-md backdrop-blur-md">
            <span className="text-[#ffc15a]">
              ★
            </span>

            <span>
              {ratingAverage.toFixed(1)}
            </span>

            <span className="text-white/65">
              ({ratingCount})
            </span>
          </div>
        )}

        {/* View button on hover */}
        <div className="absolute inset-x-0 bottom-4 flex justify-center translate-y-5 opacity-0 transition-all duration-500 group-hover:translate-y-0 group-hover:opacity-100">
          <span className="rounded-xl bg-white px-5 py-2.5 text-xs font-bold text-[#6d367c] shadow-lg">
            View vehicle →
          </span>
        </div>
      </div>

      {/* Vehicle Information */}
      <div className="flex flex-1 flex-col p-5">
        {/* Title and location */}
        <div>
          <h3 className="line-clamp-1 font-display text-xl font-extrabold tracking-tight text-[#241b2f] transition-colors duration-300 group-hover:text-[#7c3f8c]">
            {vehicle.title || 'Vehicle'}
          </h3>

          <div className="mt-2 flex items-center gap-2 text-sm text-slate">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              className="h-4 w-4 shrink-0 text-[#8b4d9b]"
              aria-hidden="true"
            >
              <path
                d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <circle
                cx="12"
                cy="10"
                r="2.5"
              />
            </svg>

            <span className="truncate">
              {locationText || 'Location unavailable'}
            </span>
          </div>
        </div>

        {/* Vehicle Features */}
        <div className="mt-5 grid grid-cols-3 gap-2">
          <div className="flex flex-col items-center rounded-xl border border-[#8b4d9b]/10 bg-[#8b4d9b]/5 px-2 py-3">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.7"
              className="mb-1 h-4 w-4 text-[#7c3f8c]"
              aria-hidden="true"
            >
              <path
                d="M4 7h16M7 4v6M17 4v6M6 17h12"
                strokeLinecap="round"
              />
            </svg>

            <span className="max-w-full truncate text-[10px] font-semibold text-[#594360]">
              {vehicle.transmission || 'N/A'}
            </span>
          </div>

          <div className="flex flex-col items-center rounded-xl border border-[#8b4d9b]/10 bg-[#8b4d9b]/5 px-2 py-3">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.7"
              className="mb-1 h-4 w-4 text-[#7c3f8c]"
              aria-hidden="true"
            >
              <path
                d="M12 2v20M8 6h6a3 3 0 0 1 0 6H10a3 3 0 0 0 0 6h6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>

            <span className="max-w-full truncate text-[10px] font-semibold text-[#594360]">
              {vehicle.fuelType || 'N/A'}
            </span>
          </div>

          <div className="flex flex-col items-center rounded-xl border border-[#8b4d9b]/10 bg-[#8b4d9b]/5 px-2 py-3">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.7"
              className="mb-1 h-4 w-4 text-[#7c3f8c]"
              aria-hidden="true"
            >
              <circle
                cx="12"
                cy="7"
                r="3"
              />
              <path
                d="M5 21a7 7 0 0 1 14 0"
                strokeLinecap="round"
              />
            </svg>

            <span className="max-w-full truncate text-[10px] font-semibold text-[#594360]">
              {vehicle.seats ?? '—'} seats
            </span>
          </div>
        </div>

        {/* Price */}
        <div className="mt-5 flex items-end justify-between border-t border-[#8b4d9b]/10 pt-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate">
              Starting from
            </p>

            <div className="mt-1 flex items-baseline gap-1">
              <span className="font-display text-2xl font-extrabold text-[#241b2f]">
                ₹{pricePerDay.toLocaleString('en-IN')}
              </span>

              <span className="text-xs font-medium text-slate">
                / day
              </span>
            </div>
          </div>

          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#6d367c] to-[#9b55a8] text-lg font-bold text-white shadow-md transition-all duration-300 group-hover:scale-110 group-hover:rotate-[-8deg]">
            →
          </div>
        </div>
      </div>
    </Link>
  );
}