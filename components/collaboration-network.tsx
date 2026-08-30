export interface CollaborationNode {
  id: string;
  name: string;
  title: string;
  photoUrl: string | null;
  tier: number;
}

export interface CollaborationEdge {
  fromId: string;
  toId: string;
  count: number;
}

export interface CollaborationNetworkDict {
  director: string;
  researchTeam: string;
  students: string;
  papersLabel: string;
  noSharedPapers: string;
}

const VIEW_W = 1000;
const VIEW_H = 920;
const NODE_R = 52;

// Hand-placed layout: director top-center, research team spread across the
// middle row, student offset off-center at the bottom so no straight edge
// between two other nodes happens to pass through it. Tiers are spaced ~220px
// apart — enough room for the node diameter (104) plus per-node jitter (±20
// each side) plus label text below each node — so adjacent tiers never overlap.
const TIER_POSITIONS: Record<number, { y: number; xs: number[] }> = {
  0: { y: 110, xs: [150, 500, 850] },
  0.5: { y: 330, xs: [720] },
  1: { y: 550, xs: [220, 420] },
  2: { y: 770, xs: [200, 500, 800] },
};

function layout(nodes: CollaborationNode[]): Map<string, { x: number; y: number }> {
  const byTier = new Map<number, CollaborationNode[]>();
  for (const n of nodes) {
    if (!byTier.has(n.tier)) byTier.set(n.tier, []);
    byTier.get(n.tier)!.push(n);
  }
  const positions = new Map<string, { x: number; y: number }>();
  for (const [tier, tierNodes] of byTier) {
    const { y, xs } = TIER_POSITIONS[tier];
    tierNodes.forEach((n, i) => {
      // Deterministic per-node vertical jitter so nodes that share an x
      // position across tiers don't line up into a perfectly straight column.
      const jitter = (hashPair(n.id) % 41) - 20;
      positions.set(n.id, { x: xs[i] ?? xs[xs.length - 1], y: y + jitter });
    });
  }
  return positions;
}

// Distinct hue per edge (from the brand palette) plus a varied curve depth,
// both derived from a stable hash of the edge's node pair — keeps crossing
// lines visually distinguishable instead of blurring into one dark mass.
const EDGE_COLORS = ["#001041", "#10a2a4", "#c82c39", "#1c66a1", "#6eaa02"];

function hashPair(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return h;
}

export function CollaborationNetwork({
  nodes,
  edges,
  dict,
}: {
  nodes: CollaborationNode[];
  edges: CollaborationEdge[];
  dict: CollaborationNetworkDict;
}) {
  const pos = layout(nodes);
  const byId = new Map(nodes.map((n) => [n.id, n]));

  return (
    <div className="w-full overflow-x-auto">
      <svg
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        className="mx-auto w-full max-w-4xl"
        role="img"
        aria-label={dict.director + ", " + dict.researchTeam + ", " + dict.students}
      >
        {/* Edges — only real connections are drawn (zero-count pairs add pure
            clutter with no information). Every edge bows out perpendicular to
            its own line direction, by a hash-varied depth alternating sides —
            not just same-row edges — so no line or its value-label ever sits
            hidden directly under a node or another edge's label. */}
        {edges
          .filter((e) => e.count > 0)
          .map((e) => {
            const a = pos.get(e.fromId);
            const b = pos.get(e.toId);
            if (!a || !b) return null;
            const key = `${e.fromId}-${e.toId}`;
            const h = hashPair(key);
            const color = EDGE_COLORS[h % EDGE_COLORS.length];

            const dx = b.x - a.x;
            const dy = b.y - a.y;
            const len = Math.sqrt(dx * dx + dy * dy) || 1;
            const nx = -dy / len;
            const ny = dx / len;
            const depth = 35 + (h % 4) * 22;
            const sign = h % 2 === 0 ? 1 : -1;
            const mx = (a.x + b.x) / 2;
            const my = (a.y + b.y) / 2;
            const cx = mx + nx * depth * sign;
            const cyy = my + ny * depth * sign;
            const path = `M ${a.x} ${a.y} Q ${cx} ${cyy}, ${b.x} ${b.y}`;
            // True midpoint of the quadratic bezier (t=0.5), so the label sits on the curve itself.
            const labelX = 0.25 * a.x + 0.5 * cx + 0.25 * b.x;
            const labelY = 0.25 * a.y + 0.5 * cyy + 0.25 * b.y;

            return (
              <g key={key}>
                <path
                  d={path}
                  fill="none"
                  stroke={color}
                  strokeOpacity={0.8}
                  strokeWidth={2 + Math.min(e.count, 30) / 6}
                />
                <g transform={`translate(${labelX}, ${labelY})`}>
                  <circle r={16} fill={color} />
                  <text textAnchor="middle" dominantBaseline="central" className="fill-white text-[15px] font-bold">
                    {e.count}
                  </text>
                </g>
              </g>
            );
          })}

        {/* Nodes */}
        {nodes.map((n) => {
          const p = pos.get(n.id);
          if (!p) return null;
          return (
            <g key={n.id}>
              <clipPath id={`clip-${n.id}`}>
                <circle cx={p.x} cy={p.y} r={NODE_R} />
              </clipPath>
              <circle cx={p.x} cy={p.y} r={NODE_R + 4} className="fill-background" stroke="var(--primary)" strokeWidth={2} />
              {n.photoUrl ? (
                <image
                  href={n.photoUrl}
                  x={p.x - NODE_R}
                  y={p.y - NODE_R}
                  width={NODE_R * 2}
                  height={NODE_R * 2}
                  clipPath={`url(#clip-${n.id})`}
                  preserveAspectRatio="xMidYMid slice"
                />
              ) : (
                <circle cx={p.x} cy={p.y} r={NODE_R} className="fill-muted" />
              )}
              <text x={p.x} y={p.y + NODE_R + 24} textAnchor="middle" className="fill-foreground text-[14px] font-semibold">
                {n.name}
              </text>
              <text x={p.x} y={p.y + NODE_R + 42} textAnchor="middle" className="fill-muted-foreground text-[11px]">
                {n.title}
              </text>
            </g>
          );
        })}
      </svg>

      <p className="mt-2 text-center text-xs text-muted-foreground">{dict.papersLabel}</p>
    </div>
  );
}
