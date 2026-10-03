import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams, useLocation, Navigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Badge } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { LocationPicker } from '@/components/maps/LocationPicker';
import type { LocationValue } from '@/components/maps/LocationPicker';
import { useAppSelector } from '@/hooks/useAppRedux';
import { getVehicle } from '@/services/vehicleApi';
import { createBooking } from '@/services/bookingApi';

type Vehicle = Awaited<ReturnType<typeof getVehicle>>['data']['vehicle'];

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function checkCityAvailability(
  enteredAddress: string,
  vehicleCity: string
): { isAvailable: boolean; message?: string } {
  if (!enteredAddress || !enteredAddress.trim()) {
    return { isAvailable: false, message: 'Please enter a pickup address.' };
  }

  const vCity = (vehicleCity || '').trim().toLowerCase();
  if (!vCity) return { isAvailable: true };

  const text = enteredAddress.trim().toLowerCase();

  const synonyms: Record<string, string[]> = {
    prayagraj: ['prayagraj', 'allahabad'],
    allahabad: ['prayagraj', 'allahabad'],
    varanasi: ['varanasi', 'banaras', 'kashi'],
    bengaluru: ['bengaluru', 'bangalore'],
    bangalore: ['bengaluru', 'bangalore'],
    mumbai: ['mumbai', 'bombay'],
    bombay: ['mumbai', 'bombay'],
    kolkata: ['kolkata', 'calcutta'],
    calcutta: ['kolkata', 'calcutta'],
    chennai: ['chennai', 'madras'],
    madras: ['chennai', 'madras'],
    delhi: ['delhi', 'new delhi', 'ncr'],
    'new delhi': ['delhi', 'new delhi', 'ncr'],
    gurugram: ['gurugram', 'gurgaon'],
    gurgaon: ['gurugram', 'gurgaon'],
    pune: ['pune', 'poona'],
    ayodhya: ['ayodhya', 'faizabad'],
  };

  const allowedCities = [vCity, ...(synonyms[vCity] || [])];

  const containsAllowedCity = allowedCities.some((c) => {
    const regex = new RegExp(`(^|[\\s,.-])${c}([\\s,.-]|$)`, 'i');
    return regex.test(text) || text.includes(c);
  });

  const ALL_MAJOR_CITIES = [
    'lucknow', 'kanpur', 'delhi', 'new delhi', 'noida', 'gurugram', 'gurgaon', 'ghaziabad',
    'faridabad', 'agra', 'varanasi', 'banaras', 'kashi', 'prayagraj', 'allahabad', 'mumbai',
    'bombay', 'pune', 'bangalore', 'bengaluru', 'hyderabad', 'chennai', 'madras', 'kolkata',
    'calcutta', 'jaipur', 'ahmedabad', 'surat', 'indore', 'bhopal', 'patna', 'chandigarh',
    'dehradun', 'gorakhpur', 'meerut', 'bareilly', 'aligarh', 'moradabad', 'jhansi', 'ayodhya',
    'faizabad', 'gwalior', 'jabalpur', 'raipur', 'ranchi', 'jodhpur', 'kota', 'nagpur',
    'nashik', 'aurangabad', 'amritsar', 'ludhiana', 'jalandhar', 'vadodara', 'rajkot', 'mysore',
    'coimbatore', 'madurai', 'kochi', 'thiruvananthapuram', 'visakhapatnam', 'shimla', 'haridwar'
  ];

  const otherCityFound = ALL_MAJOR_CITIES.find((other) => {
    if (allowedCities.includes(other)) return false;
    const regex = new RegExp(`(^|[\\s,.-])${other}([\\s,.-]|$)`, 'i');
    return regex.test(text) || text.includes(other);
  });

  if (otherCityFound) {
    return {
      isAvailable: false,
      message: `Not available in this location. This vehicle is only available in ${vehicleCity}.`,
    };
  }

  if (containsAllowedCity) {
    return { isAvailable: true };
  }

  return { isAvailable: true };
}

