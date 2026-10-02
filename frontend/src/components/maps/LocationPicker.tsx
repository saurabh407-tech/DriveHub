import { useEffect, useRef, useState } from 'react';
import { loadLeaflet } from '@/utils/loadLeaflet';

export interface LocationValue {
  address: string;
  lat?: number;
  lng?: number;
}

interface LocationPickerProps {
  label: string;
  value: LocationValue;
  onChange: (value: LocationValue) => void;
  placeholder?: string;
}

interface Suggestion {
  title: string;
  subtitle: string;
  display_name: string;
  lat: number;
  lng: number;
}

/**
 * Address field with live search suggestions (via Photon / OpenStreetMap API)
 * plus an interactive map with clickable placement, draggable pin, and reverse geocoding.
 */
export function LocationPicker({ label, value, onChange, placeholder }: LocationPickerProps) {
  const [mapReady, setMapReady] = useState(false);
  const [inputText, setInputText] = useState(value.address);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const mapDivRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputTextRef = useRef(inputText);
  inputTextRef.current = inputText;
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  // Keep internal text in sync with incoming value if changed externally
  useEffect(() => {
    if (value.address !== inputTextRef.current) {
      setInputText(value.address || '');
    }
  }, [value.address]);

  useEffect(() => {
    let cancelled = false;
    loadLeaflet().then((ok) => {
      if (!cancelled) setMapReady(ok);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const reverseGeocode = async (lat: number, lng: number) => {
    try {
      const res = await fetch(`https://photon.komoot.io/reverse?lat=${lat}&lon=${lng}`);
      const data = await res.json();
      const f = data.features?.[0];
      if (f) {
        const p = f.properties || {};
        const title = p.name || p.street || p.city || '';
        const parts = [title, p.street, p.district, p.city, p.state, p.country].filter(
          (item, idx, self) => item && self.indexOf(item) === idx
        );
        const resolvedAddress = parts.join(', ');
        if (resolvedAddress) {
          setInputText(resolvedAddress);
          onChangeRef.current({ address: resolvedAddress, lat, lng });
          return;
        }
      }
    } catch {
      // Fallback: keep current address or coordinates
    }
    const fallbackText = inputTextRef.current || `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
    onChangeRef.current({ address: fallbackText, lat, lng });
  };

  const placeMarker = (lat: number, lng: number, shouldReverse = false) => {
    if (!mapRef.current || !window.L) return;
    const L = window.L;

    if (markerRef.current) {
      markerRef.current.setLatLng([lat, lng]);
    } else {
      const marker = L.marker([lat, lng], { draggable: true }).addTo(mapRef.current);
      marker.on('dragend', () => {
        const pos = marker.getLatLng();
        reverseGeocode(pos.lat, pos.lng);
      });
      markerRef.current = marker;
    }

    mapRef.current.setView([lat, lng], 15);
    if (shouldReverse) {
      reverseGeocode(lat, lng);
    }
  };

  useEffect(() => {
    if (!mapReady || !mapDivRef.current || !window.L) return;
    const L = window.L;
    const start = { lat: value.lat ?? 28.6139, lng: value.lng ?? 77.209 }; // default: New Delhi, India

    const map = L.map(mapDivRef.current, { zoomControl: true }).setView([start.lat, start.lng], value.lat ? 14 : 5);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map);
    mapRef.current = map;

    // Allow user to click anywhere on the map to set location
    map.on('click', (e: any) => {
      placeMarker(e.latlng.lat, e.latlng.lng, true);
    });

    if (value.lat && value.lng) {
      const marker = L.marker([value.lat, value.lng], { draggable: true }).addTo(map);
      marker.on('dragend', () => {
        const pos = marker.getLatLng();
        reverseGeocode(pos.lat, pos.lng);
      });
      markerRef.current = marker;
    }

    return () => {
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapReady]);

  const searchAddress = (query: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (query.trim().length < 2) {
      setSuggestions([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    debounceRef.current = setTimeout(async () => {
      try {
        // Photon is optimized for autocomplete with open CORS for web browsers
        const res = await fetch(`https://photon.komoot.io/api/?q=${encodeURIComponent(query.trim())}&limit=6`);
        const data = await res.json();
        const items: Suggestion[] = (data.features || []).map((f: any) => {
          const p = f.properties || {};
          const [lng, lat] = f.geometry.coordinates;
          const title = p.name || p.street || p.city || 'Location';
          const subtitleParts = [p.street, p.district, p.city, p.county, p.state, p.country].filter(
            (item, index, self) => item && item !== title && self.indexOf(item) === index
          );
          const subtitle = subtitleParts.join(', ');
          const display_name = subtitle ? `${title}, ${subtitle}` : title;
          return { title, subtitle, display_name, lat, lng };
        });

        setSuggestions(items);
        setShowSuggestions(items.length > 0);
      } catch {
        // Fallback to nominatim if photon is temporarily down
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/search?format=json&limit=5&q=${encodeURIComponent(query)}`
          );
          const data = await res.json();
          const items: Suggestion[] = (data || []).map((d: any) => ({
            title: d.display_name.split(',')[0],
            subtitle: d.display_name.split(',').slice(1).join(',').trim(),
            display_name: d.display_name,
            lat: parseFloat(d.lat),
            lng: parseFloat(d.lon),
          }));
          setSuggestions(items);
          setShowSuggestions(items.length > 0);
        } catch {
          setSuggestions([]);
        }
      } finally {
        setIsLoading(false);
      }
    }, 300);
  };

  const onInputChange = (text: string) => {
    setInputText(text);
    onChange({ ...value, address: text });
    searchAddress(text);
  };

  const onPickSuggestion = (s: Suggestion) => {
    setInputText(s.display_name);
    setShowSuggestions(false);
    setSuggestions([]);
    onChange({ address: s.display_name, lat: s.lat, lng: s.lng });
    placeMarker(s.lat, s.lng, false);
  };

  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-ink">{label}</label>
      <div className="relative">
        <input
          value={inputText}
          onChange={(e) => onInputChange(e.target.value)}
          onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
          placeholder={placeholder}
          className="w-full rounded-lg border border-paper-line bg-paper-soft px-3.5 py-2.5 pr-8 text-sm text-ink placeholder:text-slate/60 focus:outline-none focus:ring-2 focus:ring-route/40 focus:border-route transition-all"
        />

        {isLoading && (
          <div className="absolute right-3 top-3">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate/30 border-t-ink" />
          </div>
        )}

        {showSuggestions && suggestions.length > 0 && (
          <ul className="absolute z-50 mt-1 max-h-60 w-full overflow-y-auto rounded-xl border border-paper-line bg-white shadow-xl">
            {suggestions.map((s, i) => (
              <li key={i} className="border-b border-paper-line/50 last:border-b-0">
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => onPickSuggestion(s)}
                  className="flex w-full items-start gap-2.5 px-3.5 py-2.5 text-left text-sm text-ink hover:bg-black/5 transition-colors cursor-pointer"
                >
                  <span className="mt-0.5 text-base">📍</span>
                  <div className="flex-1 overflow-hidden">
                    <p className="font-medium text-ink truncate">{s.title}</p>
                    {s.subtitle && <p className="text-xs text-slate truncate">{s.subtitle}</p>}
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {!mapReady ? (
        <div className="h-40 w-full animate-pulse rounded-lg bg-ink/5" />
      ) : (
        <div
          ref={mapDivRef}
          className="h-40 w-full rounded-lg border border-paper-line overflow-hidden cursor-crosshair"
          title="Click anywhere on the map to set location"
        />
      )}
      <p className="text-[11px] text-slate flex items-center justify-between">
        <span>Type to see suggestions, click anywhere on map, or drag pin.</span>
        {value.lat && value.lng && (
          <span className="font-mono text-slate/70">
            {value.lat.toFixed(4)}, {value.lng.toFixed(4)}
          </span>
        )}
      </p>
    </div>
  );
}