"use client";

import { useRef, useEffect, useState } from "react";
import type {
  GraphVisualizationData,
  VisNode,
  VisLink,
  GraphNodeType,
} from "@/lib/graph/types";

interface GraphCanvasProps {
  data: GraphVisualizationData;
  highlightType?: string;
}

// Node type colors
const NODE_COLORS: Record<GraphNodeType, string> = {
  law: "#3B82F6", // blue
  section: "#8B5CF6", // purple
  clause_type: "#EF4444", // red
  interpretation: "#A855F7", // violet
  jurisdiction: "#6B7280", // gray
  authority: "#EAB308", // yellow
  penalty: "#F97316", // orange
  case_ref: "#22C55E", // green
  guideline: "#06B6D4", // cyan
  regulation: "#14B8A6", // teal
  document_type: "#64748B", // slate
  remedy: "#10B981", // emerald
};

const NODE_RADIUS: Record<GraphNodeType, number> = {
  law: 24,
  section: 18,
  clause_type: 22,
  interpretation: 16,
  jurisdiction: 14,
  authority: 18,
  penalty: 16,
  case_ref: 18,
  guideline: 14,
  regulation: 14,
  document_type: 14,
  remedy: 16,
};

interface SimNode extends VisNode {
  x: number;
  y: number;
  vx: number;
  vy: number;
  fx?: number | null;
  fy?: number | null;
}

