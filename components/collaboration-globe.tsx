"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import type { GlobeMethods } from "react-globe.gl";
import type { CollaboratorLocation } from "@/lib/collaborator-locations";

const Globe = dynamic(() => import("react-globe.gl"), { ssr: false });

export interface GlobeNode {
  id: string;
  name: string;
  title: string;
  photoUrl: string | null;
  location: CollaboratorLocation;
}

export interface GlobeEdge {
  fromId: string;
  toId: string;
  count: number;
}

const EARTH_TEXTURE = "https://unpkg.com/three-globe/example/img/earth-blue-marble.jpg";
const BUMP_TEXTURE = "https://unpkg.com/three-globe/example/img/earth-topology.png";

function markerEl(n: GlobeNode): HTMLElement {
  const el = document.createElement("div");
  el.style.position = "relative";
  el.style.width = "56px";
  el.style.height = "56px";
  el.style.cursor = "pointer";

  el.title = `${n.name} — ${n.title}`;

  const photo = document.createElement("div");
  photo.style.width = "52px";
  photo.style.height = "52px";
  photo.style.borderRadius = "9999px";
  photo.style.border = "2px solid white";
  photo.style.boxShadow = "0 2px 8px rgba(0,0,0,0.45)";
  photo.style.backgroundColor = "#e2e8f0";
  photo.style.backgroundSize = "cover";
  photo.style.backgroundPosition = "center";
  if (n.photoUrl) photo.style.backgroundImage = `url(${n.photoUrl})`;
  el.appendChild(photo);

  // Windows doesn't render flag emoji as pictorial flags (shows the two-letter
  // regional-indicator pair as plain text instead, by OS design) — use a real
  // flag image so this looks correct regardless of the viewer's platform/fonts.
  const flag = document.createElement("img");
  flag.src = `https://flagcdn.com/w40/${n.location.countryCode.toLowerCase()}.png`;
  flag.alt = n.location.countryCode;
  flag.title = `${n.location.city}, ${n.location.country}`;
  flag.style.position = "absolute";
  flag.style.top = "-4px";
  flag.style.left = "-4px";
  flag.style.width = "20px";
  flag.style.height = "14px";
  flag.style.objectFit = "cover";
  flag.style.borderRadius = "3px";
  flag.style.background = "white";
  flag.style.border = "1.5px solid white";
  flag.style.boxShadow = "0 1px 4px rgba(0,0,0,0.4)";
  el.appendChild(flag);

  return el;
}

// Nodes sharing one city (most of the lab is at KKU, Abha — currently 9
// people) fan out into an evenly spaced ring around the real point instead of
// stacking on it. A pure random jitter doesn't guarantee any minimum spacing
// between two people, so with enough of them sharing one point some pairs
// would still land close enough to overlap — a ring, sized to the cluster,
// guarantees every face stays fully visible regardless of how many share it.
function ringOffset(index: number, total: number): { dLat: number; dLng: number } {
  if (total <= 1) return { dLat: 0, dLng: 0 };
  // The default camera view spans a huge stretch of the globe (UK to China),
  // so markers — a fixed 56px on screen regardless of zoom — need a wide
  // geographic ring to read as separated faces rather than a solid blob at
  // that zoom level, not just when a viewer scrolls in close.
  const radiusDeg = 3.5 + total * 0.85;
  const angle = (index / total) * 2 * Math.PI;
  return { dLat: Math.sin(angle) * radiusDeg, dLng: Math.cos(angle) * radiusDeg };
}

const GLOBE_HEIGHT = 600;

