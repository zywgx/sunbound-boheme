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

      {/* Birds gliding in the sky, left of the van */}
      <g stroke="var(--brown)" strokeWidth="2.5" strokeLinecap="round" fill="none" opacity="0.5">
        <path d="M418 150 Q425 142 432 150 Q439 142 446 150" />
        <path d="M452 165 Q457 159 462 165 Q467 159 472 165" />
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

      {/* Vintage VW camper bus, rear view driving off toward the mountains */}
      <g transform="translate(600 316) scale(1.5)">
        {/* Rear tyres peeking below */}
        <rect x="-40" y="-4" width="16" height="12" rx="5" fill="var(--ink)" />
        <rect x="24" y="-4" width="16" height="12" rx="5" fill="var(--ink)" />
        {/* Body (lower two-tone colour) */}
        <path
          d="M-42 -6 L-42 -72 Q-42 -90 -22 -90 L22 -90 Q42 -90 42 -72 L42 -6 Q42 2 34 2 L-34 2 Q-42 2 -42 -6 Z"
          fill="var(--clay)"
        />
        {/* Cream upper (roof) */}
        <path
          d="M-42 -46 L-42 -72 Q-42 -90 -22 -90 L22 -90 Q42 -90 42 -72 L42 -46 Z"
          fill="var(--cream)"
        />
        {/* Roof rack with luggage */}
        <rect x="-30" y="-93" width="60" height="4" rx="2" fill="var(--brown)" opacity="0.8" />
        {/* Suitcase (left) */}
        <rect x="-25" y="-104" width="23" height="14" rx="3" fill="var(--sage)" />
        <rect x="-25" y="-99" width="23" height="2.5" fill="var(--forest)" opacity="0.7" />
        <path d="M-17 -104 Q-13.5 -109 -10 -104" stroke="var(--brown)" strokeWidth="1.5" fill="none" strokeLinecap="round" />
        {/* Suitcase (right) */}
        <rect x="1" y="-108" width="24" height="18" rx="3" fill="var(--clay)" />
        <rect x="1" y="-100" width="24" height="2.5" fill="var(--brown)" opacity="0.55" />
        <path d="M9 -108 Q13 -113 17 -108" stroke="var(--cream)" strokeWidth="1.5" fill="none" strokeLinecap="round" />
        {/* Split rear window */}
        <rect x="-33" y="-84" width="29" height="22" rx="3" fill="var(--brown)" opacity="0.55" />
        <rect x="4" y="-84" width="29" height="22" rx="3" fill="var(--brown)" opacity="0.55" />
        {/* Peace-sign badge */}
        <g stroke="var(--cream)" strokeWidth="1.6" strokeLinecap="round" fill="none">
          <circle cx="0" cy="-40" r="6.5" />
          <line x1="0" y1="-46.5" x2="0" y2="-33.5" />
          <line x1="0" y1="-40" x2="-4.6" y2="-35.4" />
          <line x1="0" y1="-40" x2="4.6" y2="-35.4" />
        </g>
        {/* Engine-lid louvres */}
        <path
          d="M-15 -30 H15 M-15 -25 H15 M-15 -20 H15"
          stroke="var(--brown)"
          strokeWidth="2"
          strokeLinecap="round"
          opacity="0.45"
        />
        {/* Twin tail lights */}
        <rect x="-38" y="-26" width="11" height="9" rx="2.5" fill="var(--brown)" opacity="0.7" />
        <rect x="27" y="-26" width="11" height="9" rx="2.5" fill="var(--brown)" opacity="0.7" />
        {/* Fun license plate */}
        <rect x="-15" y="-17" width="30" height="10" rx="1.5" fill="var(--cream)" stroke="var(--brown)" strokeWidth="0.8" />
        <text
          x="0"
          y="-9.4"
          textAnchor="middle"
          fontSize="7"
          fontWeight="700"
          fontFamily="system-ui, sans-serif"
          letterSpacing="0.5"
          fill="var(--brown)"
        >
          PEACE
        </text>
        {/* Rear bumper */}
        <rect x="-40" y="-6" width="80" height="7" rx="3.5" fill="var(--sand)" />
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
