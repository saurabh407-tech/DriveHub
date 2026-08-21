// Loads Leaflet + OpenStreetMap tiles from a public CDN. No API key, no
// billing account, no Google Cloud Console needed — this replaces the
// Google Maps integration, which Google now blocks for any Cloud
// account created after March 2025 (their Places Autocomplete API is
// "not available to new customers" — a hard platform restriction, not
// a settings issue).

declare global {
  interface Window {
    L?: any;
  }
}

let loadPromise: Promise<boolean> | null = null;

export function loadLeaflet(): Promise<boolean> {
  if (window.L) return Promise.resolve(true);
  if (loadPromise) return loadPromise;

  loadPromise = new Promise((resolve) => {
    const cssLink = document.createElement('link');
    cssLink.rel = 'stylesheet';
    cssLink.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    document.head.appendChild(cssLink);

    const script = document.createElement('script');
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    script.async = true;
    script.onload = () => resolve(!!window.L);
    script.onerror = () => resolve(false);
    document.head.appendChild(script);
  });

  return loadPromise;
}