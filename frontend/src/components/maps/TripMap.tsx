import { useEffect, useRef, useState } from 'react';
import { Navigation, MapPin } from 'lucide-react';
import { loadLeaflet } from '@/utils/loadLeaflet';

interface Point {
  lat: number;
  lng: number;
  label: string;
  color: string;
}

/**
 * Static map showing one or more labeled pins (pickup/drop, or a live
 * tracking point). Built on free OpenStreetMap tiles via Leaflet — no
 * API key, no billing account.
 */
export function TripMap({ points }: { points: Point[] }) {
  const [mapReady, setMapReady] = useState(false);
  const mapDivRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);

  useEffect(() => {
    let cancelled = false;
    loadLeaflet().then((ok) => {
      if (!cancelled) setMapReady(ok);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!mapReady || !mapDivRef.current || !window.L || points.length === 0) return;
    const L = window.L;

    if (!mapRef.current) {
      mapRef.current = L.map(mapDivRef.current, { zoomControl: true });
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 19,
      }).addTo(mapRef.current);
    }
    const map = mapRef.current;

    markersRef.current.forEach((m) => map.removeLayer(m));
    markersRef.current = points.map((p) => {
      const icon = L.divIcon({
        className: '',
        html: `<div style="width:16px;height:16px;border-radius:9999px;background:${p.color};border:2.5px solid #ffffff;box-shadow:0 2px 6px rgba(0,0,0,0.35);"></div>`,
        iconSize: [16, 16],
        iconAnchor: [8, 8],
      });
      return L.marker([p.lat, p.lng], { icon, title: p.label }).addTo(map);
    });

    if (points.length === 1) {
      map.setView([points[0].lat, points[0].lng], 14);
    } else {
      const bounds = L.latLngBounds(points.map((p) => [p.lat, p.lng] as [number, number]));
      map.fitBounds(bounds, { padding: [48, 48] });
    }
  }, [mapReady, points]);

  useEffect(() => {
    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

  if (points.length === 0) {
    return (
      <div className="relative flex h-52 w-full flex-col items-center justify-center overflow-hidden rounded-xl border border-slate-200/90 bg-gradient-to-b from-slate-50 via-slate-100/60 to-slate-50 p-6 text-center shadow-inner">
        {/* Decorative subtle GPS grid background */}
        <div
          className="absolute inset-0 opacity-[0.04] pointer-events-none"
          style={{
            backgroundImage:
              'linear-gradient(to right, #000 1px, transparent 1px), linear-gradient(to bottom, #000 1px, transparent 1px)',
            backgroundSize: '24px 24px',
          }}
        />

        {/* Pulse radar rings */}
        <div className="relative mb-3 flex items-center justify-center">
          <span className="absolute h-14 w-14 rounded-full bg-teal-500/10 animate-ping opacity-75" />
          <div className="relative h-12 w-12 rounded-2xl bg-white border border-teal-200/80 shadow-sm flex items-center justify-center text-teal-600">
            <Navigation className="h-6 w-6 transform rotate-45" />
          </div>
        </div>

        <p className="font-display text-sm font-bold text-slate-800">
          Route & GPS Navigation Standby
        </p>
        <p className="mt-1 text-xs text-slate-500 max-w-sm leading-relaxed">
          Interactive map markers and live coordinates will sync automatically once vehicle handover and GPS tracking are activated.
        </p>

        <div className="mt-3.5 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-white text-slate-700 border border-slate-200 shadow-2xs">
          <MapPin className="h-3 w-3 text-amber-500" />
          <span>Pickup & Drop addresses confirmed above</span>
        </div>
      </div>
    );
  }

  if (!mapReady) {
    return (
      <div className="h-52 w-full animate-pulse rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-xs text-slate-400">
        Loading interactive map...
      </div>
    );
  }

  return (
    <div
      ref={mapDivRef}
      className="h-56 w-full rounded-xl border border-slate-200 shadow-inner overflow-hidden"
    />
  );
}