export function CollaborationGlobe({ nodes, edges }: { nodes: GlobeNode[]; edges: GlobeEdge[] }) {
  const globeRef = useRef<GlobeMethods | undefined>(undefined);
  const containerRef = useRef<HTMLDivElement | null>(null);
  // react-globe.gl sizes its canvas from explicit width/height props — it does
  // not auto-detect its container, so without this it defaults to the full
  // window size and only a clipped, empty-looking corner shows through.
  const [width, setWidth] = useState<number | null>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const update = () => setWidth(el.clientWidth);
    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const byCity = new Map<string, GlobeNode[]>();
  for (const n of nodes) {
    const key = `${n.location.lat},${n.location.lng}`;
    if (!byCity.has(key)) byCity.set(key, []);
    byCity.get(key)!.push(n);
  }
  // Sort each cluster deterministically (by id) so the ring arrangement is
  // stable across reloads instead of shuffling every render.
  for (const list of byCity.values()) list.sort((a, b) => a.id.localeCompare(b.id));

  const points = nodes.map((n) => {
    const clusterMates = byCity.get(`${n.location.lat},${n.location.lng}`)!;
    const { dLat, dLng } = ringOffset(
      clusterMates.findIndex((m) => m.id === n.id),
      clusterMates.length
    );
    return {
      ...n,
      lat: n.location.lat + dLat,
      lng: n.location.lng + dLng,
    };
  });
  const posById = new Map(points.map((p) => [p.id, p]));

  const arcs = edges
    .filter((e) => e.count > 0)
    .map((e) => {
      const from = posById.get(e.fromId);
      const to = posById.get(e.toId);
      if (!from || !to) return null;
      return {
        startLat: from.lat,
        startLng: from.lng,
        endLat: to.lat,
        endLng: to.lng,
        count: e.count,
      };
    })
    .filter((a): a is NonNullable<typeof a> => a !== null);

  // Runs once `width` is set — that's the render right after <Globe> actually
  // mounts and globeRef gets populated. The old empty-deps version fired on
  // the wrapper's first mount, before width/Globe existed, so globeRef.current
  // was always undefined and pointOfView() silently no-op'd via `?.`.
  // `Globe` is a separate async chunk (next/dynamic) — it can still be
  // unresolved for a moment after `width` becomes truthy, so globeRef.current
  // may not exist yet on the very next tick. A single timeout can fire before
  // that chunk finishes loading and silently no-op forever (no dependency
  // change ever re-triggers it). Poll instead, so this fires the instant the
  // ref is actually populated, however long that takes.
  useEffect(() => {
    if (!width) return;
    let cancelled = false;
    const trySetView = () => {
      if (cancelled) return;
      if (globeRef.current) {
        globeRef.current.pointOfView({ lat: 32, lng: 50, altitude: 1.9 }, 0);
      } else {
        setTimeout(trySetView, 100);
      }
    };
    trySetView();
    return () => {
      cancelled = true;
    };
  }, [width]);

  return (
    <div ref={containerRef} className="h-[600px] w-full overflow-hidden rounded-xl border bg-[#000814]">
      {width && (
      <Globe
        ref={globeRef}
        width={width}
        height={GLOBE_HEIGHT}
        globeImageUrl={EARTH_TEXTURE}
        bumpImageUrl={BUMP_TEXTURE}
        backgroundColor="#000814"
        htmlElementsData={points}
        htmlLat={(d: object) => (d as (typeof points)[number]).lat}
        htmlLng={(d: object) => (d as (typeof points)[number]).lng}
        htmlElement={(d: object) => markerEl(d as GlobeNode)}
        arcsData={arcs}
        arcStartLat={(d: object) => (d as (typeof arcs)[number]).startLat}
        arcStartLng={(d: object) => (d as (typeof arcs)[number]).startLng}
        arcEndLat={(d: object) => (d as (typeof arcs)[number]).endLat}
        arcEndLng={(d: object) => (d as (typeof arcs)[number]).endLng}
        arcColor={() => "rgba(255,196,0,0.65)"}
        arcStroke={(d: object) => Math.min(0.6 + (d as (typeof arcs)[number]).count / 12, 2.5)}
        arcDashLength={0.4}
        arcDashGap={0.15}
        arcDashAnimateTime={2500}
        arcAltitudeAutoScale={0.35}
      />
      )}
    </div>
  );
}
