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
const VIEW_H = 1500;
const NODE_R = 52;

// Hand-placed layout: director top-center, research team spread across the
// middle row, student offset off-center at the bottom so no straight edge
// between two other nodes happens to pass through it. Khalid sits well below
// Yousef's row (300px) so the dense Yousef/MS Alqahtani/Fawaz/Khalid bundle of
// connections has room to breathe instead of bunching immediately underneath.
const TIER_POSITIONS: Record<number, { y: number; xs: number[] }> = {
  0.1: { y: 90, xs: [380, 620] }, // Manuela Reben & Essam Ramadan Shaaban — Yousef's top external collaborators, directly above him
  0: { y: 280, xs: [150, 500, 850] },
  0.5: { y: 620, xs: [500] }, // Khalid — directly under Yousef, pushed well down for clearer connections
  0.55: { y: 620, xs: [900] }, // Reem Dhafer Alshehri — pushed out to the far right, level with Hany
  0.6: { y: 620, xs: [220] }, // Dahshan — raised to Khalid's level
  0.9: { y: 900, xs: [60] }, // Kamal A. Aly — Dahshan's top collaborator, left of Dahshan
  1: { y: 900, xs: [650] }, // Hany — pulled back in toward the center
  1.1: { y: 1050, xs: [600] }, // Ehab Mahmoud Mohamed — Hany's collaborator, below him
  1.3: { y: 1050, xs: [120] }, // Neeraj Mehta — Dahshan's #2, below-left of Dahshan
  1.7: { y: 1050, xs: [780] }, // Mohamed A. Ismeil — Hany's collaborator, below-right of him
  1.9: { y: 1340, xs: [900] }, // Elham Fahad Alkhammash — directly under Reem
  2: { y: 1340, xs: [350] }, // Remaining student (Asiri)
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

type Pt = { x: number; y: number };

function quadPoint(a: Pt, c: Pt, b: Pt, t: number): Pt {
  const u = 1 - t;
  return {
    x: u * u * a.x + 2 * u * t * c.x + t * t * b.x,
    y: u * u * a.y + 2 * u * t * c.y + t * t * b.y,
  };
}

function sampleCurve(a: Pt, c: Pt, b: Pt, n = 16): Pt[] {
  const pts: Pt[] = [];
  for (let i = 0; i <= n; i++) pts.push(quadPoint(a, c, b, i / n));
  return pts;
}

// Standard segment-segment intersection test (cross-product orientation method).
function segmentsCross(p1: Pt, p2: Pt, p3: Pt, p4: Pt): boolean {
  const d = (ax: Pt, bx: Pt, cx: Pt) => (bx.x - ax.x) * (cx.y - ax.y) - (bx.y - ax.y) * (cx.x - ax.x);
  const d1 = d(p3, p4, p1);
  const d2 = d(p3, p4, p2);
  const d3 = d(p1, p2, p3);
  const d4 = d(p1, p2, p4);
  return ((d1 > 0 && d2 < 0) || (d1 < 0 && d2 > 0)) && ((d3 > 0 && d4 < 0) || (d3 < 0 && d4 > 0));
}

function polylineCrossings(a: Pt[], b: Pt[]): number {
  let count = 0;
  for (let i = 0; i < a.length - 1; i++) {
    for (let j = 0; j < b.length - 1; j++) {
      if (segmentsCross(a[i], a[i + 1], b[j], b[j + 1])) count++;
    }
  }
  return count;
}

interface RoutedEdge {
  key: string;
  count: number;
  color: string;
  path: string;
  labelX: number;
  labelY: number;
  lineOpacity: number;
  labelOpacity: number;
}

// Greedy edge routing: process the strongest (most-cited) connections first so
// they get the straightest, cleanest paths, then route each remaining edge by
// trying several bow directions/depths and picking whichever crosses the fewest
// already-placed edges — a practical crossing-minimization heuristic rather
// than pure per-edge randomization.
function routeEdges(edges: CollaborationEdge[], nodes: CollaborationNode[], pos: Map<string, Pt>): RoutedEdge[] {
  const real = edges.filter((e) => e.count > 0).sort((a, b) => b.count - a.count);
  const placed: Pt[][] = [];
  const routed: RoutedEdge[] = [];

  for (const e of real) {
    const a = pos.get(e.fromId);
    const b = pos.get(e.toId);
    if (!a || !b) continue;
    const key = `${e.fromId}-${e.toId}`;
    const h = hashPair(key);
    const color = EDGE_COLORS[h % EDGE_COLORS.length];
    const lineOpacity = e.count >= 10 ? 0.8 : 0.15 + ((e.count - 1) / 8) * 0.55;
    const labelOpacity = e.count >= 10 ? 1 : 0.45 + ((e.count - 1) / 8) * 0.55;

    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const len = Math.sqrt(dx * dx + dy * dy) || 1;
    const nx = -dy / len;
    const ny = dx / len;
    const mx = (a.x + b.x) / 2;
    const my = (a.y + b.y) / 2;

    const blockedByNode = nodes.some((n) => {
      if (n.id === e.fromId || n.id === e.toId) return false;
      const p = pos.get(n.id);
      if (!p) return false;
      return Math.hypot(p.x - mx, p.y - my) < NODE_R + 70;
    });
    // A flat 60px floor made short-distance edges (e.g. Hany to his own
    // collaborators, who sit close by) read as nearly straight lines — scale
    // the floor off the edge's own length so every connection gets a visibly
    // curved, "expanded" bow regardless of how close its two nodes are.
    const minDepth = blockedByNode ? 240 : Math.max(110, len * 0.35);

    // Candidate bows: both directions, a spread of depths. Filter out any that
    // still clip a third node's circle, then keep whichever candidate crosses
    // the fewest already-routed edges.
    const depths = [minDepth, minDepth + 60, minDepth + 130, minDepth + 220];
    let best: { control: Pt; curve: Pt[]; crossings: number } | null = null;
    for (const sign of [1, -1]) {
      for (const depth of depths) {
        const control = { x: mx + nx * depth * sign, y: my + ny * depth * sign };
        const curve = sampleCurve(a, control, b);
        const clipsThirdNode = nodes.some((n) => {
          if (n.id === e.fromId || n.id === e.toId) return false;
          const p = pos.get(n.id);
          if (!p) return false;
          return curve.some((pt) => Math.hypot(pt.x - p.x, pt.y - p.y) < NODE_R + 6);
        });
        if (clipsThirdNode) continue;
        const crossings = placed.reduce((sum, other) => sum + polylineCrossings(curve, other), 0);
        if (!best || crossings < best.crossings || (crossings === best.crossings && depth < Math.hypot(best.control.x - mx, best.control.y - my))) {
          best = { control, curve, crossings };
        }
      }
    }
    // Every candidate clipped a node (rare, dense layouts only) — fall back to
    // the deepest bow, which is the least likely to still clip anything.
    if (!best) {
      const depth = minDepth + 220;
      const control = { x: mx + nx * depth, y: my + ny * depth };
      best = { control, curve: sampleCurve(a, control, b), crossings: 0 };
    }

    placed.push(best.curve);
    const { control } = best;
    const path = `M ${a.x} ${a.y} Q ${control.x} ${control.y}, ${b.x} ${b.y}`;
    const labelX = 0.25 * a.x + 0.5 * control.x + 0.25 * b.x;
    const labelY = 0.25 * a.y + 0.5 * control.y + 0.25 * b.y;
    routed.push({ key, count: e.count, color, path, labelX, labelY, lineOpacity, labelOpacity });
  }

  return routed;
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
  const routedEdges = routeEdges(edges, nodes, pos);

  return (
    <div className="w-full overflow-x-auto">
      <svg
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        className="mx-auto w-full max-w-4xl"
        role="img"
        aria-label={dict.director + ", " + dict.researchTeam + ", " + dict.students}
      >
        {/* Edges — only real connections are drawn (zero-count pairs add pure
            clutter with no information). Routed by routeEdges(): strongest
            connections first with the straightest paths, each remaining edge
            greedily bowed to cross as few already-placed edges as possible. */}
        {routedEdges.map((e) => (
          <g key={e.key}>
            <path d={e.path} fill="none" stroke={e.color} strokeOpacity={e.lineOpacity} strokeWidth={2 + Math.min(e.count, 30) / 6} />
            <g transform={`translate(${e.labelX}, ${e.labelY})`} opacity={e.labelOpacity}>
              <circle r={16} fill={e.color} />
              <text textAnchor="middle" dominantBaseline="central" className="fill-white text-[15px] font-bold">
                {e.count}
              </text>
            </g>
          </g>
        ))}

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
