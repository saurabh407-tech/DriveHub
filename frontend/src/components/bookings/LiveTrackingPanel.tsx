import { useEffect, useRef, useState } from 'react';
import { TripMap } from '@/components/maps/TripMap';
import { Button } from '@/components/ui/Button';
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
    <div className="rounded-2xl border border-paper-line bg-paper-soft p-5">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-base font-semibold text-ink">Live location</h2>
        <Button size="sm" variant={isSharing ? 'danger' : 'secondary'} onClick={isSharing ? stopSharing : startSharing}>
          {isSharing ? 'Stop sharing' : 'Share my location'}
        </Button>
      </div>

      {error && <p className="mt-2 text-xs text-alert">{error}</p>}

      <div className="mt-3">
        <TripMap
          points={
            tracking ? [{ lat: tracking.lat, lng: tracking.lng, label: 'Current location', color: '#1fb6a6' }] : []
          }
        />
      </div>
      {tracking && (
        <p className="mt-2 text-xs text-slate">
          Last updated {new Date(tracking.updatedAt).toLocaleTimeString('en-IN')}
        </p>
      )}
    </div>
  );
}
