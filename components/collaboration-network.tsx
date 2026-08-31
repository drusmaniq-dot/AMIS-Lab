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

// Connection strength reads directly as color, not just line thickness — every
// edge in a bin shares one color, explained in the legend rendered below the
// diagram. Ramps from neutral gray (barely-there links) through brand teal/
// blue/green to gold/orange/red (the strongest handful of collaborations).
const VALUE_BINS: { max: number; color: string; label: string }[] = [
  { max: 2, color: "#cbd5e1", label: "1–2" },
  { max: 5, color: "#94a3b8", label: "3–5" },
  { max: 10, color: "#10a2a4", label: "6–10" },
  { max: 15, color: "#1c66a1", label: "11–15" },
  { max: 25, color: "#6eaa02", label: "16–25" },
  { max: 30, color: "#eab308", label: "26–30" },
  { max: 33, color: "#f97316", label: "31–33" },
  { max: 40, color: "#c82c39", label: "34–40" },
  { max: Infinity, color: "#7c1d2e", label: "41+" },
];

function colorForCount(count: number): string {
  return (VALUE_BINS.find((b) => count <= b.max) ?? VALUE_BINS[VALUE_BINS.length - 1]).color;
}

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

// Approximate bounding box of a node's name+title text below its photo —
// treated as a keep-clear zone so lines don't route straight through it.
function nameZoneHit(p: Pt, pt: Pt): boolean {
  return pt.x > p.x - 95 && pt.x < p.x + 95 && pt.y > p.y + NODE_R + 6 && pt.y < p.y + NODE_R + 50;
}

const LABEL_R = 16;
const LABEL_GAP = 40; // minimum center-to-center distance between two edge-value labels

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
// already-placed edges and avoids every node's name text — a practical
// crossing-minimization heuristic rather than pure per-edge randomization.
// Once a line's shape is settled, its value-label is placed at whichever point
// along that same curve is clearest of every other already-placed label,
// rather than always sitting dead-center.
function routeEdges(edges: CollaborationEdge[], nodes: CollaborationNode[], pos: Map<string, Pt>): RoutedEdge[] {
  const real = edges.filter((e) => e.count > 0).sort((a, b) => b.count - a.count);
  const placedCurves: Pt[][] = [];
  const placedLabels: Pt[] = [];
  const routed: RoutedEdge[] = [];

  const hitsNode = (pt: Pt, excludeIds: string[], margin: number) =>
    nodes.some((n) => {
      if (excludeIds.includes(n.id)) return false;
      const p = pos.get(n.id);
      return p ? Math.hypot(pt.x - p.x, pt.y - p.y) < NODE_R + margin : false;
    });
  const hitsNameZone = (pt: Pt, excludeIds: string[]) =>
    nodes.some((n) => {
      if (excludeIds.includes(n.id)) return false;
      const p = pos.get(n.id);
      return p ? nameZoneHit(p, pt) : false;
    });

  for (const e of real) {
    const a = pos.get(e.fromId);
    const b = pos.get(e.toId);
    if (!a || !b) continue;
    const key = `${e.fromId}-${e.toId}`;
    const excludeIds = [e.fromId, e.toId];
    const color = colorForCount(e.count);
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
      if (excludeIds.includes(n.id)) return false;
      const p = pos.get(n.id);
      return p ? Math.hypot(p.x - mx, p.y - my) < NODE_R + 70 : false;
    });
    // A flat depth floor made short-distance edges (e.g. two people who sit
    // right next to each other, with no one between them) read as nearly
    // straight lines far shorter than every other connection — scale the
    // floor inversely with the edge's own length so short and long
    // connections both end up with a comparably "expanded" rendered arc.
    const minDepth = blockedByNode ? 240 : Math.max(130, 320 - len * 0.6);
    const depths = [minDepth, minDepth + 60, minDepth + 130, minDepth + 220];

    let best: { control: Pt; curve: Pt[]; crossings: number } | null = null;
    for (const sign of [1, -1]) {
      for (const depth of depths) {
        const control = { x: mx + nx * depth * sign, y: my + ny * depth * sign };
        const curve = sampleCurve(a, control, b);
        const invalid = curve.some((pt) => hitsNode(pt, excludeIds, 6) || hitsNameZone(pt, excludeIds));
        if (invalid) continue;
        const crossings = placedCurves.reduce((sum, other) => sum + polylineCrossings(curve, other), 0);
        if (!best || crossings < best.crossings || (crossings === best.crossings && depth < Math.hypot(best.control.x - mx, best.control.y - my))) {
          best = { control, curve, crossings };
        }
      }
    }
    // Every candidate clipped something (rare, dense layouts only) — fall
    // back to the deepest bow, least likely to still clip anything.
    if (!best) {
      const depth = minDepth + 220;
      const control = { x: mx + nx * depth, y: my + ny * depth };
      best = { control, curve: sampleCurve(a, control, b), crossings: 0 };
    }
    placedCurves.push(best.curve);

    // Label placement: search points along the finished curve for one that
    // doesn't collide with any label already placed by a stronger connection,
    // preferring positions closest to the curve's midpoint.
    const { control } = best;
    const tCandidates = [0.5, 0.42, 0.58, 0.34, 0.66, 0.25, 0.75, 0.18, 0.82];
    let labelPt: Pt = quadPoint(a, control, b, 0.5);
    for (const t of tCandidates) {
      const candidate = quadPoint(a, control, b, t);
      const clashesLabel = placedLabels.some((l) => Math.hypot(l.x - candidate.x, l.y - candidate.y) < LABEL_GAP);
      const clashesNode = hitsNode(candidate, excludeIds, LABEL_R + 4) || hitsNameZone(candidate, excludeIds);
      if (!clashesLabel && !clashesNode) {
        labelPt = candidate;
        break;
      }
    }
    placedLabels.push(labelPt);

    const path = `M ${a.x} ${a.y} Q ${control.x} ${control.y}, ${b.x} ${b.y}`;
    routed.push({ key, count: e.count, color, path, labelX: labelPt.x, labelY: labelPt.y, lineOpacity, labelOpacity });
  }

  return routed;
}

function Legend() {
  return (
    <div className="mt-4 flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
      {VALUE_BINS.map((bin) => (
        <div key={bin.label} className="flex items-center gap-1.5">
          <span className="inline-block size-3 rounded-full" style={{ backgroundColor: bin.color }} />
          <span className="text-xs text-muted-foreground">{bin.label}</span>
        </div>
      ))}
    </div>
  );
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
            greedily bowed to cross as few already-placed edges as possible,
            with its value-label independently placed to avoid every other
            label and every node's name text. */}
        {routedEdges.map((e) => (
          <g key={e.key}>
            <path d={e.path} fill="none" stroke={e.color} strokeOpacity={e.lineOpacity} strokeWidth={2 + Math.min(e.count, 30) / 6} />
            <g transform={`translate(${e.labelX}, ${e.labelY})`} opacity={e.labelOpacity}>
              <circle r={LABEL_R} fill={e.color} />
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
              {/* Solid backing behind the name/title so a routed line that still
                  brushes this zone never visually cuts through the text. */}
              <rect x={p.x - 95} y={p.y + NODE_R + 6} width={190} height={44} rx={6} className="fill-background" />
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

      <Legend />
      <p className="mt-2 text-center text-xs text-muted-foreground">{dict.papersLabel}</p>
    </div>
  );
}
