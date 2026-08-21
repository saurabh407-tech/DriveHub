import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Badge } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { LocationPicker } from '@/components/maps/LocationPicker';
import type { LocationValue } from '@/components/maps/LocationPicker';
import { useAppSelector } from '@/hooks/useAppRedux';
import { getVehicle } from '@/services/vehicleApi';
import { createBooking } from '@/services/bookingApi';

type Vehicle = Awaited<ReturnType<typeof getVehicle>>['data']['vehicle'];

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export default function VehicleDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const user = useAppSelector((s) => s.auth.user);

  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [startDate, setStartDate] = useState(todayISO());
  const [endDate, setEndDate] = useState(todayISO());
  const [pickup, setPickup] = useState<LocationValue>({ address: '' });
  const [drop, setDrop] = useState<LocationValue>({ address: '' });
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [isBooking, setIsBooking] = useState(false);

  useEffect(() => {
    if (!id) return;
    getVehicle(id)
      .then((res) => setVehicle(res.data.vehicle))
      .catch(() => setError('This vehicle could not be found.'));
  }, [id]);

  const days = useMemo(() => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diff = Math.ceil((end.getTime() - start.getTime()) / (24 * 60 * 60 * 1000));
    return Math.max(1, diff);
  }, [startDate, endDate]);

  const estimatedTotal = vehicle ? days * vehicle.pricing.perDay + vehicle.pricing.securityDeposit : 0;

  if (error) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-16 text-center">
        <p className="text-sm text-slate">{error}</p>
        <Link to="/vehicles" className="mt-4 inline-block text-sm font-medium text-route-dim hover:underline">
          Back to browsing
        </Link>
      </div>
    );
  }

  if (!vehicle) {
    return (
      <div className="mx-auto max-w-5xl px-6 py-10">
        <div className="aspect-[16/9] w-full animate-pulse rounded-2xl bg-ink/5" />
      </div>
    );
  }

  const primaryImage = vehicle.images.find((img) => img.isPrimary) || vehicle.images[0];

  const onBook = async () => {
    setBookingError(null);

    if (!user) {
      navigate('/login', { state: { from: `/vehicles/${id}` } });
      return;
    }
    if (user.role !== 'customer') {
      setBookingError('Only customer accounts can book vehicles.');
      return;
    }
    if (!pickup.address.trim() || !drop.address.trim()) {
      setBookingError('Enter both a pickup and drop-off address.');
      return;
    }
    if (new Date(endDate) <= new Date(startDate)) {
      setBookingError('Drop-off date must be after the pickup date.');
      return;
    }

    setIsBooking(true);
    try {
      const res = await createBooking({
        vehicleId: vehicle._id,
        startDate: new Date(startDate).toISOString(),
        endDate: new Date(endDate).toISOString(),
        pickupLocation: pickup,
        dropLocation: drop,
      });
      navigate(`/bookings/${res.data.booking._id}/pay`);
    } catch (err) {
      const anyErr = err as { response?: { data?: { message?: string } } };
      setBookingError(anyErr?.response?.data?.message || 'Could not complete this booking. Please try again.');
    } finally {
      setIsBooking(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <Link to="/vehicles" className="text-sm font-medium text-slate hover:text-ink">
        ← Back to browsing
      </Link>

      <div className="mt-4 grid grid-cols-1 gap-8 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <div className="aspect-[4/3] overflow-hidden rounded-2xl bg-ink/5">
            {primaryImage ? (
              <img src={primaryImage.url} alt={vehicle.title} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-sm text-slate">
                No photos uploaded yet
              </div>
            )}
          </div>
          {vehicle.images.length > 1 && (
            <div className="mt-3 grid grid-cols-5 gap-2">
              {vehicle.images.slice(0, 5).map((img) => (
                <div key={img.publicId} className="aspect-square overflow-hidden rounded-lg bg-ink/5">
                  <img src={img.url} alt="" className="h-full w-full object-cover" />
                </div>
              ))}
            </div>
          )}

          {vehicle.description && (
            <div className="mt-8">
              <h2 className="font-display text-lg font-semibold text-ink">About this vehicle</h2>
              <p className="mt-2 whitespace-pre-line text-sm text-slate">{vehicle.description}</p>
            </div>
          )}
        </div>

        <div className="lg:col-span-2">
          <Badge tone="neutral">{vehicle.category}</Badge>
          <h1 className="mt-3 font-display text-2xl font-semibold text-ink">{vehicle.title}</h1>
          <p className="mt-1 text-sm text-slate">
            {vehicle.location.city}, {vehicle.location.state}
          </p>

          <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
            <Spec label="Transmission" value={vehicle.transmission} />
            <Spec label="Fuel type" value={vehicle.fuelType} />
            <Spec label="Seats" value={String(vehicle.seats)} />
            <Spec label="Year" value={String(vehicle.year)} />
          </div>

          <div className="mt-6 rounded-2xl border border-paper-line bg-paper-soft p-5">
            <div className="flex items-baseline justify-between">
              <span className="font-display text-2xl font-semibold text-ink">
                ₹{vehicle.pricing.perDay.toLocaleString('en-IN')}
              </span>
              <span className="text-sm text-slate">/ day</span>
            </div>
            <p className="mt-1 text-xs text-slate">
              + ₹{vehicle.pricing.securityDeposit.toLocaleString('en-IN')} refundable security deposit
            </p>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <Input
                label="Pickup date"
                type="date"
                min={todayISO()}
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
              <Input
                label="Drop-off date"
                type="date"
                min={startDate}
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
            <div className="mt-3">
              <LocationPicker
                label="Pickup address"
                placeholder="Where should we bring the vehicle?"
                value={pickup}
                onChange={setPickup}
              />
            </div>
            <div className="mt-3">
              <LocationPicker
                label="Drop-off address"
                placeholder="Where will you return it?"
                value={drop}
                onChange={setDrop}
              />
            </div>

            <div className="mt-4 flex items-center justify-between text-sm text-slate">
              <span>
                {days} day{days > 1 ? 's' : ''} estimate
              </span>
              <span className="font-display text-base font-semibold text-ink">
                ₹{estimatedTotal.toLocaleString('en-IN')}
              </span>
            </div>
            <p className="text-xs text-slate">Final total includes GST, shown at checkout.</p>

            {bookingError && (
              <p role="alert" className="mt-3 rounded-lg bg-alert/10 px-3 py-2 text-sm text-alert">
                {bookingError}
              </p>
            )}

            <Button fullWidth className="mt-4" onClick={onBook} isLoading={isBooking}>
              {user ? 'Book this vehicle' : 'Log in to book'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Spec({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-ink/5 px-3 py-2">
      <p className="text-xs text-slate capitalize">{label}</p>
      <p className="font-medium text-ink capitalize">{value}</p>
    </div>
  );
}
