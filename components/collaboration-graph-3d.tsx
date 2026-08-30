"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import * as THREE from "three";
import type { ForceGraphMethods } from "react-force-graph-3d";
import type { GraphNode, GraphLink } from "@/lib/collaboration-graph";

const ForceGraph3D = dynamic(() => import("react-force-graph-3d"), { ssr: false });

const NAVY = "#16235c";
const TEAL = "#128c7e";
const MUTED = "#94a3b8";

interface SimNode extends GraphNode {
  x?: number;
  y?: number;
  z?: number;
}

interface SimLink {
  source: string | SimNode;
  target: string | SimNode;
  weight: number;
}

function circularPhotoSprite(photoUrl: string, size: number): THREE.Sprite {
  const canvas = document.createElement("canvas");
  const dim = 128;
  canvas.width = dim;
  canvas.height = dim;
  const ctx = canvas.getContext("2d")!;
  ctx.beginPath();
  ctx.arc(dim / 2, dim / 2, dim / 2 - 4, 0, Math.PI * 2);
  ctx.closePath();
  ctx.strokeStyle = NAVY;
  ctx.lineWidth = 6;
  ctx.stroke();
  ctx.save();
  ctx.beginPath();
  ctx.arc(dim / 2, dim / 2, dim / 2 - 8, 0, Math.PI * 2);
  ctx.closePath();
  ctx.clip();

  const texture = new THREE.Texture();
  const img = new Image();
  img.crossOrigin = "anonymous";
  img.onload = () => {
    ctx.drawImage(img, 4, 4, dim - 8, dim - 8);
    texture.image = canvas;
    texture.needsUpdate = true;
  };
  img.src = photoUrl;

  const material = new THREE.SpriteMaterial({ map: texture, transparent: true });
  const sprite = new THREE.Sprite(material);
  sprite.scale.set(size, size, 1);
  return sprite;
}

function textSprite(text: string, color: string, fontSize = 42): THREE.Sprite {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d")!;
  ctx.font = `${fontSize}px sans-serif`;
  const width = Math.min(ctx.measureText(text).width + 20, 900);
  canvas.width = width;
  canvas.height = fontSize + 20;
  ctx.font = `${fontSize}px sans-serif`;
  ctx.fillStyle = color;
  ctx.textBaseline = "middle";
  ctx.fillText(text, 10, canvas.height / 2, width - 20);

  const texture = new THREE.CanvasTexture(canvas);
  const material = new THREE.SpriteMaterial({ map: texture, transparent: true, depthWrite: false });
  const sprite = new THREE.Sprite(material);
  const scale = canvas.height / 14;
  sprite.scale.set((canvas.width / canvas.height) * scale, scale, 1);
  return sprite;
}

export interface CollaborationGraph3DDict {
  clickToFocus: string;
  resetView: string;
  sharedPublications: string;
}

export function CollaborationGraph3D({
  nodes,
  links,
  dict,
}: {
  nodes: GraphNode[];
  links: GraphLink[];
  dict: CollaborationGraph3DDict;
}) {
  // next/dynamic() collapses the component's generic type parameters, so the ref
  // must be typed against the default (non-generic) instantiation it resolves to.
  const graphRef = useRef<ForceGraphMethods | undefined>(undefined);
  const [focusId, setFocusId] = useState<string | null>(null);

  // Disconnected nodes (no shared publications with anyone else in the graph)
  // never let the force simulation fully settle, so onEngineStop can't be relied
  // on alone — re-frame periodically for the first few seconds as it spreads out.
  useEffect(() => {
    let count = 0;
    const id = setInterval(() => {
      graphRef.current?.zoomToFit(500, 60);
      count += 1;
      if (count >= 8) clearInterval(id);
    }, 500);
    return () => clearInterval(id);
  }, []);

  const graphData = useMemo(() => ({ nodes: nodes as SimNode[], links: links as SimLink[] }), [nodes, links]);

  const neighborIds = useMemo(() => {
    if (!focusId) return null;
    const set = new Set<string>([focusId]);
    for (const l of links) {
      const s = typeof l.source === "string" ? l.source : (l.source as SimNode).id;
      const t = typeof l.target === "string" ? l.target : (l.target as SimNode).id;
      if (s === focusId) set.add(t);
      if (t === focusId) set.add(s);
    }
    return set;
  }, [focusId, links]);

  const handleNodeClick = useCallback((node: unknown) => {
    const n = node as SimNode;
    setFocusId((cur) => (cur === n.id ? null : n.id));
    const distance = 220;
    const { x = 0, y = 0, z = 0 } = n;
    const ratio = distance / Math.hypot(x, y, z, 1);
    graphRef.current?.cameraPosition(
      { x: x * (1 + ratio), y: y * (1 + ratio), z: z * (1 + ratio) },
      { x, y, z },
      800
    );
  }, []);

  return (
    <div className="relative">
      <div className="h-[600px] w-full overflow-hidden rounded-xl border bg-[#f7f8fa]">
        <ForceGraph3D
          ref={graphRef}
          graphData={graphData}
          backgroundColor="#f7f8fa"
          nodeLabel={(node: unknown) => {
            const n = node as SimNode;
            return `<div style="font:13px sans-serif;padding:4px 8px;background:white;border-radius:6px;border:1px solid #ddd;color:#111">${n.name}${n.title ? `<br/><span style="color:#666;font-size:11px">${n.title}</span>` : ""}<br/><span style="color:#888;font-size:11px">${n.publicationCount} publications</span></div>`;
          }}
          nodeThreeObject={(node: unknown) => {
            const n = node as SimNode;
            if (n.isLabMember && n.photoUrl) {
              const group = new THREE.Group();
              group.add(circularPhotoSprite(n.photoUrl, 26));
              const label = textSprite(n.name.replace(/^(Prof\.\s*Dr\.|Dr\.)\s*/i, ""), NAVY, 48);
              label.position.set(0, -19, 0);
              group.add(label);
              return group;
            }
            const geometry = new THREE.SphereGeometry(2.2, 12, 12);
            const material = new THREE.MeshLambertMaterial({ color: TEAL });
            return new THREE.Mesh(geometry, material);
          }}
          nodeThreeObjectExtend={false}
          nodeOpacity={0.95}
          linkWidth={(link: unknown) => Math.min(((link as SimLink).weight ?? 1) * 0.6, 6)}
          linkColor={(link: unknown) => {
            const l = link as SimLink;
            const s = typeof l.source === "string" ? l.source : l.source.id;
            const t = typeof l.target === "string" ? l.target : l.target.id;
            if (neighborIds && !(neighborIds.has(s) && neighborIds.has(t))) return "rgba(148,163,184,0.06)";
            return "rgba(22,35,92,0.35)";
          }}
          linkOpacity={0.6}
          onNodeClick={handleNodeClick}
          onBackgroundClick={() => setFocusId(null)}
          enableNodeDrag={false}
          showNavInfo={false}
        />
      </div>
      <p className="mt-2 text-center text-xs text-muted-foreground">{dict.clickToFocus}</p>
      {focusId && (
        <button
          type="button"
          onClick={() => setFocusId(null)}
          className="absolute top-3 right-3 rounded-md bg-background/90 px-3 py-1.5 text-xs font-medium shadow ring-1 ring-border hover:bg-muted"
        >
          {dict.resetView}
        </button>
      )}
    </div>
  );
}
