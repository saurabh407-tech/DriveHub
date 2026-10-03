import { useEffect, useRef, useState } from 'react';
import { Radio, Navigation, AlertCircle, RefreshCw } from 'lucide-react';
import { TripMap } from '@/components/maps/TripMap';
import { updateTripLocation, getTripLocation } from '@/services/bookingApi';

const POLL_INTERVAL_MS = 10_000;

export function LiveTrackingPanel({ bookingId }: { bookingId: string }) {
  const [isSharing, setIsSharing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tracking, setTracking] = useState<{ lat: number; lng: number; updatedAt: string } | null>(null);
  const watchIdRef = useRef<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    const poll = () => {
      getTripLocation(bookingId)
        .then((res) => {
          if (!cancelled) setTracking(res.data.tracking);
        })
        .catch(() => {});
    };
    poll();
    const interval = setInterval(poll, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [bookingId]);

  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) navigator.geolocation.clearWatch(watchIdRef.current);
    };
  }, []);

  const startSharing = () => {
    if (!navigator.geolocation) {
      setError('Location sharing is not supported in this browser.');
      return;
    }
    setError(null);
    setIsSharing(true);
    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        updateTripLocation(bookingId, pos.coords.latitude, pos.coords.longitude).catch(() => {
          setError('Could not update your location. Trying again shortly.');
        });
      },
      () => {
        setError('Location permission was denied.');
        setIsSharing(false);
      },
      { enableHighAccuracy: true, maximumAge: 5000 }
    );
  };

  const stopSharing = () => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setIsSharing(false);
  };

  return (
    <div className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-teal-50 border border-teal-200/80 flex items-center justify-center text-teal-700 shadow-2xs">
            <Radio className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-display text-base font-bold text-slate-900">
                Live GPS Telematics
              </h2>
              {isSharing ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500 text-white uppercase tracking-wider animate-pulse">
                  Broadcasting
                </span>
              ) : (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-600">
                  Standby
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Share real-time coordinates between host and driver
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={isSharing ? stopSharing : startSharing}
          className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold shadow-sm transition-all cursor-pointer ${
            isSharing
              ? 'bg-red-50 text-red-700 border border-red-200 hover:bg-red-100'
              : 'bg-slate-900 text-white hover:bg-slate-800 hover:shadow-md'
          }`}
        >
          {isSharing ? (
            <>
              <span className="h-2 w-2 rounded-full bg-red-500 animate-ping" />
              <span>Stop Sharing</span>
            </>
          ) : (
            <>
              <Navigation className="h-3.5 w-3.5" />
              <span>Share My Location</span>
            </>
          )}
        </button>
      </div>

      {error && (
        <div className="mt-3 flex items-center gap-2 rounded-xl bg-red-50 border border-red-200/80 p-3 text-xs text-red-700">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="mt-4">
        <TripMap
          points={
            tracking ? [{ lat: tracking.lat, lng: tracking.lng, label: 'Current location', color: '#1fb6a6' }] : []
          }
        />
      </div>

      {tracking && (
        <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
          <span className="flex items-center gap-1.5">
            <RefreshCw className="h-3 w-3 text-teal-600 animate-spin" />
            <span>Live sync active</span>
          </span>
          <span>Last signal: {new Date(tracking.updatedAt).toLocaleTimeString('en-IN')}</span>
        </div>
      )}
    </div>
  );
}
