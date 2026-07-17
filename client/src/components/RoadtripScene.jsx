function RoadtripScene({ className = '' }) {
  return (
    <svg
      className={`roadtrip-scene ${className}`.trim()}
      viewBox="0 0 1200 360"
      preserveAspectRatio="xMidYMid meet"
      role="presentation"
      aria-hidden="true"
      focusable="false"
    >
      {/* Sun (matches the site's sunburst motif) */}
      <g transform="translate(980 82)" fill="var(--orange)" opacity="0.9">
        {Array.from({ length: 12 }, (_, i) => (
          <path
            key={i}
            d="M-5 -28 L0 -46 L5 -28 Z"
            transform={`rotate(${(360 / 12) * i})`}
          />
        ))}
        <circle cx="0" cy="0" r="24" />
      </g>

      {/* Distant mountains, sitting on the horizon at y=230 */}
      <path d="M120 230 L250 120 L380 230 Z" fill="var(--brown)" opacity="0.22" />
      <path d="M330 230 L470 100 L610 230 Z" fill="var(--clay)" opacity="0.3" />
      <path d="M560 230 L690 130 L820 230 Z" fill="var(--brown)" opacity="0.2" />

      {/* Rolling hills */}
      <path
        d="M0 230 Q300 200 600 226 T1200 224 L1200 360 L0 360 Z"
        fill="var(--sage)"
        opacity="0.6"
      />
      <path
        d="M0 280 Q350 250 700 276 T1200 274 L1200 360 L0 360 Z"
        fill="var(--forest)"
        opacity="0.5"
      />

      {/* Winding road from the horizon down to the viewer */}
      <path
        d="M582 226 C596 268, 470 300, 430 360 L770 360 C700 300, 620 268, 618 226 Z"
        fill="var(--brown)"
        opacity="0.92"
      />
      <path
        d="M600 240 L599 262 M596 284 L590 308 M583 326 L574 352"
        stroke="var(--beige)"
        strokeWidth="5"
        strokeLinecap="round"
        opacity="0.85"
      />

      {/* Camper van, wheels resting on the front hill line */}
      <g transform="translate(150 250)">
        <rect x="0" y="0" width="120" height="42" rx="9" fill="var(--clay)" />
        <rect x="92" y="-14" width="40" height="56" rx="9" fill="var(--clay)" />
        <rect x="100" y="-6" width="26" height="20" rx="4" fill="var(--cream)" opacity="0.9" />
        <rect x="0" y="16" width="132" height="9" fill="var(--cream)" opacity="0.8" />
        <circle cx="30" cy="48" r="13" fill="var(--ink)" />
        <circle cx="30" cy="48" r="5" fill="var(--sand)" />
        <circle cx="104" cy="48" r="13" fill="var(--ink)" />
        <circle cx="104" cy="48" r="5" fill="var(--sand)" />
      </g>

      {/* Saguaro cactus, base on the hill line */}
      <g
        transform="translate(1000 236)"
        fill="none"
        stroke="var(--forest)"
        strokeWidth="15"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M0 0 V-70" />
        <path d="M0 -30 H-18 V-48" />
        <path d="M0 -42 H18 V-62" />
      </g>
    </svg>
  )
}

export default RoadtripScene
