import { useEffect, useRef } from 'react';

const TOTAL_FRAMES = 300;

// Persistent frame cache across the public marketing session
// This ensures frames are downloaded only once and instantly available across all public pages
const globalImageCache: HTMLImageElement[] = new Array(TOTAL_FRAMES + 1);
const globalLoadedStatus: boolean[] = new Array(TOTAL_FRAMES + 1).fill(false);
let isPreloadStarted = false;

export function PublicScrollAnimation() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    let isMounted = true;
    let animId: number;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    const getFrameUrl = (index: number) => {
      const pad = String(index).padStart(4, '0');
      return `/frames/frame_${pad}.jpg`;
    };

    let currentFrame = 1;
    let targetFrame = 1;
    let lastDrawnFrame = -1;
    let isFirstFrameDrawn = false;

    // Retina / HiDPI responsive canvas sizing
    const resizeCanvas = () => {
      if (!canvas) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const displayW = window.innerWidth;
      const displayH = window.innerHeight;

      const targetW = Math.round(displayW * dpr);
      const targetH = Math.round(displayH * dpr);

      if (canvas.width !== targetW || canvas.height !== targetH) {
        canvas.width = targetW;
        canvas.height = targetH;
      }

      lastDrawnFrame = -1;
      drawFrame(Math.round(currentFrame));
    };

    // Draw frame centered with cover aspect ratio
    const drawImageCover = (img: HTMLImageElement) => {
      if (!img || !img.complete || img.naturalWidth === 0) return;

      const cw = canvas.width;
      const ch = canvas.height;
      const iw = img.naturalWidth;
      const ih = img.naturalHeight;

      const scale = Math.max(cw / iw, ch / ih);
      const nw = iw * scale;
      const nh = ih * scale;
      const nx = (cw - nw) / 2;
      const ny = (ch - nh) / 2;

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, nx, ny, nw, nh);
    };

    // Fallback to nearest loaded frame to eliminate any black flashing or stutter
    const getClosestLoadedFrame = (frameIdx: number) => {
      if (globalLoadedStatus[frameIdx] && globalImageCache[frameIdx]) {
        return globalImageCache[frameIdx];
      }

      for (let offset = 1; offset < TOTAL_FRAMES; offset++) {
        const prev = frameIdx - offset;
        if (prev >= 1 && globalLoadedStatus[prev] && globalImageCache[prev]) {
          return globalImageCache[prev];
        }
        const next = frameIdx + offset;
        if (next <= TOTAL_FRAMES && globalLoadedStatus[next] && globalImageCache[next]) {
          return globalImageCache[next];
        }
      }
      return null;
    };

    const drawFrame = (frameIdx: number) => {
      const clamped = Math.max(1, Math.min(TOTAL_FRAMES, frameIdx));
      const img = getClosestLoadedFrame(clamped);
      if (img) {
        drawImageCover(img);
      }
    };

    // Continuous scroll progress calculation based on the entire scrollable public page
    const updateScrollProgress = () => {
      const scrollTop = window.scrollY || window.pageYOffset || document.documentElement.scrollTop || 0;
      const scrollHeight = Math.max(
        document.documentElement.scrollHeight,
        document.body.scrollHeight,
        document.documentElement.offsetHeight,
        document.body.offsetHeight
      );
      const maxScroll = Math.max(1, scrollHeight - window.innerHeight);

      const progress = Math.max(0, Math.min(1, scrollTop / maxScroll));
      targetFrame = 1 + progress * (TOTAL_FRAMES - 1);
    };

    // Smooth render loop with damping
    const renderLoop = () => {
      if (!isMounted) return;

      updateScrollProgress();

      // Fluid interpolation easing
      currentFrame += (targetFrame - currentFrame) * 0.18;

      const rounded = Math.round(currentFrame);
      if (rounded !== lastDrawnFrame) {
        drawFrame(rounded);
        lastDrawnFrame = rounded;
      }

      animId = requestAnimationFrame(renderLoop);
    };

    // Load single frame
    const loadFrame = (index: number): Promise<HTMLImageElement | null> => {
      return new Promise((resolve) => {
        if (globalImageCache[index]) {
          resolve(globalImageCache[index]);
          return;
        }

        const img = new Image();
        img.src = getFrameUrl(index);
        globalImageCache[index] = img;

        img.onload = () => {
          globalLoadedStatus[index] = true;
          if (!isFirstFrameDrawn && index === 1) {
            isFirstFrameDrawn = true;
            drawFrame(1);
          }
          resolve(img);
        };

        img.onerror = () => {
          resolve(null);
        };
      });
    };

    // Preloader with concurrency pool
    const startPreloader = async () => {
      if (isPreloadStarted) {
        // Already started or cached; draw initial frame immediately
        drawFrame(Math.round(targetFrame));
        return;
      }
      isPreloadStarted = true;

      // 1. Initial frame
      await loadFrame(1);
      drawFrame(1);

      // 2. Keyframes (every 5th frame)
      const keyframes: number[] = [];
      for (let i = 5; i <= TOTAL_FRAMES; i += 5) {
        keyframes.push(i);
      }
      const CONCURRENCY = 8;
      for (let i = 0; i < keyframes.length; i += CONCURRENCY) {
        const batch = keyframes.slice(i, i + CONCURRENCY);
        await Promise.all(batch.map((idx) => loadFrame(idx)));
      }

      // 3. Remaining frames
      const remaining: number[] = [];
      for (let i = 1; i <= TOTAL_FRAMES; i++) {
        if (!globalLoadedStatus[i]) {
          remaining.push(i);
        }
      }
      for (let i = 0; i < remaining.length; i += CONCURRENCY) {
        const batch = remaining.slice(i, i + CONCURRENCY);
        await Promise.all(batch.map((idx) => loadFrame(idx)));
      }
    };

    // Listeners
    window.addEventListener('resize', resizeCanvas);
    window.addEventListener('scroll', updateScrollProgress, { passive: true });

    // Initial setup
    resizeCanvas();
    updateScrollProgress();
    animId = requestAnimationFrame(renderLoop);
    startPreloader();

    return () => {
      isMounted = false;
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resizeCanvas);
      window.removeEventListener('scroll', updateScrollProgress);
    };
  }, []);

  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 w-screen h-screen z-0 pointer-events-none overflow-hidden"
    >
      <canvas
        ref={canvasRef}
        className="w-full h-full block object-cover pointer-events-none"
      />
      {/* Cinematic dark vignette overlay to ensure pristine contrast for text & interactive components */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-black/35 to-black/75 pointer-events-none" />
    </div>
  );
}
