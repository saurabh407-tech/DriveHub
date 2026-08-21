import { useEffect, useRef, useState } from 'react';
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
        html: `<div style="width:14px;height:14px;border-radius:9999px;background:${p.color};border:2px solid #0b0f14;"></div>`,
        iconSize: [14, 14],
        iconAnchor: [7, 7],
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
      <div className="flex h-48 w-full flex-col items-center justify-center rounded-lg border border-dashed border-paper-line text-center text-xs text-slate">
        No location pins for this trip yet.
      </div>
    );
  }

  if (!mapReady) {
    return <div className="h-48 w-full animate-pulse rounded-lg bg-ink/5" />;
  }

  return <div ref={mapDivRef} className="h-48 w-full rounded-lg border border-paper-line" />;
}