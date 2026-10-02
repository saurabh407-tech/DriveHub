import { useEffect, useRef } from 'react';

const TOTAL_FRAMES = 300;

export function Scroll3DAnimation() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    let isMounted = true;
    let animId: number;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    // Build URL for public frames: /frames/frame_0001.jpg -> /frames/frame_0300.jpg
    const getFrameUrl = (index: number) => {
      const pad = String(index).padStart(4, '0');
      return `/frames/frame_${pad}.jpg`;
    };

    const images: HTMLImageElement[] = new Array(TOTAL_FRAMES + 1);
    const loadedStatus: boolean[] = new Array(TOTAL_FRAMES + 1).fill(false);

    let currentFrame = 1;
    let targetFrame = 1;
    let lastDrawnFrame = -1;
    let isFirstFrameDrawn = false;

    // Responsive Canvas Resizing with Retina/HiDPI support
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

    // Draw image maintaining full bleed cover aspect ratio
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

    // Retrieve closest loaded frame to eliminate any flicker
    const getClosestLoadedFrame = (frameIdx: number) => {
      if (loadedStatus[frameIdx] && images[frameIdx]) {
        return images[frameIdx];
      }

      for (let offset = 1; offset < TOTAL_FRAMES; offset++) {
        const prev = frameIdx - offset;
        if (prev >= 1 && loadedStatus[prev] && images[prev]) {
          return images[prev];
        }
        const next = frameIdx + offset;
        if (next <= TOTAL_FRAMES && loadedStatus[next] && images[next]) {
          return images[next];
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

    // Calculate frame position based on this specific container's scroll position
    const updateScrollProgress = () => {
      const container = containerRef.current;
      if (!container) return;

      const rect = container.getBoundingClientRect();
      const totalDistance = rect.height - window.innerHeight;

      if (totalDistance <= 0) {
        targetFrame = 1;
        return;
      }

      // Progress is 0 when container top reaches viewport top, and 1 when container bottom reaches viewport bottom
      const scrolled = -rect.top;
      const progress = Math.max(0, Math.min(1, scrolled / totalDistance));
      targetFrame = 1 + progress * (TOTAL_FRAMES - 1);
    };

    // Render loop with smooth easing
    const renderLoop = () => {
      if (!isMounted) return;

      updateScrollProgress();

      // Smooth interpolation damping
      currentFrame += (targetFrame - currentFrame) * 0.18;

      const rounded = Math.round(currentFrame);
      if (rounded !== lastDrawnFrame) {
        drawFrame(rounded);
        lastDrawnFrame = rounded;
      }

      animId = requestAnimationFrame(renderLoop);
    };

    // Load individual frame
    const loadFrame = (index: number): Promise<HTMLImageElement | null> => {
      return new Promise((resolve) => {
        if (!isMounted) {
          resolve(null);
          return;
        }

        if (images[index]) {
          resolve(images[index]);
          return;
        }

        const img = new Image();
        img.src = getFrameUrl(index);
        images[index] = img;

        img.onload = () => {
          if (!isMounted) {
            resolve(null);
            return;
          }
          loadedStatus[index] = true;
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

    // Concurrent progressive frame preloader
    const loadAllFrames = async () => {
      // 1. Immediately fetch and render initial frame
      await loadFrame(1);
      if (!isMounted) return;
      drawFrame(1);

      // 2. Preload keyframes spaced throughout the sequence for instant scrubbing preview
      const keyframes: number[] = [];
      for (let i = 5; i <= TOTAL_FRAMES; i += 5) {
        keyframes.push(i);
      }

      const CONCURRENCY = 8;
      for (let i = 0; i < keyframes.length; i += CONCURRENCY) {
        if (!isMounted) return;
        const batch = keyframes.slice(i, i + CONCURRENCY);
        await Promise.all(batch.map((idx) => loadFrame(idx)));
      }

      // 3. Load all remaining frames
      const remaining: number[] = [];
      for (let i = 1; i <= TOTAL_FRAMES; i++) {
        if (!loadedStatus[i]) {
          remaining.push(i);
        }
      }

      for (let i = 0; i < remaining.length; i += CONCURRENCY) {
        if (!isMounted) return;
        const batch = remaining.slice(i, i + CONCURRENCY);
        await Promise.all(batch.map((idx) => loadFrame(idx)));
      }
    };

    // Event listeners
    window.addEventListener('resize', resizeCanvas);
    window.addEventListener('scroll', updateScrollProgress, { passive: true });

    // Initialize
    resizeCanvas();
    updateScrollProgress();
    animId = requestAnimationFrame(renderLoop);
    loadAllFrames();

    // Clean up completely on unmount (when leaving LandingPage)
    return () => {
      isMounted = false;
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resizeCanvas);
      window.removeEventListener('scroll', updateScrollProgress);
    };
  }, []);

  return (
    <section
      ref={containerRef}
      aria-label="3D Scroll Drive Experience"
      className="relative w-full h-[320vh] bg-black pointer-events-none"
    >
      <div className="sticky top-0 left-0 w-full h-screen overflow-hidden flex items-center justify-center pointer-events-none">
        <canvas
          ref={canvasRef}
          className="w-full h-full block pointer-events-none"
        />
      </div>
    </section>
  );
}
