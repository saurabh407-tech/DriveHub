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
  display_name: string;
  lat: string;
  lon: string;
}

/**
 * Address field with live search suggestions (via OpenStreetMap's free
 * Nominatim API) plus a small map with a draggable pin. No API key, no
 * billing account — this replaced a Google Maps version that Google
 * blocks for any Cloud account created after March 2025.
 */
export function LocationPicker({ label, value, onChange, placeholder }: LocationPickerProps) {
  const [mapReady, setMapReady] = useState(false);
  const [inputText, setInputText] = useState(value.address);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const mapDivRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputTextRef = useRef(inputText);
  inputTextRef.current = inputText;
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

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
    if (!mapReady || !mapDivRef.current || !window.L) return;
    const L = window.L;
    const start = { lat: value.lat ?? 28.6139, lng: value.lng ?? 77.209 }; // default: New Delhi, India

    const map = L.map(mapDivRef.current, { zoomControl: true }).setView([start.lat, start.lng], value.lat ? 14 : 5);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map);
    mapRef.current = map;

    if (value.lat && value.lng) {
      const marker = L.marker([value.lat, value.lng], { draggable: true }).addTo(map);
      marker.on('dragend', () => {
        const pos = marker.getLatLng();
        onChangeRef.current({ address: inputTextRef.current, lat: pos.lat, lng: pos.lng });
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

  const placeMarker = (lat: number, lng: number) => {
    if (!mapRef.current || !window.L) return;
    const L = window.L;
    if (markerRef.current) {
      markerRef.current.setLatLng([lat, lng]);
    } else {
      const marker = L.marker([lat, lng], { draggable: true }).addTo(mapRef.current);
      marker.on('dragend', () => {
        const pos = marker.getLatLng();
        onChangeRef.current({ address: inputTextRef.current, lat: pos.lat, lng: pos.lng });
      });
      markerRef.current = marker;
    }
    mapRef.current.setView([lat, lng], 15);
  };

  const searchAddress = (query: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (query.trim().length < 3) {
      setSuggestions([]);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&addressdetails=0&limit=5&q=${encodeURIComponent(
            query
          )}`
        );
        const data: Suggestion[] = await res.json();
        setSuggestions(data);
        setShowSuggestions(true);
      } catch {
        setSuggestions([]);
      }
    }, 400);
  };

  const onInputChange = (text: string) => {
    setInputText(text);
    onChange({ ...value, address: text });
    searchAddress(text);
  };

  const onPickSuggestion = (s: Suggestion) => {
    const lat = parseFloat(s.lat);
    const lng = parseFloat(s.lon);
    setInputText(s.display_name);
    setShowSuggestions(false);
    setSuggestions([]);
    onChange({ address: s.display_name, lat, lng });
    placeMarker(lat, lng);
  };

  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-ink">{label}</label>
      <div className="relative">
        <input
          value={inputText}
          onChange={(e) => onInputChange(e.target.value)}
          onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
          placeholder={placeholder}
          className="w-full rounded-lg border border-paper-line bg-paper-soft px-3.5 py-2.5 text-sm text-ink placeholder:text-slate/60 focus:outline-none focus:ring-2 focus:ring-route/40 focus:border-route"
        />
        {showSuggestions && suggestions.length > 0 && (
          <ul className="absolute z-10 mt-1 max-h-56 w-full overflow-y-auto rounded-lg border border-paper-line bg-paper-soft shadow-lg">
            {suggestions.map((s, i) => (
              <li key={i}>
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => onPickSuggestion(s)}
                  className="block w-full px-3 py-2 text-left text-sm text-ink hover:bg-black/5"
                >
                  {s.display_name}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {!mapReady ? (
        <div className="h-40 w-full animate-pulse rounded-lg bg-ink/5" />
      ) : (
        <div ref={mapDivRef} className="h-40 w-full rounded-lg border border-paper-line" />
      )}
      <p className="text-xs text-slate">Search an address, pick a suggestion, or drag the pin to fine-tune.</p>
    </div>
  );
}