let loadPromise: Promise<boolean> | null = null;

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => {
      open: () => void;
      on?: (event: string, callback: (response: any) => void) => void;
    };
  }
}

/** Loads the Razorpay Checkout script once and reuses it on subsequent calls. */
export function loadRazorpayScript(): Promise<boolean> {
  if (window.Razorpay) return Promise.resolve(true);
  if (loadPromise) return loadPromise;

  loadPromise = new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });

  return loadPromise;
}
