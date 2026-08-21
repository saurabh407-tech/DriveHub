import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/Card';
import type { Booking } from '@/services/bookingApi';
import {
  BOOKING_STATUS_TONE,
  BOOKING_STATUS_LABEL,
} from '@/utils/bookingStatus';

function formatDate(iso?: string) {
  if (!iso) return 'Date unavailable';

  const date = new Date(iso);

  if (Number.isNaN(date.getTime())) {
    return 'Date unavailable';
  }

  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function BookingCard({
  booking,
  viewerRole,
}: {
  booking: Booking;
  viewerRole: 'customer' | 'owner';
}) {
  /*
    Vehicle can be null if the vehicle was deleted,
    hidden, or not populated by the backend.
  */
  const vehicle = booking.vehicle;

  const images = vehicle?.images ?? [];

  const image =
    images.find((item) => item?.isPrimary) ||
    images[0];

  const counterpart =
    viewerRole === 'customer'
      ? booking.owner
      : booking.customer;

  const vehicleTitle =
    vehicle?.title || 'Vehicle unavailable';

  const totalAmount =
    booking.pricing?.totalAmount ?? 0;

  const statusLabel =
    BOOKING_STATUS_LABEL[booking.status] ??
    booking.status;

  const statusTone =
    BOOKING_STATUS_TONE[booking.status] ??
    'neutral';

  return (
    <div className="group flex flex-col gap-5 rounded-2xl border border-paper-line bg-paper-soft p-5 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-[#8b4d9b]/25 hover:shadow-lg sm:flex-row sm:items-center">
      
      {/* Vehicle Image */}
      <div className="h-24 w-full flex-shrink-0 overflow-hidden rounded-xl bg-gradient-to-br from-[#f4edf6] to-[#ece5f0] sm:w-32">
        {image?.url ? (
          <img
            src={image.url}
            alt={vehicleTitle}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            onError={(event) => {
              event.currentTarget.style.display = 'none';
            }}
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-1 text-[#8b4d9b]">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.7"
              className="h-7 w-7"
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

            <span className="text-[10px] font-semibold">
              No vehicle photo
            </span>
          </div>
        )}
      </div>

      {/* Booking Information */}
      <div className="min-w-0 flex-1">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          
          <div className="min-w-0">
            <h3 className="truncate font-display text-lg font-bold text-ink">
              {vehicleTitle}
            </h3>

            {!vehicle && (
              <p className="mt-1 text-xs font-medium text-alert">
                This vehicle is currently unavailable.
              </p>
            )}
          </div>

          <Badge tone={statusTone}>
            {statusLabel}
          </Badge>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate">
          <span>
            {formatDate(booking.startDate)}
          </span>

          <span className="text-[#8b4d9b]">
            →
          </span>

          <span>
            {formatDate(booking.endDate)}
          </span>

          {booking.bookingCode && (
            <>
              <span className="text-slate/40">
                •
              </span>

              <span className="font-medium">
                {booking.bookingCode}
              </span>
            </>
          )}
        </div>

        <p className="mt-2 text-xs text-slate">
          <span className="font-semibold text-ink">
            {viewerRole === 'customer'
              ? 'Owner'
              : 'Customer'}
            :
          </span>{' '}
          {counterpart?.name || 'User unavailable'}
        </p>
      </div>

      {/* Price and Action */}
      <div className="flex flex-row items-center justify-between gap-4 border-t border-paper-line pt-4 sm:flex-col sm:items-end sm:border-t-0 sm:pt-0">
        
        <div className="text-left sm:text-right">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate">
            Total amount
          </p>

          <span className="mt-1 block font-display text-xl font-extrabold text-ink">
            ₹{totalAmount.toLocaleString('en-IN')}
          </span>
        </div>

        <Link
          to={`/bookings/${booking._id}`}
          className="inline-flex items-center gap-1.5 rounded-lg bg-[#8b4d9b]/10 px-4 py-2 text-xs font-bold text-[#6d367c] transition-all duration-300 hover:scale-105 hover:bg-[#8b4d9b] hover:text-white hover:shadow-md"
        >
          View details

          <span aria-hidden="true">
            →
          </span>
        </Link>
      </div>
    </div>
  );
}