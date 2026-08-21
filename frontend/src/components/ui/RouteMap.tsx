import { motion } from 'framer-motion';

/**
 * DriveHub's signature visual: a dashed route line connecting a
 * pickup pin to a drop pin across a stylised city grid, animated to
 * "draw" itself on load. Used on the dark panel of the auth screens.
 */
export function RouteMap() {
  return (
    <svg viewBox="0 0 480 640" fill="none" className="h-full w-full" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      {/* faint city grid */}
      <g stroke="var(--color-ink-line)" strokeWidth="1" opacity="0.5">
        {Array.from({ length: 9 }).map((_, i) => (
          <line key={`v${i}`} x1={i * 60} y1="0" x2={i * 60} y2="640" />
        ))}
        {Array.from({ length: 12 }).map((_, i) => (
          <line key={`h${i}`} x1="0" y1={i * 58} x2="480" y2={i * 58} />
        ))}
      </g>

      {/* a few stylised building blocks for depth */}
      <g opacity="0.35" fill="var(--color-ink-soft)" stroke="var(--color-ink-line)">
        <rect x="60" y="120" width="70" height="90" rx="4" />
        <rect x="330" y="380" width="90" height="110" rx="4" />
        <rect x="150" y="440" width="60" height="70" rx="4" />
      </g>

      {/* the route */}
      <motion.path
        d="M 96 150 C 160 220, 120 320, 220 360 S 340 420, 372 470"
        stroke="var(--color-route)"
        strokeWidth="3"
        className="route-dash"
        strokeLinecap="round"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: 1.8, ease: 'easeInOut' }}
      />

      {/* pickup pin */}
      <g transform="translate(96, 150)">
        <circle r="7" fill="var(--color-signal)" />
        <circle r="14" fill="var(--color-signal)" opacity="0.2" />
      </g>

      {/* drop pin */}
      <g transform="translate(372, 470)">
        <circle r="7" fill="var(--color-route)" />
        <motion.circle
          r="14"
          fill="var(--color-route)"
          opacity="0.25"
          animate={{ r: [14, 22, 14], opacity: [0.25, 0, 0.25] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
        />
      </g>
    </svg>
  );
}
