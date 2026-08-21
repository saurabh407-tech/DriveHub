let loadPromise: Promise<boolean> | null = null;

declare global {
  interface Window {
    google?: typeof google;
  }
}

export function isGoogleMapsConfigured(): boolean {
  return !!import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
}

/**
 * Loads the Maps JavaScript API + Places library once and reuses it on
 * subsequent calls. Resolves false (instead of throwing) if no API key is
 * configured or the script fails to load, so callers can fall back to a
 * plain text input rather than crash the page.
 */
export function loadGoogleMaps(): Promise<boolean> {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  if (!apiKey) return Promise.resolve(false);
  if (window.google?.maps) return Promise.resolve(true);
  if (loadPromise) return loadPromise;

  loadPromise = new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
    script.async = true;
    script.onload = () => resolve(!!window.google?.maps);
    script.onerror = () => resolve(false);
    document.head.appendChild(script);
  });

  return loadPromise;
}
