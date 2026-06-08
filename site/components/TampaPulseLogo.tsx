// Tampa Pulse brand mark — palm tree (Tampa) + heartbeat line (Pulse) on a
// glowing orange badge. Pure SVG so it always renders, no image file needed.
export default function TampaPulseLogo({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} role="img" aria-label="Tampa Pulse">
      <defs>
        <linearGradient id="tp-badge" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FF8A4C" />
          <stop offset="55%" stopColor="#FF5A36" />
          <stop offset="100%" stopColor="#E0461F" />
        </linearGradient>
        <radialGradient id="tp-shine" cx="38%" cy="28%" r="65%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.35" />
          <stop offset="60%" stopColor="#ffffff" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* badge */}
      <circle cx="32" cy="32" r="31" fill="url(#tp-badge)" />
      <circle cx="32" cy="32" r="31" fill="url(#tp-shine)" />
      <circle cx="32" cy="32" r="30.2" fill="none" stroke="#FFD79A" strokeOpacity="0.6" strokeWidth="1.6" />

      {/* palm + pulse */}
      <g fill="none" stroke="#ffffff" strokeLinecap="round" strokeLinejoin="round">
        {/* trunk */}
        <path d="M32 45 C31 39 32.4 33 33 29" strokeWidth="3.2" />
        {/* fronds */}
        <g strokeWidth="2.5">
          <path d="M33 29 Q22.5 22 15 26.5" />
          <path d="M33 29 Q43.5 22 51 26.5" />
          <path d="M33 29 Q25 17.5 20 14.5" />
          <path d="M33 29 Q41 17.5 46 14.5" />
          <path d="M33 29 Q33 17 33 11.5" />
        </g>
        {/* heartbeat ground line */}
        <path d="M10 47 H24 l2.6 -7.5 l4.6 13.5 l3 -9 H54" strokeWidth="2.4" />
      </g>

      {/* coconuts */}
      <g fill="#ffffff">
        <circle cx="29.2" cy="29.4" r="1.4" />
        <circle cx="36.8" cy="29.4" r="1.4" />
      </g>
    </svg>
  );
}
