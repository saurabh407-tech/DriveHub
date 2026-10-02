(() => {
  const TOTAL_FRAMES = 300;
  const canvas = document.getElementById('scroll-canvas');
  const ctx = canvas.getContext('2d', { alpha: false });

  // Frame URL generator: frames/frame_0001.jpg to frames/frame_0300.jpg
  const getFrameUrl = (index) => {
    const padIndex = String(index).padStart(4, '0');
    return `frames/frame_${padIndex}.jpg`;
  };

  // Preloaded image storage
  const images = new Array(TOTAL_FRAMES + 1);
  const loadedStatus = new Array(TOTAL_FRAMES + 1).fill(false);

  let currentFrame = 1;
  let targetFrame = 1;
  let lastDrawnFrame = -1;
  let isInitialFrameDrawn = false;

  // Resize canvas according to display resolution and DPI
  function resizeCanvas() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const displayWidth = window.innerWidth;
    const displayHeight = window.innerHeight;

    const targetW = Math.round(displayWidth * dpr);
    const targetH = Math.round(displayHeight * dpr);

    if (canvas.width !== targetW || canvas.height !== targetH) {
      canvas.width = targetW;
      canvas.height = targetH;
    }

    lastDrawnFrame = -1;
    drawFrame(Math.round(currentFrame));
  }

  // Draw image on canvas using "cover" aspect-ratio scaling
  function drawImageCover(img) {
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
  }

  // Find the closest loaded frame to prevent blank flashes
  function getClosestLoadedFrame(frameIdx) {
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
  }

  function drawFrame(frameIdx) {
    const clampedIdx = Math.max(1, Math.min(TOTAL_FRAMES, frameIdx));
    const img = getClosestLoadedFrame(clampedIdx);

    if (img) {
      drawImageCover(img);
    }
  }

  // Compute target frame based on current scroll position
  function updateScrollProgress() {
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
  }

  // Animation render loop with smooth lerp interpolation
  function renderLoop() {
    // Continuously sync scroll progress so no scroll ticks are missed
    updateScrollProgress();

    // Smooth damping (lerp)
    currentFrame += (targetFrame - currentFrame) * 0.2;

    const roundedFrame = Math.round(currentFrame);
    if (roundedFrame !== lastDrawnFrame) {
      drawFrame(roundedFrame);
      lastDrawnFrame = roundedFrame;
    }

    requestAnimationFrame(renderLoop);
  }

  // Load a single frame
  function loadFrame(index) {
    return new Promise((resolve) => {
      if (images[index]) {
        resolve(images[index]);
        return;
      }

      const img = new Image();
      img.src = getFrameUrl(index);
      images[index] = img;

      img.onload = () => {
        loadedStatus[index] = true;
        if (!isInitialFrameDrawn && index === 1) {
          isInitialFrameDrawn = true;
          drawFrame(1);
        }
        resolve(img);
      };

      img.onerror = () => {
        resolve(null);
      };
    });
  }

  // Progressive frame loader with concurrency control
  async function loadAllFrames() {
    // 1. Immediately load & render frame 1
    await loadFrame(1);
    drawFrame(1);

    // 2. Load keyframes across timeline for fast scrub preview
    const keyframes = [];
    for (let i = 5; i <= TOTAL_FRAMES; i += 5) {
      keyframes.push(i);
    }

    const CONCURRENCY = 8;
    for (let i = 0; i < keyframes.length; i += CONCURRENCY) {
      const batch = keyframes.slice(i, i + CONCURRENCY);
      await Promise.all(batch.map((idx) => loadFrame(idx)));
    }

    // 3. Load all remaining frames
    const remaining = [];
    for (let i = 1; i <= TOTAL_FRAMES; i++) {
      if (!loadedStatus[i]) {
        remaining.push(i);
      }
    }

    for (let i = 0; i < remaining.length; i += CONCURRENCY) {
      const batch = remaining.slice(i, i + CONCURRENCY);
      await Promise.all(batch.map((idx) => loadFrame(idx)));
    }
  }

  // Event listeners
  window.addEventListener('resize', resizeCanvas);
  window.addEventListener('scroll', updateScrollProgress, { passive: true });

  // Fallback: If wheel event is triggered over window, ensure page scrolls
  window.addEventListener('wheel', (e) => {
    updateScrollProgress();
  }, { passive: true });

  // Initialize
  resizeCanvas();
  updateScrollProgress();
  requestAnimationFrame(renderLoop);
  loadAllFrames();
})();
