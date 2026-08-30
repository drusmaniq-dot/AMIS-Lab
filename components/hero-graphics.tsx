export function HeroGraphics() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      {/* Left cluster: nanomaterial lattice + shielding hexagons, fading rightward into the center */}
      <svg
        className="absolute top-1/2 -left-16 h-[140%] w-[46%] -translate-y-1/2 opacity-70 sm:opacity-90"
        viewBox="0 0 500 500"
        fill="none"
        style={{ maskImage: "linear-gradient(to right, black 25%, transparent 85%)", WebkitMaskImage: "linear-gradient(to right, black 25%, transparent 85%)" }}
      >
        {/* molecule / nano lattice */}
        <g stroke="#10A2A4" strokeWidth="1.5" opacity="0.6">
          <path d="M60 120 L120 90 L180 120 L180 180 L120 210 L60 180 Z" />
          <path d="M120 90 L120 30 M180 120 L240 90 M180 180 L240 210 M120 210 L120 270 M60 180 L0 210 M60 120 L0 90" />
        </g>
        <g fill="#10A2A4">
          <circle cx="60" cy="120" r="6" />
          <circle cx="120" cy="90" r="6" />
          <circle cx="180" cy="120" r="6" />
          <circle cx="180" cy="180" r="6" />
          <circle cx="120" cy="210" r="6" />
          <circle cx="60" cy="180" r="6" />
          <circle cx="120" cy="30" r="4" opacity="0.7" />
          <circle cx="240" cy="90" r="4" opacity="0.7" />
          <circle cx="240" cy="210" r="4" opacity="0.7" />
          <circle cx="120" cy="270" r="4" opacity="0.7" />
        </g>

        {/* shielding hexagon weave */}
        <g stroke="#1C66A1" strokeWidth="1.5" opacity="0.55">
          {[0, 1, 2, 3].map((row) =>
            [0, 1, 2].map((col) => {
              const x = 130 + col * 70 + (row % 2 === 0 ? 0 : 35);
              const y = 260 + row * 60;
              return (
                <polygon
                  key={`${row}-${col}`}
                  points={hexPoints(x, y, 32)}
                  fill="#1C66A1"
                  fillOpacity="0.08"
                />
              );
            })
          )}
        </g>
      </svg>

      {/* Right cluster: optic burst + sustainability leaf, fading leftward into the center */}
      <svg
        className="absolute top-1/2 -right-16 h-[140%] w-[46%] -translate-y-1/2 opacity-70 sm:opacity-90"
        viewBox="0 0 500 500"
        fill="none"
        style={{ maskImage: "linear-gradient(to left, black 25%, transparent 85%)", WebkitMaskImage: "linear-gradient(to left, black 25%, transparent 85%)" }}
      >
        {/* optic ray burst */}
        <g stroke="#C82C39" strokeWidth="2" opacity="0.55" strokeLinecap="round">
          {Array.from({ length: 10 }).map((_, i) => {
            const angle = (i / 10) * Math.PI * 2;
            const cx = 370;
            const cy = 130;
            const r1 = 18;
            const r2 = i % 2 === 0 ? 70 : 45;
            return (
              <line
                key={i}
                x1={cx + Math.cos(angle) * r1}
                y1={cy + Math.sin(angle) * r1}
                x2={cx + Math.cos(angle) * r2}
                y2={cy + Math.sin(angle) * r2}
              />
            );
          })}
          <circle cx="370" cy="130" r="10" fill="#C82C39" fillOpacity="0.5" />
        </g>

        {/* concentric optic rings */}
        <g stroke="#10A2A4" strokeWidth="1.5" opacity="0.4">
          <circle cx="300" cy="300" r="60" />
          <circle cx="300" cy="300" r="90" />
          <circle cx="300" cy="300" r="120" />
        </g>

        {/* sustainability leaf / growth */}
        <g stroke="#6EAA02" strokeWidth="2" opacity="0.6" strokeLinecap="round">
          <path d="M330 430 C330 350 380 300 440 280 C420 340 400 400 330 430 Z" fill="#6EAA02" fillOpacity="0.12" />
          <path d="M330 430 C335 390 355 350 420 305" />
          <path d="M280 460 L330 430" />
        </g>
      </svg>
    </div>
  );
}

function hexPoints(cx: number, cy: number, r: number): string {
  return Array.from({ length: 6 })
    .map((_, i) => {
      const angle = (Math.PI / 3) * i - Math.PI / 6;
      return `${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`;
    })
    .join(" ");
}
