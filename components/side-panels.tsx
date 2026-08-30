function hexPoints(cx: number, cy: number, r: number): string {
  return Array.from({ length: 6 })
    .map((_, i) => {
      const angle = (Math.PI / 3) * i - Math.PI / 6;
      return `${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`;
    })
    .join(" ");
}

// Sitewide decorative rails: fixed to the viewport edges, full height, visible only in the
// empty gutters on wide screens (2xl+). Left and right each carry a different mix of motifs
// pulled from the emblem (nano lattice, shield weave, optic burst/rings, leaf, cell grid), all
// fading toward the center so the readable content column is never touched.
export function SidePanels() {
  return (
    <>
      <div
        className="pointer-events-none fixed inset-y-0 left-0 z-0 hidden w-64 2xl:block"
        aria-hidden="true"
      >
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(180deg, color-mix(in oklch, var(--brand-teal) 14%, transparent) 0%, transparent 18%, color-mix(in oklch, var(--brand-blue) 12%, transparent) 40%, transparent 58%, color-mix(in oklch, var(--brand-green) 12%, transparent) 78%, transparent 100%)",
            maskImage: "linear-gradient(to right, black 0%, transparent 75%)",
            WebkitMaskImage: "linear-gradient(to right, black 0%, transparent 75%)",
          }}
        />
        <svg
          className="absolute inset-0 h-full w-full"
          viewBox="0 0 300 1400"
          preserveAspectRatio="none"
          fill="none"
          style={{
            maskImage: "linear-gradient(to right, black 0%, transparent 70%)",
            WebkitMaskImage: "linear-gradient(to right, black 0%, transparent 70%)",
          }}
        >
          {/* nano / molecule lattice */}
          <g stroke="#10A2A4" strokeWidth="1.5" opacity="0.55">
            <path d="M20 90 L80 60 L140 90 L140 150 L80 180 L20 150 Z" />
            <path d="M80 60 L80 0 M140 90 L200 60 M140 150 L200 180 M80 180 L80 240 M20 150 L-40 180 M20 90 L-40 60" />
          </g>
          <g fill="#10A2A4">
            <circle cx="20" cy="90" r="6" />
            <circle cx="80" cy="60" r="6" />
            <circle cx="140" cy="90" r="6" />
            <circle cx="140" cy="150" r="6" />
            <circle cx="80" cy="180" r="6" />
            <circle cx="20" cy="150" r="6" />
          </g>

          {/* shielding hexagon weave */}
          <g stroke="#1C66A1" strokeWidth="1.3" opacity="0.45">
            {[0, 1, 2].map((row) =>
              [0, 1].map((col) => {
                const x = 20 + col * 60 + (row % 2 === 0 ? 0 : 30);
                const y = 480 + row * 55;
                return <polygon key={`${row}-${col}`} points={hexPoints(x, y, 30)} fill="#1C66A1" fillOpacity="0.07" />;
              })
            )}
          </g>

          {/* optic rings, smaller echo */}
          <g stroke="#C82C39" strokeWidth="1.3" opacity="0.4">
            <circle cx="60" cy="820" r="40" />
            <circle cx="60" cy="820" r="65" />
          </g>

          {/* cellular / bioglass grid */}
          <g stroke="#6EAA02" strokeWidth="1.2" opacity="0.4">
            {[0, 1, 2].map((row) =>
              [0, 1].map((col) => {
                const x = 30 + col * 55 + (row % 2 === 0 ? 0 : 27);
                const y = 1080 + row * 48;
                return <polygon key={`${row}-${col}`} points={hexPoints(x, y, 26)} fill="#6EAA02" fillOpacity="0.06" />;
              })
            )}
          </g>

          {/* trailing leaf near the bottom */}
          <g stroke="#10A2A4" strokeWidth="1.5" opacity="0.45" strokeLinecap="round">
            <path d="M10 1360 C10 1300 45 1260 90 1245 C75 1290 60 1335 10 1360 Z" fill="#10A2A4" fillOpacity="0.08" />
          </g>
        </svg>
      </div>

      <div
        className="pointer-events-none fixed inset-y-0 right-0 z-0 hidden w-64 2xl:block"
        aria-hidden="true"
      >
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(180deg, color-mix(in oklch, var(--brand-red) 12%, transparent) 0%, transparent 20%, color-mix(in oklch, var(--brand-navy) 12%, transparent) 42%, transparent 60%, color-mix(in oklch, var(--brand-teal) 14%, transparent) 80%, transparent 100%)",
            maskImage: "linear-gradient(to left, black 0%, transparent 75%)",
            WebkitMaskImage: "linear-gradient(to left, black 0%, transparent 75%)",
          }}
        />
        <svg
          className="absolute inset-0 h-full w-full"
          viewBox="0 0 300 1400"
          preserveAspectRatio="none"
          fill="none"
          style={{
            maskImage: "linear-gradient(to left, black 0%, transparent 70%)",
            WebkitMaskImage: "linear-gradient(to left, black 0%, transparent 70%)",
          }}
        >
          {/* optic ray burst near the top */}
          <g stroke="#C82C39" strokeWidth="2" opacity="0.5" strokeLinecap="round">
            {Array.from({ length: 10 }).map((_, i) => {
              const angle = (i / 10) * Math.PI * 2;
              const cx = 190;
              const cy = 110;
              const r1 = 16;
              const r2 = i % 2 === 0 ? 60 : 38;
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
            <circle cx="190" cy="110" r="9" fill="#C82C39" fillOpacity="0.45" />
          </g>

          {/* concentric optic rings */}
          <g stroke="#10A2A4" strokeWidth="1.4" opacity="0.4">
            <circle cx="150" cy="420" r="45" />
            <circle cx="150" cy="420" r="72" />
            <circle cx="150" cy="420" r="99" />
          </g>

          {/* molecule chain, mirrored variant */}
          <g stroke="#1C66A1" strokeWidth="1.5" opacity="0.5">
            <path d="M160 720 L220 690 L280 720 L280 780 L220 810 L160 780 Z" />
            <path d="M220 690 L220 630 M280 780 L340 810" />
          </g>
          <g fill="#1C66A1">
            <circle cx="160" cy="720" r="5" />
            <circle cx="220" cy="690" r="5" />
            <circle cx="280" cy="720" r="5" />
            <circle cx="280" cy="780" r="5" />
            <circle cx="220" cy="810" r="5" />
            <circle cx="160" cy="780" r="5" />
          </g>

          {/* sustainability leaf */}
          <g stroke="#6EAA02" strokeWidth="2" opacity="0.5" strokeLinecap="round">
            <path d="M200 1050 C200 990 245 950 300 935 C280 985 260 1035 200 1050 Z" fill="#6EAA02" fillOpacity="0.1" />
          </g>

          {/* cellular / bioglass grid near the bottom */}
          <g stroke="#10A2A4" strokeWidth="1.2" opacity="0.4">
            {[0, 1, 2].map((row) =>
              [0, 1].map((col) => {
                const x = 150 + col * 55 + (row % 2 === 0 ? 0 : 27);
                const y = 1180 + row * 48;
                return <polygon key={`${row}-${col}`} points={hexPoints(x, y, 26)} fill="#10A2A4" fillOpacity="0.06" />;
              })
            )}
          </g>
        </svg>
      </div>
    </>
  );
}
