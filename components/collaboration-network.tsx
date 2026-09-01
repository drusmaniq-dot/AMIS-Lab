"use client";

import { useState } from "react";

export interface CollaborationNode {
  id: string;
  name: string;
  title: string;
  photoUrl: string | null;
  // Research profile icons rendered as small badges on the photo — Scholar
  // real Person records get theirs from their own ProfileLink rows;
  // externals carry them directly (see EXTERNAL_COLLABORATORS in page.tsx).
  scholarUrl: string | null;
  researchGateUrl: string | null;
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

// Widened from the original 0–1000 range to make room for collaborators
// flanking the far-left/right nodes (e.g. MS Alqahtani, Fawaz) without
// crowding the center — VIEW_X_MIN shifts the SVG viewBox's origin left,
// VIEW_W is the total width from there, so the extra room lands on both
// sides symmetrically instead of only appearing on the right.
const VIEW_X_MIN = -300;
const VIEW_W = 1600;
const VIEW_X_MAX = VIEW_X_MIN + VIEW_W;
const VIEW_H = 1700;
const NODE_R = 52;

// Hand-placed layout: director top-center, research team spread across the
// middle row, student offset off-center at the bottom so no straight edge
// between two other nodes happens to pass through it. Khalid sits well below
// Yousef's row (300px) so the dense Yousef/MS Alqahtani/Fawaz/Khalid bundle of
// connections has room to breathe instead of bunching immediately underneath.
const TIER_POSITIONS: Record<number, { y: number; xs: number[] }> = {
  0.0025: { y: 280, xs: [-30] }, // Bilel Charfi — international, above Zahran in the same left column
  0.003: { y: 430, xs: [-80] }, // Heba Y. Zahran — left of MS Alqahtani, his top collaborator
  0.0035: { y: 630, xs: [-30] }, // I. Grelowska — international, below Zahran in the same left column
  0.004: { y: 610, xs: [1020] }, // Khloud J. Alzahrani — right of Fawaz, his top collaborator
  0.08: { y: 730, xs: [740] }, // Ganapathy Senthil Murugan — between Essam (above) and Fawaz (below)
  0.1: { y: 90, xs: [130, 500, 870] }, // Manuela Reben, Rongping Wang, Essam Ramadan Shaaban — Yousef's top external collaborators, directly above him
  // MS Alqahtani and Fawaz used to share tier 0 with Yousef (a 3-way director-
  // centering split in page.tsx). They now each have their own tier so they
  // can move independently — same y/x as before, so nothing shifted.
  0.001: { y: 430, xs: [150] }, // Mohammed S. Alqahtani — split out from tier 0, same spot as before
  0: { y: 430, xs: [500] }, // El Sayed Yousef — now the only one left on this tier
  0.002: { y: 400, xs: [850] }, // Fawaz Alqahtani — split out from tier 0, same spot as before
  0.007: { y: 180, xs: [250] }, // Manuela Reben
  0.008: { y: 110, xs: [530] }, // Rongping Wang
  0.009: { y: 190, xs: [790] }, // Essam Ramadan Shaaban — placeholder, adjust freely
  0.5: { y: 790, xs: [460] }, // Khalid — directly under Yousef, pushed well down for clearer connections
  0.55: { y: 800, xs: [950] }, // Reem Dhafer Alshehri — pushed out to the far right, level with Hany
  0.6: { y: 920, xs: [250] }, // Dahshan — raised to Khalid's level
  0.9: { y: 1250, xs: [200] }, // Kamal A. Aly — Dahshan's top collaborator, left of Dahshan
  1: { y: 950, xs: [720] }, // Hany — pulled back in toward the center
  1.1: { y: 1210, xs: [725] }, // Ehab Mahmoud Mohamed — Hany's collaborator, below him
  1.3: { y: 1120, xs: [490] }, // Neeraj Mehta — Dahshan's #2, below-left of Dahshan
  1.7: { y: 1150, xs: [950] }, // Mohamed A. Ismeil — Hany's collaborator, below-right of him
  1.9: { y: 780, xs: [120] }, // Elham Fahad Alkhammash — directly under Reem
  // Both verified via Asiri's only paper on file (DOI 10.69626/sag.2025.0207).
  1.95: { y: 1450, xs: [280] }, // Akram Ibrahim — flanking Asiri, left
  2: { y: 1020, xs: [510] }, // Remaining student (Asiri)
  2.05: { y: 1050, xs: [50] }, // Ali M. Alshehri — flanking Asiri, right
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
function routeEdges(
  edges: CollaborationEdge[],
  nodes: CollaborationNode[],
  pos: Map<string, Pt>,
  labelZones: Map<string, LabelZone>,
  forceVisibleKeys?: Set<string>
): RoutedEdge[] {
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
  // Checks against each node's REAL, final label position — not just a fixed
  // spot below the photo — since placeLabels() may have put that node's name
  // to its left/right/above instead, wherever was clearest at layout time.
  const hitsNameZone = (pt: Pt, excludeIds: string[]) =>
    nodes.some((n) => {
      if (excludeIds.includes(n.id)) return false;
      const zone = labelZones.get(n.id);
      return zone ? rectHitsPoint(zone, pt) : false;
    });

  for (const e of real) {
    const a = pos.get(e.fromId);
    const b = pos.get(e.toId);
    if (!a || !b) continue;
    const key = `${e.fromId}-${e.toId}`;
    const excludeIds = [e.fromId, e.toId];
    const color = colorForCount(e.count);
    const forcedVisible = forceVisibleKeys?.has(key);
    const lineOpacity = forcedVisible ? 0.8 : e.count >= 10 ? 0.8 : 0.15 + ((e.count - 1) / 8) * 0.55;
    const labelOpacity = forcedVisible ? 1 : e.count >= 10 ? 1 : 0.45 + ((e.count - 1) / 8) * 0.55;

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

type Side = "below" | "above" | "right" | "left";

interface LabelZone {
  x: number;
  y: number;
  w: number;
  h: number;
  side: Side;
  anchor: "start" | "middle" | "end";
}

// Below/above labels default to center-anchored on the node, but a long
// title centered on a node that sits near the canvas's left/right edge (e.g.
// Manuela Reben at x=280 with "AGH University of Science and Technology,
// Poland") runs off the diagram before it can be read. Past this margin the
// text instead grows inward from the node — start-anchored near the left
// edge, end-anchored near the right — so it always stays on-canvas.
const EDGE_MARGIN = 350;

function horizontalAnchor(p: Pt): "start" | "middle" | "end" {
  if (p.x < VIEW_X_MIN + EDGE_MARGIN) return "start";
  if (p.x > VIEW_X_MAX - EDGE_MARGIN) return "end";
  return "middle";
}

// Sized to comfortably fit the worst case: a wrapped 2-line name plus a
// wrapped 3-line title, plus the profile-icon badge row underneath it (see
// wrapLines/buildLabelLines and ProfileBadges below). There's no visible box
// drawn here any more — this height only matters as the keep-clear zone
// routeEdges() avoids, so generous sizing costs nothing.
const LABEL_ZONE_H = 105;

function zoneForSide(p: Pt, side: Side): LabelZone {
  if (side === "right") return { x: p.x + NODE_R + 8, y: p.y - LABEL_ZONE_H / 2, w: 172, h: LABEL_ZONE_H, side, anchor: "start" };
  if (side === "left") return { x: p.x - NODE_R - 180, y: p.y - LABEL_ZONE_H / 2, w: 172, h: LABEL_ZONE_H, side, anchor: "end" };

  const w = 190;
  const anchor = horizontalAnchor(p);
  const x = anchor === "start" ? Math.max(VIEW_X_MIN + 4, p.x - 95) : anchor === "end" ? Math.min(VIEW_X_MAX - 4 - w, p.x + 95 - w) : p.x - w / 2;
  const y = side === "below" ? p.y + NODE_R + 6 : p.y - NODE_R - 6 - LABEL_ZONE_H;
  return { x, y, w, h: LABEL_ZONE_H, side, anchor };
}

// Greedy word-wrap by character count (no DOM measureText available here —
// this component can render server-side). Packs words into at most
// `maxLines` lines, ellipsizing the last one if the text still doesn't fit.
function wrapLines(text: string, maxChars: number, maxLines: number): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (candidate.length > maxChars && current) {
      lines.push(current);
      current = word;
      if (lines.length === maxLines) break;
    } else {
      current = candidate;
    }
  }
  if (lines.length < maxLines && current) lines.push(current);

  if (lines.join(" ").length < text.length) {
    let last = lines[lines.length - 1] ?? "";
    while (last.length > 1 && last.length + 1 > maxChars) last = last.slice(0, -1);
    lines[lines.length - 1] = last.trimEnd() + "…";
  }
  return lines;
}

interface LabelLine {
  text: string;
  bold: boolean;
  size: number;
  x: number;
  y: number;
  anchor: "start" | "middle" | "end";
}

function lineHeight(l: { size: number }): number {
  return l.size + 4;
}

// Lays out a node's name (up to 2 lines, bold) and title (up to 3 lines,
// muted) as individual positioned lines, derived purely from the finished
// zone box — so a manual LABEL_OVERRIDES nudge (which shifts the zone)
// automatically carries every line along with it. For "above", the title
// lines render first (farthest from the photo) and the name last, mirroring
// "below" where the name sits closest to the photo either way.
function labelTextLayout(zone: LabelZone, node: CollaborationNode): LabelLine[] {
  const vertical = zone.side === "below" || zone.side === "above";
  const nameLines = wrapLines(node.name, vertical ? 22 : 20, 2).map((text) => ({ text, bold: true, size: 14 }));
  const titleLines = wrapLines(node.title, vertical ? 32 : 27, 3).map((text) => ({ text, bold: false, size: 11 }));
  const ordered = zone.side === "above" ? [...titleLines, ...nameLines] : [...nameLines, ...titleLines];
  const heights = ordered.map(lineHeight);
  const totalH = heights.reduce((a, b) => a + b, 0);

  const anchor = zone.anchor;
  let x: number;
  if (zone.side === "right") x = zone.x + 6;
  else if (zone.side === "left") x = zone.x + zone.w - 6;
  else x = anchor === "start" ? zone.x + 6 : anchor === "end" ? zone.x + zone.w - 6 : zone.x + zone.w / 2;

  let y: number;
  if (zone.side === "below") y = zone.y + heights[0] + 2;
  else if (zone.side === "above") y = zone.y + zone.h - totalH + heights[0] - 2;
  else y = zone.y + zone.h / 2 - totalH / 2 + heights[0] / 2 + 3;

  return ordered.map((l, i) => {
    const line = { ...l, x, y, anchor };
    y += heights[i + 1] ?? 0;
    return line;
  });
}

function rectHitsPoint(z: LabelZone, pt: Pt): boolean {
  return pt.x > z.x && pt.x < z.x + z.w && pt.y > z.y && pt.y < z.y + z.h;
}

function rectsOverlap(a: LabelZone, b: LabelZone): boolean {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

function overlapArea(z: LabelZone, others: LabelZone[]): number {
  let total = 0;
  for (const o of others) {
    const ox = Math.max(0, Math.min(z.x + z.w, o.x + o.w) - Math.max(z.x, o.x));
    const oy = Math.max(0, Math.min(z.y + z.h, o.y + o.h) - Math.max(z.y, o.y));
    total += ox * oy;
  }
  return total;
}

function rectInBounds(z: LabelZone): boolean {
  return z.x >= VIEW_X_MIN + 4 && z.y >= 4 && z.x + z.w <= VIEW_X_MAX - 4 && z.y + z.h <= VIEW_H - 4;
}

function nudge(zone: LabelZone, dx = 0, dy = 0): LabelZone {
  return dx || dy ? { ...zone, x: zone.x + dx, y: zone.y + dy } : zone;
}

// Manual per-person label control — the same idea as TIER_OVERRIDES/
// TIER_POSITIONS above, but for where a name/title renders relative to its
// own photo instead of where the photo itself sits. Keyed by the node's
// display name (CollaborationNode.name — the short form shown on the
// diagram, e.g. "Hany S. Hussein", not the full "Prof. Dr. Hany S.
// Hussein"). Set `side` to pin the label to a specific side instead of
// letting placeLabels() pick automatically, and/or `dx`/`dy` to nudge the
// result a few pixels from there — the background rect and the text always
// move together since labelTextPositions() derives both from the same final
// zone. Add an entry here for anyone whose label you want to hand-place;
// leave it out to keep the automatic below/above/right/left placement.
const LABEL_OVERRIDES: Record<string, { side?: Side; dx?: number; dy?: number }> = {
   "Hany S. Hussein": { side: "right", dy: -10 },
   "Fawaz Alqahtani": { side: "right", dy: -10 },
};

// Decides where each node's name/title renders — below the photo by default,
// else above/right/left — before any edge is routed. Deciding this first
// (rather than fitting labels around already-drawn curves) means routeEdges()
// can treat every node's real, final label position as a keep-clear zone, so
// a connection line can never end up passing through a name/title no matter
// which side it landed on. Scored by proximity to other nodes' photos, with
// a hard rule that a label can never overlap one already placed by an
// earlier node — two different people's names must never visually merge.
// Anyone with a LABEL_OVERRIDES entry is placed first (in the same
// top-to-bottom order as everyone else), so a manual pin always keeps the
// space it claims and every automatic label works around it, not the reverse.
function placeLabels(nodes: CollaborationNode[], pos: Map<string, Pt>): Map<string, LabelZone> {
  const order = [...nodes].sort((a, b) => {
    const aPinned = LABEL_OVERRIDES[a.name]?.side ? 0 : 1;
    const bPinned = LABEL_OVERRIDES[b.name]?.side ? 0 : 1;
    if (aPinned !== bPinned) return aPinned - bPinned;
    const pa = pos.get(a.id)!;
    const pb = pos.get(b.id)!;
    return pa.y - pb.y || pa.x - pb.x;
  });
  const placed: LabelZone[] = [];
  const result = new Map<string, LabelZone>();

  for (const n of order) {
    const p = pos.get(n.id);
    if (!p) continue;
    const override = LABEL_OVERRIDES[n.name];

    if (override?.side) {
      const chosen = nudge(zoneForSide(p, override.side), override.dx, override.dy);
      placed.push(chosen);
      result.set(n.id, chosen);
      continue;
    }

    const candidates: Side[] = ["below", "right", "left", "above"];
    let best: { zone: LabelZone; score: number } | null = null;

    for (const side of candidates) {
      const zone = zoneForSide(p, side);
      if (!rectInBounds(zone)) continue;
      if (placed.some((z) => rectsOverlap(zone, z))) continue;

      let score = 0;
      for (const other of nodes) {
        if (other.id === n.id) continue;
        const op = pos.get(other.id);
        if (op && rectHitsPoint(zone, op)) score += 30;
      }
      score += side === "below" ? -3 : side === "above" ? 0 : -1;

      if (!best || score < best.score) best = { zone, score };
    }

    // Every in-bounds candidate collided with an already-placed label (only
    // happens in the tightest clusters) — fall back to whichever side
    // overlaps the least, so two names never fully merge even then.
    const chosen = nudge(
      best?.zone ??
        candidates
          .map((side) => zoneForSide(p, side))
          .filter(rectInBounds)
          .sort((a, b) => overlapArea(a, placed) - overlapArea(b, placed))[0] ??
        zoneForSide(p, "below"),
      override?.dx,
      override?.dy
    );
    placed.push(chosen);
    result.set(n.id, chosen);
  }

  return result;
}

const BADGE_R = 10;
const BADGE_GAP = 4; // gap between the two badge circles' edges, when both render

// Small circular icon badges linking to a person's research profiles —
// Google Scholar and, if known, ResearchGate. Renders on its own line right
// under the name/title text (not on the photo), centered on `x` at `y`, kept
// close together rather than spread apart. Nothing renders for anyone with
// neither link known.
function ProfileBadges({ x, y, scholarUrl, researchGateUrl }: { x: number; y: number; scholarUrl: string | null; researchGateUrl: string | null }) {
  const badges: { key: string; href: string; label: string; color: string }[] = [];
  if (scholarUrl) badges.push({ key: "scholar", href: scholarUrl, label: "S", color: "#4285F4" });
  if (researchGateUrl) badges.push({ key: "rg", href: researchGateUrl, label: "RG", color: "#00CCBB" });
  if (badges.length === 0) return null;

  const half = BADGE_R + BADGE_GAP / 2;
  const positions = badges.length === 1 ? [{ x, y }] : [{ x: x - half, y }, { x: x + half, y }];

  return (
    <>
      {badges.map((b, i) => (
        <a key={b.key} href={b.href} target="_blank" rel="noopener noreferrer">
          <circle cx={positions[i].x} cy={positions[i].y} r={BADGE_R} fill={b.color} stroke="var(--background)" strokeWidth={2} />
          <text
            x={positions[i].x}
            y={positions[i].y}
            textAnchor="middle"
            dominantBaseline="central"
            className="fill-white font-bold"
            style={{ fontSize: b.label.length > 1 ? 7 : 10 }}
          >
            {b.label}
          </text>
        </a>
      ))}
    </>
  );
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
  hideCountKeys,
  forceVisibleKeys,
}: {
  nodes: CollaborationNode[];
  edges: CollaborationEdge[];
  dict: CollaborationNetworkDict;
  // Edge keys ("fromId-toId") to draw without their numeric badge — for
  // asserted/manual connections that don't carry a real shared-paper count.
  hideCountKeys?: Set<string>;
  // Edge keys ("fromId-toId") to render at full opacity regardless of count —
  // for a real but weak (low-count) connection that should still read clearly
  // rather than fade the way every other weak edge deliberately does.
  forceVisibleKeys?: Set<string>;
}) {
  const pos = layout(nodes);
  const labelZones = placeLabels(nodes, pos);
  const routedEdges = routeEdges(edges, nodes, pos, labelZones, forceVisibleKeys);
  const nodesWithLayout = nodes
    .map((n) => {
      const p = pos.get(n.id);
      const zone = labelZones.get(n.id);
      if (!p || !zone) return null;
      return { n, p, zone, lines: labelTextLayout(zone, n) };
    })
    .filter((x): x is NonNullable<typeof x> => x !== null);

  // Clicking a node focuses it: its own connections render bold and at full
  // opacity (regardless of how weak/strong the real count is), every other
  // node and line fades back — clicking the same node again, or empty canvas,
  // clears the focus. Purely a rendering concern, so plain useState is enough;
  // nothing here needs to survive a re-render of the parent page.
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const connectedIds = new Set<string>();
  const connectedEdgeKeys = new Set<string>();
  if (selectedId) {
    connectedIds.add(selectedId);
    for (const e of edges) {
      if (e.count <= 0) continue;
      if (e.fromId === selectedId || e.toId === selectedId) {
        connectedIds.add(e.fromId);
        connectedIds.add(e.toId);
        connectedEdgeKeys.add(`${e.fromId}-${e.toId}`);
      }
    }
  }
  const FADE = 0.06;

  return (
    <div className="w-full overflow-x-auto">
      <svg
        viewBox={`${VIEW_X_MIN} 0 ${VIEW_W} ${VIEW_H}`}
        className="mx-auto w-full max-w-7xl"
        role="img"
        aria-label={dict.director + ", " + dict.researchTeam + ", " + dict.students}
        onClick={() => setSelectedId(null)}
      >
        {/* Edges — only real connections are drawn (zero-count pairs add pure
            clutter with no information). Routed by routeEdges(): strongest
            connections first with the straightest paths, each remaining edge
            greedily bowed to cross as few already-placed edges as possible,
            with its value-label independently placed to avoid every other
            label and every node's name text. */}
        {routedEdges.map((e) => {
          const isFocused = selectedId !== null;
          const isConnected = connectedEdgeKeys.has(e.key);
          const lineOpacity = !isFocused ? e.lineOpacity : isConnected ? 0.95 : FADE;
          const labelOpacity = !isFocused ? e.labelOpacity : isConnected ? 1 : FADE;
          const strokeWidth = isFocused && isConnected ? 3 + Math.min(e.count, 30) / 10 : 1 + Math.min(e.count, 30) / 15;
          return (
            <g key={e.key} className="transition-opacity duration-300">
              <path d={e.path} fill="none" stroke={e.color} strokeOpacity={lineOpacity} strokeWidth={strokeWidth} className="transition-all duration-300" />
              {!hideCountKeys?.has(e.key) && (
                <g transform={`translate(${e.labelX}, ${e.labelY})`} opacity={labelOpacity} className="transition-opacity duration-300">
                  <circle r={LABEL_R} fill={e.color} />
                  <text textAnchor="middle" dominantBaseline="central" className="fill-white text-[15px] font-bold">
                    {e.count}
                  </text>
                </g>
              )}
            </g>
          );
        })}

        {/* Nodes */}
        {nodesWithLayout.map(({ n, p, zone, lines }) => {
          const isFocused = selectedId !== null;
          const isSelected = selectedId === n.id;
          const isConnected = connectedIds.has(n.id);
          const opacity = !isFocused ? 1 : isConnected ? 1 : FADE;
          return (
          <g
            key={n.id}
            opacity={opacity}
            className="cursor-pointer transition-opacity duration-300"
            onClick={(e) => {
              e.stopPropagation();
              setSelectedId((cur) => (cur === n.id ? null : n.id));
            }}
          >
            <clipPath id={`clip-${n.id}`}>
              <circle cx={p.x} cy={p.y} r={NODE_R} />
            </clipPath>
            <circle
              cx={p.x}
              cy={p.y}
              r={NODE_R + 4}
              className="fill-background transition-all duration-300"
              stroke="var(--primary)"
              strokeWidth={isSelected ? 5 : 2}
            />
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
            {/* Name (bold) and title (muted, up to 3 wrapped lines) — placed
                by placeLabels() below/above/right/left of the photo, wherever
                is clearest of curves, labels, and other nodes. No background
                behind the text any more; routeEdges() still keeps every
                connection line clear of this zone regardless. */}
            {lines.map((l, i) => (
              <text
                key={i}
                x={l.x}
                y={l.y}
                textAnchor={l.anchor}
                className={l.bold ? "fill-foreground text-[14px] font-semibold" : "fill-muted-foreground text-[11px]"}
              >
                {l.text}
              </text>
            ))}
            {/* For "above" labels the last line (the name) is the one
                closest to the photo, with little room past it — badges go
                before the first line instead, extending further away from
                the photo just like every other side already does. */}
            <ProfileBadges
              x={zone.x + zone.w / 2}
              y={zone.side === "above" ? lines[0].y - 13 : lines[lines.length - 1].y + 13}
              scholarUrl={n.scholarUrl}
              researchGateUrl={n.researchGateUrl}
            />
          </g>
          );
        })}
      </svg>

      <Legend />
      <p className="mt-2 text-center text-xs text-muted-foreground">{dict.papersLabel}</p>
    </div>
  );
}
