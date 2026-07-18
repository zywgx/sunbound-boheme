function StraightRays({ rays }) {
  return Array.from({ length: rays }, (_, index) => {
    const angle = (360 / rays) * index
    return (
      <line
        key={index}
        x1="50"
        y1="6"
        x2="50"
        y2="20"
        transform={`rotate(${angle} 50 50)`}
      />
    )
  })
}

function WavyRays({ rays }) {
  return Array.from({ length: rays }, (_, index) => {
    const angle = (360 / rays) * index
    // A short S-curve ray drawn from the sun's edge outward.
    return (
      <path
        key={index}
        d="M50 22 C46 17, 54 12, 50 6"
        transform={`rotate(${angle} 50 50)`}
      />
    )
  })
}

function BurstRays({ rays }) {
  return Array.from({ length: rays }, (_, index) => {
    const angle = (360 / rays) * index
    // A solid triangular spike pointing outward from the sun's edge.
    return (
      <path
        key={index}
        d="M46 22 L50 4 L54 22 Z"
        transform={`rotate(${angle} 50 50)`}
      />
    )
  })
}

function SunGraphic({ className = '', rays = 12, variant = 'burst', ...props }) {
  if (variant === 'burst') {
    return (
      <svg
        className={`sun-graphic ${className}`.trim()}
        viewBox="0 0 100 100"
        role="presentation"
        aria-hidden="true"
        focusable="false"
        {...props}
      >
        <g fill="currentColor" stroke="none">
          <BurstRays rays={rays} />
          <circle cx="50" cy="50" r="20" />
        </g>
      </svg>
    )
  }

  const Rays = variant === 'straight' ? StraightRays : WavyRays

  return (
    <svg
      className={`sun-graphic ${className}`.trim()}
      viewBox="0 0 100 100"
      role="presentation"
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      <g
        stroke="currentColor"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      >
        <Rays rays={rays} />
      </g>
      <circle cx="50" cy="50" r="18" fill="currentColor" />
    </svg>
  )
}

export default SunGraphic