export default function VehicleDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, bootstrapped } = useAppSelector((s) => s.auth);

  const mainDashboardPath = user
    ? user.role === 'owner'
      ? '/owner'
      : user.role === 'admin'
      ? '/admin'
      : '/customer'
    : '/';

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

  const tomorrowISO = () => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  };

  const maxBookingISO = () => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().split('T')[0];
  };

  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [startDate, setStartDate] = useState(todayISO());
  const [endDate, setEndDate] = useState(tomorrowISO());
  const [pickup, setPickup] = useState<LocationValue>({ address: '' });
  const [drop, setDrop] = useState<LocationValue>({ address: '' });
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [isBooking, setIsBooking] = useState(false);

  useEffect(() => {
    if (!id) return;
    getVehicle(id)
      .then((res) => {
        const v = res.data.vehicle;
        setVehicle(v);
        const ownerFullAddress = [v.location?.address, v.location?.city, v.location?.state]
          .filter(Boolean)
          .join(', ') || v.location?.city || '';
        const initialLoc: LocationValue = {
          address: ownerFullAddress,
          lat: v.location?.coordinates?.latitude,
          lng: v.location?.coordinates?.longitude,
        };
        setPickup(initialLoc);
        setDrop(initialLoc);
      })
      .catch(() => setError('This vehicle could not be found.'));
  }, [id]);

  const ownerPickupAddress = useMemo(() => {
    if (!vehicle?.location) return '';
    return [vehicle.location.address, vehicle.location.city, vehicle.location.state]
      .filter(Boolean)
      .join(', ') || vehicle.location.city || '';
  }, [vehicle]);

  const cityAvailability = useMemo(() => {
    if (!vehicle?.location?.city) return { isAvailable: true };
    return checkCityAvailability(pickup.address, vehicle.location.city);
  }, [vehicle, pickup.address]);

  const useOwnerPickup = () => {
    if (!vehicle?.location) return;
    setPickup({
      address: ownerPickupAddress,
      lat: vehicle.location.coordinates?.latitude,
      lng: vehicle.location.coordinates?.longitude,
    });
  };

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
    if (!cityAvailability.isAvailable) {
      setBookingError(
        cityAvailability.message ||
        `Not available in this location. This vehicle is only available for pickup in ${vehicle.location.city}.`
      );
      return;
    }
    if (new Date(endDate) <= new Date(startDate)) {
      setBookingError('Drop-off date must be after the pickup date.');
      return;
    }

    const maxAdvance = new Date();
    maxAdvance.setDate(maxAdvance.getDate() + 30);
    maxAdvance.setHours(23, 59, 59, 999);
    if (new Date(startDate) > maxAdvance) {
      setBookingError('You are not allowed to book a vehicle more than 1 month in advance. Please select dates within the next 30 days.');
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
    <div className="min-h-screen bg-gradient-to-br from-[#f8f4fa] via-[#faefe0] to-[#eee8f2] text-[#2d163d]">
      {/* Top Header with Back Buttons */}
      <header className="sticky top-0 z-30 border-b border-[#8b4d9b]/15 bg-white/85 backdrop-blur-xl shadow-xs">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={() => navigate(mainDashboardPath)}
              className="inline-flex items-center gap-2 rounded-2xl border border-[#8b4d9b]/20 bg-gradient-to-r from-[#2d163d] to-[#4b235e] px-3.5 sm:px-4 py-2 text-xs sm:text-sm font-bold text-white shadow-md shadow-purple-950/20 transition-all hover:scale-[1.02] hover:from-[#3d1952] hover:to-[#5b2c6f] active:scale-95 cursor-pointer"
              title="Go back to Main Dashboard"
            >
              <ArrowLeft className="h-4 w-4 text-[#ffc15a]" />
              <span className="hidden sm:inline">Back to Main Page</span>
              <span className="sm:hidden">Back</span>
            </button>

            <Link
              to="/vehicles"
              className="inline-flex items-center gap-1.5 rounded-2xl border border-[#8b4d9b]/20 bg-white/90 px-3.5 py-2 text-xs sm:text-sm font-bold text-[#5b2c6f] hover:bg-white hover:border-[#8b4d9b]/35 shadow-xs transition-all"
            >
              <span>← Back to Fleet</span>
            </Link>
          </div>

          <Link to={mainDashboardPath} className="flex items-center gap-2.5 transition-transform hover:scale-105">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#ffc45d] via-[#ff9f2d] to-[#f56a3d] shadow-md shadow-orange-950/20">
              <img src="/drivehub-logo.png" alt="DriveHub" className="h-7 w-auto object-contain" />
            </div>
            <div>
              <span className="font-display text-lg sm:text-xl font-extrabold tracking-wide text-[#2d163d] leading-none">
                Drive<span className="text-[#f56a3d]">Hub</span>
              </span>
              <span className="hidden sm:block text-[9px] font-bold uppercase tracking-[0.2em] text-[#7c3f8c] mt-0.5">
                Verified Booking
              </span>
            </div>
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">

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
                max={maxBookingISO()}
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

            {/* 1-Month Booking Policy Notice */}
            <div className="mt-2.5 flex items-center gap-2 rounded-xl bg-[#8b4d9b]/10 border border-[#8b4d9b]/20 px-3 py-2 text-xs font-semibold text-[#5b2c6f]">
              <span>ℹ️</span>
              <span>Advance bookings allowed up to 1 month (30 days) from today.</span>
            </div>

            <div className="mt-3">
              <div className="mb-1 flex items-center justify-between text-xs">
                <span className="font-semibold text-slate">
                  📍 Vehicle Base City: <strong className="text-ink">{vehicle.location.city}</strong>
                </span>
                {ownerPickupAddress && pickup.address !== ownerPickupAddress && (
                  <button
                    type="button"
                    onClick={useOwnerPickup}
                    className="font-bold text-[#ea580c] hover:underline cursor-pointer"
                  >
                    Reset to Owner's Address
                  </button>
                )}
              </div>
              <LocationPicker
                label="Pickup address"
                placeholder="Where should we bring the vehicle?"
                value={pickup}
                onChange={setPickup}
              />
              {/* City Availability Indicator */}
              {pickup.address.trim() && (
                <div className="mt-2">
                  {cityAvailability.isAvailable ? (
                    <div className="flex items-center gap-2 rounded-xl bg-emerald-500/10 border border-emerald-500/25 px-3 py-2 text-xs font-bold text-emerald-700 dark:text-emerald-300">
                      <span className="flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 text-white text-[10px]">✓</span>
                      <span>Available in {vehicle.location.city}</span>
                    </div>
                  ) : (
                    <div className="rounded-xl border border-rose-500/40 bg-rose-500/10 p-3 text-xs text-rose-700 dark:text-rose-300">
                      <div className="flex items-center gap-1.5 font-bold">
                        <span>❌</span>
                        <span>Not available in this location</span>
                      </div>
                      <p className="mt-1 text-[11px] text-rose-600/90 dark:text-rose-400">
                        This vehicle is only available for pickup in <strong>{vehicle.location.city}</strong>. Please enter an address within {vehicle.location.city}.
                      </p>
                      {ownerPickupAddress && (
                        <button
                          type="button"
                          onClick={useOwnerPickup}
                          className="mt-2 inline-flex items-center gap-1 font-bold text-[11px] text-rose-800 dark:text-rose-200 underline cursor-pointer"
                        >
                          📍 Use Owner's pickup address ({ownerPickupAddress})
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}
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

            <button
              type="button"
              onClick={onBook}
              disabled={isBooking || !cityAvailability.isAvailable}
              className={`mt-5 w-full rounded-2xl py-3.5 px-6 text-sm sm:text-base font-extrabold text-white shadow-lg transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed ${
                !cityAvailability.isAvailable
                  ? 'bg-slate-400 shadow-none'
                  : 'bg-gradient-to-r from-[#ea580c] via-[#f56a3d] to-[#ff9f2d] shadow-orange-950/20 hover:scale-[1.01] active:scale-[0.99]'
              }`}
            >
              {isBooking
                ? 'Processing Booking...'
                : !cityAvailability.isAvailable
                ? `Not available in this location (Vehicle is in ${vehicle.location.city})`
                : user
                ? 'Book this vehicle'
                : 'Log in to book'}
            </button>
          </div>
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