export default function GraphCanvas({ data, highlightType }: GraphCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [hoveredNode, setHoveredNode] = useState<SimNode | null>(null);
  const [tooltip, setTooltip] = useState<{
    x: number;
    y: number;
    node: SimNode;
  } | null>(null);
  const nodesRef = useRef<SimNode[]>([]);
  const linksRef = useRef<VisLink[]>([]);
  const animFrameRef = useRef<number>(0);
  const dragNodeRef = useRef<SimNode | null>(null);
  const offsetRef = useRef({ x: 0, y: 0 });
  const scaleRef = useRef(1);

  useEffect(() => {
    if (!data || data.nodes.length === 0) return;

    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas size
    const rect = container.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;
    ctx.scale(dpr, dpr);

    const width = rect.width;
    const height = rect.height;
    const centerX = width / 2;
    const centerY = height / 2;

    // Initialize nodes with positions
    const nodes: SimNode[] = data.nodes.map((n, i) => {
      const angle = (2 * Math.PI * i) / data.nodes.length;
      const radius = 120 + Math.random() * 80;
      return {
        ...n,
        x: centerX + Math.cos(angle) * radius,
        y: centerY + Math.sin(angle) * radius,
        vx: 0,
        vy: 0,
      };
    });

    nodesRef.current = nodes;
    linksRef.current = data.links;

    const nodeMap = new Map<string, SimNode>();
    nodes.forEach((n) => nodeMap.set(n.id, n));

    // Simple force simulation
    let alpha = 1;

    function simulate() {
      if (alpha < 0.001) {
        alpha = 0;
        return;
      }
      alpha *= 0.99;

      // Center gravity
      for (const node of nodes) {
        if (node.fx != null) {
          node.x = node.fx;
          continue;
        }
        if (node.fy != null) {
          node.y = node.fy;
          continue;
        }
        node.vx += (centerX - node.x) * 0.001;
        node.vy += (centerY - node.y) * 0.001;
      }

      // Link forces (spring)
      for (const link of data.links) {
        const source = nodeMap.get(link.source);
        const target = nodeMap.get(link.target);
        if (!source || !target) continue;

        const dx = target.x - source.x;
        const dy = target.y - source.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        const desiredDist = 120;
        const force = (dist - desiredDist) * 0.003 * alpha;

        const fx = (dx / dist) * force;
        const fy = (dy / dist) * force;

        if (source.fx == null) {
          source.vx += fx;
        }
        if (source.fy == null) {
          source.vy += fy;
        }
        if (target.fx == null) {
          target.vx -= fx;
        }
        if (target.fy == null) {
          target.vy -= fy;
        }
      }

      // Repulsion between nodes
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const a = nodes[i];
          const b = nodes[j];
          const dx = b.x - a.x;
          const dy = b.y - a.y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          const repulsion = (800 / (dist * dist)) * alpha;

          const fx = (dx / dist) * repulsion;
          const fy = (dy / dist) * repulsion;

          if (a.fx == null) {
            a.vx -= fx;
          }
          if (a.fy == null) {
            a.vy -= fy;
          }
          if (b.fx == null) {
            b.vx += fx;
          }
          if (b.fy == null) {
            b.vy += fy;
          }
        }
      }

      // Apply velocity
      for (const node of nodes) {
        if (node.fx != null && node.fy != null) continue;
        node.vx *= 0.6;
        node.vy *= 0.6;
        node.x += node.vx;
        node.y += node.vy;

        // Boundary
        node.x = Math.max(40, Math.min(width - 40, node.x));
        node.y = Math.max(40, Math.min(height - 40, node.y));
      }
    }

    function draw() {
      if (!ctx) return;
      ctx.clearRect(0, 0, width, height);

      ctx.save();
      ctx.translate(offsetRef.current.x, offsetRef.current.y);
      ctx.scale(scaleRef.current, scaleRef.current);

      // Draw edges
      for (const link of data.links) {
        const source = nodeMap.get(link.source);
        const target = nodeMap.get(link.target);
        if (!source || !target) continue;

        ctx.beginPath();
        ctx.moveTo(source.x, source.y);
        ctx.lineTo(target.x, target.y);
        ctx.strokeStyle = "rgba(255,255,255,0.08)";
        ctx.lineWidth = 1;

        // Highlight edges connected to hovered node
        if (
          hoveredNode &&
          (link.source === hoveredNode.id || link.target === hoveredNode.id)
        ) {
          ctx.strokeStyle = "rgba(6,182,212,0.4)";
          ctx.lineWidth = 2;
        }

        ctx.stroke();
      }

      // Draw nodes
      for (const node of nodes) {
        const color = NODE_COLORS[node.type] || "#6B7280";
        const radius = NODE_RADIUS[node.type] || 14;
        const isHighlight =
          highlightType &&
          node.type === "clause_type" &&
          node.metadata &&
          (node as VisNode).id ===
            nodes.find((n) => n.type === "clause_type")?.id;
        const isHovered = hoveredNode?.id === node.id;

        // Glow for hovered
        if (isHovered) {
          ctx.beginPath();
          ctx.arc(node.x, node.y, radius + 6, 0, Math.PI * 2);
          ctx.fillStyle = color + "30";
          ctx.fill();
        }

        // Node circle
        ctx.beginPath();
        ctx.arc(node.x, node.y, radius, 0, Math.PI * 2);
        ctx.fillStyle = isHovered ? color : color + "CC";
        ctx.fill();
        ctx.strokeStyle = color;
        ctx.lineWidth = isHovered ? 2 : 1;
        ctx.stroke();

        // Label
        ctx.fillStyle = "#FFFFFF";
        ctx.font = `${isHovered ? "bold " : ""}${radius > 18 ? 10 : 8}px system-ui, sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";

        const label = node.short_label || node.label;
        const maxLen = radius > 18 ? 14 : 10;
        const displayLabel =
          label.length > maxLen ? label.substring(0, maxLen - 2) + ".." : label;
        ctx.fillText(displayLabel, node.x, node.y);
      }

      ctx.restore();

      // Draw tooltip outside transform
      if (tooltip) {
        const t = tooltip.node;
        const tx = tooltip.x + offsetRef.current.x;
        const ty = tooltip.y + offsetRef.current.y - 50;
        const text = t.label;
        const typeText = t.type.replace(/_/g, " ").toUpperCase();

        ctx.fillStyle = "rgba(0,0,0,0.85)";
        const textWidth =
          Math.max(
            ctx.measureText(text).width,
            ctx.measureText(typeText).width,
          ) + 20;
        ctx.beginPath();
        ctx.roundRect(tx - textWidth / 2, ty - 20, textWidth, 40, 6);
        ctx.fill();

        ctx.fillStyle = "#FFFFFF";
        ctx.font = "bold 11px system-ui";
        ctx.textAlign = "center";
        ctx.fillText(text, tx, ty - 5);

        ctx.fillStyle = NODE_COLORS[t.type] || "#6B7280";
        ctx.font = "9px system-ui";
        ctx.fillText(typeText, tx, ty + 10);
      }
    }

    function loop() {
      simulate();
      draw();
      animFrameRef.current = requestAnimationFrame(loop);
    }

    loop();

    // Mouse handlers
    function getNodeAtPos(mx: number, my: number): SimNode | null {
      const sx = (mx - offsetRef.current.x) / scaleRef.current;
      const sy = (my - offsetRef.current.y) / scaleRef.current;
      for (let i = nodes.length - 1; i >= 0; i--) {
        const n = nodes[i];
        const r = NODE_RADIUS[n.type] || 14;
        const dx = sx - n.x;
        const dy = sy - n.y;
        if (dx * dx + dy * dy < r * r) return n;
      }
      return null;
    }

    function onMouseMove(e: MouseEvent) {
      const rect = canvas!.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;

      if (dragNodeRef.current) {
        dragNodeRef.current.fx = (mx - offsetRef.current.x) / scaleRef.current;
        dragNodeRef.current.fy = (my - offsetRef.current.y) / scaleRef.current;
        dragNodeRef.current.x = dragNodeRef.current.fx;
        dragNodeRef.current.y = dragNodeRef.current.fy;
        alpha = Math.max(alpha, 0.3);
        return;
      }

      const node = getNodeAtPos(mx, my);
      setHoveredNode(node);
      setTooltip(node ? { x: mx, y: my, node } : null);
      canvas!.style.cursor = node ? "pointer" : "default";
    }

    function onMouseDown(e: MouseEvent) {
      const rect = canvas!.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      const node = getNodeAtPos(mx, my);
      if (node) {
        dragNodeRef.current = node;
        node.fx = node.x;
        node.fy = node.y;
        alpha = 0.3;
      }
    }

    function onMouseUp() {
      if (dragNodeRef.current) {
        dragNodeRef.current.fx = null;
        dragNodeRef.current.fy = null;
        dragNodeRef.current = null;
      }
    }

    function onWheel(e: WheelEvent) {
      e.preventDefault();
      const delta = e.deltaY > 0 ? 0.9 : 1.1;
      scaleRef.current = Math.max(0.3, Math.min(3, scaleRef.current * delta));
    }

    canvas.addEventListener("mousemove", onMouseMove);
    canvas.addEventListener("mousedown", onMouseDown);
    canvas.addEventListener("mouseup", onMouseUp);
    canvas.addEventListener("mouseleave", onMouseUp);
    canvas.addEventListener("wheel", onWheel, { passive: false });

    return () => {
      cancelAnimationFrame(animFrameRef.current);
      canvas.removeEventListener("mousemove", onMouseMove);
      canvas.removeEventListener("mousedown", onMouseDown);
      canvas.removeEventListener("mouseup", onMouseUp);
      canvas.removeEventListener("mouseleave", onMouseUp);
      canvas.removeEventListener("wheel", onWheel);
    };
  }, [data, highlightType, hoveredNode, tooltip]);

  if (!data || data.nodes.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500 text-sm">
        No graph data to visualize
      </div>
    );
  }

  // Legend
  const presentTypes = [...new Set(data.nodes.map((n) => n.type))];

  return (
    <div ref={containerRef} className="relative w-full h-full">
      <canvas ref={canvasRef} className="w-full h-full" />

      {/* Legend */}
      <div className="absolute bottom-3 left-3 p-2 rounded-lg bg-black/70 border border-white/10">
        <p className="text-[9px] text-gray-500 mb-1.5 font-medium">
          NODE TYPES
        </p>
        <div className="flex flex-wrap gap-x-3 gap-y-1">
          {presentTypes.map((type) => (
            <div key={type} className="flex items-center gap-1">
              <div
                className="w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: NODE_COLORS[type] || "#6B7280" }}
              />
              <span className="text-[9px] text-gray-400">
                {type.replace(/_/g, " ")}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Controls hint */}
      <div className="absolute top-3 right-3 p-2 rounded-lg bg-black/70 border border-white/10">
        <p className="text-[9px] text-gray-500">
          Scroll: Zoom • Drag: Move nodes
        </p>
      </div>
    </div>
  );
}
