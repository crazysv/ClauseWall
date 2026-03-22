"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import type {
  InterconnectionGraph,
  PoisonPillTrap,
  InterconnectionNode,
  InterconnectionEdge,
} from "@/types";
import { Card, CardContent } from "@/components/ui/card";

interface Props {
  graph: InterconnectionGraph;
  traps: PoisonPillTrap[];
  selectedTrapId: string | null;
  onTrapSelect: (id: string | null) => void;
}

const NODE_RISK_COLORS: Record<string, string> = {
  safe: "#22c55e",
  warning: "#eab308",
  dangerous: "#ef4444",
  illegal: "#a855f7",
};

const EDGE_COLORS: Record<string, string> = {
  enables: "#60a5fa",
  amplifies: "#f97316",
  blocks_escape: "#ef4444",
  triggers: "#a855f7",
  compounds: "#dc2626",
  overrides: "#6b7280",
  references: "#4b5563",
  depends_on: "#93c5fd",
};

export function InterconnectionMap({
  graph,
  traps,
  selectedTrapId,
  onTrapSelect,
}: Props) {
  const [hoveredNode, setHoveredNode] = useState<number | null>(null);
  const [tooltip, setTooltip] = useState<{
    x: number;
    y: number;
    text: string;
  } | null>(null);

  // Get trap clause numbers for highlighting
  const selectedTrapClauses = useMemo(() => {
    if (!selectedTrapId) return null;
    const trap = traps.find((t) => t.id === selectedTrapId);
    if (!trap) return null;
    return new Set(trap.mechanisms.map((m) => m.clause_number));
  }, [selectedTrapId, traps]);

  const selectedTrapEdges = useMemo(() => {
    if (!selectedTrapId) return null;
    return new Set(
      graph.edges
        .filter((e) => e.trap_id === selectedTrapId)
        .map((e) => `${e.from_clause}-${e.to_clause}`)
    );
  }, [selectedTrapId, graph.edges]);

  if (graph.nodes.length === 0) {
    return (
      <Card className="bg-white/[0.02] border-white/10">
        <CardContent className="p-8 text-center">
          <p className="text-xs text-white/30">
            No interconnection data available.
          </p>
        </CardContent>
      </Card>
    );
  }

  // Normalize positions to SVG viewBox
  const minX = Math.min(...graph.nodes.map((n) => n.x));
  const maxX = Math.max(...graph.nodes.map((n) => n.x));
  const minY = Math.min(...graph.nodes.map((n) => n.y));
  const maxY = Math.max(...graph.nodes.map((n) => n.y));
  const rangeX = Math.max(maxX - minX, 1);
  const rangeY = Math.max(maxY - minY, 1);

  const normalize = (node: InterconnectionNode) => ({
    x: 60 + ((node.x - minX) / rangeX) * 780,
    y: 50 + ((node.y - minY) / rangeY) * 400,
  });

  const getNodeRadius = (node: InterconnectionNode) => {
    const base = 14;
    return base + Math.min(node.connection_count * 2, 10);
  };

  const isNodeDimmed = (node: InterconnectionNode) => {
    if (!selectedTrapClauses) return false;
    return !selectedTrapClauses.has(node.clause_number);
  };

  const isEdgeDimmed = (edge: InterconnectionEdge) => {
    if (!selectedTrapEdges) return false;
    return !selectedTrapEdges.has(`${edge.from_clause}-${edge.to_clause}`);
  };

  return (
    <Card className="bg-white/[0.02] border-white/10 overflow-hidden">
      <CardContent className="p-0">
        {/* Legend */}
        <div className="px-4 py-2 border-b border-white/5 flex flex-wrap gap-3">
          <button
            onClick={() => onTrapSelect(null)}
            className={`text-[9px] px-2 py-0.5 rounded-full transition-all ${
              !selectedTrapId
                ? "bg-purple-500/15 text-purple-300"
                : "text-white/25 hover:text-white/40"
            }`}
          >
            All
          </button>
          {traps.map((trap) => (
            <button
              key={trap.id}
              onClick={() =>
                onTrapSelect(selectedTrapId === trap.id ? null : trap.id)
              }
              className={`text-[9px] px-2 py-0.5 rounded-full transition-all truncate max-w-[120px] ${
                selectedTrapId === trap.id
                  ? "bg-purple-500/15 text-purple-300"
                  : "text-white/25 hover:text-white/40"
              }`}
            >
              {trap.trap_name}
            </button>
          ))}
        </div>

        {/* SVG Graph */}
        <div className="overflow-x-auto">
          <svg
            viewBox="0 0 900 500"
            className="w-full min-w-[600px]"
            style={{ minHeight: "400px" }}
          >
            {/* Background */}
            <rect width="900" height="500" fill="transparent" />

            {/* Cluster backgrounds */}
            {graph.clusters.map((cluster) => {
              const clusterNodes = graph.nodes.filter((n) =>
                cluster.clause_numbers.includes(n.clause_number)
              );
              if (clusterNodes.length < 2) return null;

              const positions = clusterNodes.map(normalize);
              const cx =
                positions.reduce((s, p) => s + p.x, 0) / positions.length;
              const cy =
                positions.reduce((s, p) => s + p.y, 0) / positions.length;
              const maxDist = Math.max(
                ...positions.map((p) =>
                  Math.sqrt((p.x - cx) ** 2 + (p.y - cy) ** 2)
                )
              );

              return (
                <circle
                  key={cluster.id}
                  cx={cx}
                  cy={cy}
                  r={maxDist + 35}
                  fill="rgba(168, 85, 247, 0.03)"
                  stroke="rgba(168, 85, 247, 0.08)"
                  strokeWidth="1"
                  strokeDasharray="4 4"
                />
              );
            })}

            {/* Edges */}
            {graph.edges.map((edge, idx) => {
              const fromNode = graph.nodes.find(
                (n) => n.clause_number === edge.from_clause
              );
              const toNode = graph.nodes.find(
                (n) => n.clause_number === edge.to_clause
              );
              if (!fromNode || !toNode) return null;

              const from = normalize(fromNode);
              const to = normalize(toNode);
              const color = EDGE_COLORS[edge.connection_type] || "#4b5563";
              const dimmed = isEdgeDimmed(edge);
              const width =
                edge.strength === "strong"
                  ? 2.5
                  : edge.strength === "moderate"
                  ? 1.5
                  : 1;

              return (
                <g key={`edge-${idx}`} opacity={dimmed ? 0.1 : 0.7}>
                  {/* Arrow marker definition */}
                  <defs>
                    <marker
                      id={`arrow-${idx}`}
                      markerWidth="6"
                      markerHeight="4"
                      refX="5"
                      refY="2"
                      orient="auto"
                    >
                      <polygon
                        points="0 0, 6 2, 0 4"
                        fill={color}
                        opacity="0.6"
                      />
                    </marker>
                  </defs>
                  <line
                    x1={from.x}
                    y1={from.y}
                    x2={to.x}
                    y2={to.y}
                    stroke={color}
                    strokeWidth={width}
                    markerEnd={`url(#arrow-${idx})`}
                    strokeDasharray={
                      edge.connection_type === "depends_on" ? "4 3" : undefined
                    }
                  />
                </g>
              );
            })}

            {/* Nodes */}
            {graph.nodes.map((node) => {
              const pos = normalize(node);
              const r = getNodeRadius(node);
              const color =
                NODE_RISK_COLORS[node.risk_level] || NODE_RISK_COLORS.warning;
              const dimmed = isNodeDimmed(node);
              const isHovered = hoveredNode === node.clause_number;

              return (
                <g
                  key={`node-${node.clause_number}`}
                  opacity={dimmed ? 0.15 : 1}
                  style={{ cursor: "pointer" }}
                  onMouseEnter={() => {
                    setHoveredNode(node.clause_number);
                    setTooltip({
                      x: pos.x,
                      y: pos.y - r - 10,
                      text: `C${node.clause_number}: ${node.clause_type.replace(/_/g, " ")} — "${node.clause_text_snippet}"`,
                    });
                  }}
                  onMouseLeave={() => {
                    setHoveredNode(null);
                    setTooltip(null);
                  }}
                >
                  {/* Glow for trap nodes */}
                  {node.is_part_of_trap && !dimmed && (
                    <circle
                      cx={pos.x}
                      cy={pos.y}
                      r={r + 4}
                      fill="none"
                      stroke={color}
                      strokeWidth="1"
                      opacity="0.3"
                    />
                  )}

                  {/* Node circle */}
                  <circle
                    cx={pos.x}
                    cy={pos.y}
                    r={isHovered ? r + 2 : r}
                    fill={`${color}20`}
                    stroke={color}
                    strokeWidth={node.is_part_of_trap ? 2.5 : 1}
                  />

                  {/* Label */}
                  <text
                    x={pos.x}
                    y={pos.y}
                    textAnchor="middle"
                    dominantBaseline="central"
                    fontSize="10"
                    fontWeight="bold"
                    fill={color}
                  >
                    C{node.clause_number}
                  </text>
                </g>
              );
            })}

            {/* Tooltip */}
            {tooltip && (
              <g>
                <rect
                  x={tooltip.x - 120}
                  y={tooltip.y - 28}
                  width="240"
                  height="24"
                  rx="4"
                  fill="rgba(0,0,0,0.85)"
                  stroke="rgba(255,255,255,0.1)"
                  strokeWidth="0.5"
                />
                <text
                  x={tooltip.x}
                  y={tooltip.y - 16}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fontSize="9"
                  fill="rgba(255,255,255,0.7)"
                >
                  {tooltip.text.substring(0, 60)}
                  {tooltip.text.length > 60 ? "..." : ""}
                </text>
              </g>
            )}
          </svg>
        </div>

        {/* Edge Type Legend */}
        <div className="px-4 py-2 border-t border-white/5 flex flex-wrap gap-3">
          {Object.entries(EDGE_COLORS)
            .filter(([type]) =>
              graph.edges.some((e) => e.connection_type === type)
            )
            .map(([type, color]) => (
              <div key={type} className="flex items-center gap-1">
                <div
                  className="w-3 h-0.5 rounded"
                  style={{ backgroundColor: color }}
                />
                <span className="text-[9px] text-white/25 capitalize">
                  {type.replace(/_/g, " ")}
                </span>
              </div>
            ))}
        </div>
      </CardContent>
    </Card>
  );
}
