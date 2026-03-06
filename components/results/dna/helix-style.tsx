"use client";

import { motion } from "framer-motion";
import { DNAStyleProps } from "@/lib/dna/utils";

export default function HelixStyle({
  nodes,
  width = 600,
  height = 400,
  animated = true,
  onHover,
}: DNAStyleProps) {
  if (!nodes.length) return null;

  const cy = height / 2;
  const amplitude = (height / 2) - 50;
  const padding = 50;
  const n = nodes.length;
  const dx = n > 1 ? (width - 2 * padding) / (n - 1) : 0;
  const numTurns = Math.max(1.5, n / 3.5);

  // Calculate helix points
  const points = nodes.map((node, i) => {
    const t = n > 1
      ? (i / (n - 1)) * Math.PI * 2 * numTurns
      : 0;
    const x = padding + i * dx;
    const y1 = cy + amplitude * Math.sin(t) * 0.65;
    const y2 = cy + amplitude * Math.sin(t + Math.PI) * 0.65;
    return { ...node, x, y1, y2 };
  });

  // Build smooth strand paths using cubic bezier
  let strand1 = `M ${points[0].x} ${points[0].y1}`;
  let strand2 = `M ${points[0].x} ${points[0].y2}`;

  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1];
    const curr = points[i];
    const cpx = (prev.x + curr.x) / 2;
    strand1 += ` C ${cpx} ${prev.y1} ${cpx} ${curr.y1} ${curr.x} ${curr.y1}`;
    strand2 += ` C ${cpx} ${prev.y2} ${cpx} ${curr.y2} ${curr.x} ${curr.y2}`;
  }

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full">
      <defs>
        <filter id="helix-glow">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Strand 1 glow */}
      <motion.path
        d={strand1}
        fill="none"
        stroke="rgba(99,102,241,0.15)"
        strokeWidth="8"
        initial={animated ? { pathLength: 0 } : undefined}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1.5, ease: "easeInOut" }}
      />

      {/* Strand 1 */}
      <motion.path
        d={strand1}
        fill="none"
        stroke="rgba(99,102,241,0.45)"
        strokeWidth="2"
        initial={animated ? { pathLength: 0 } : undefined}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1.5, ease: "easeInOut" }}
      />

      {/* Strand 2 glow */}
      <motion.path
        d={strand2}
        fill="none"
        stroke="rgba(168,85,247,0.15)"
        strokeWidth="8"
        initial={animated ? { pathLength: 0 } : undefined}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1.5, ease: "easeInOut", delay: 0.15 }}
      />

      {/* Strand 2 */}
      <motion.path
        d={strand2}
        fill="none"
        stroke="rgba(168,85,247,0.45)"
        strokeWidth="2"
        initial={animated ? { pathLength: 0 } : undefined}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1.5, ease: "easeInOut", delay: 0.15 }}
      />

      {/* Cross bridges + Nodes */}
      {points.map((p, i) => {
        const nodeR = 4 + (p.riskScore / 100) * 5;
        return (
          <g key={i}>
            {/* Bridge */}
            <motion.line
              x1={p.x}
              y1={p.y1}
              x2={p.x}
              y2={p.y2}
              stroke={p.riskColor}
              strokeWidth="1.5"
              initial={animated ? { opacity: 0 } : { opacity: 0.25 }}
              animate={{ opacity: 0.25 }}
              transition={{ delay: 0.8 + i * 0.07, duration: 0.3 }}
            />

            {/* Top node */}
            <motion.circle
              cx={p.x}
              cy={p.y1}
              r={nodeR}
              fill={p.riskColor}
              initial={animated ? { opacity: 0 } : { opacity: p.intensity }}
              animate={{ opacity: p.intensity }}
              transition={{ delay: 0.8 + i * 0.07, duration: 0.35 }}
              filter={p.riskLevel === "illegal" ? "url(#helix-glow)" : undefined}
              onMouseEnter={() => onHover?.(p)}
              onMouseLeave={() => onHover?.(null)}
              className="cursor-pointer"
            />

            {/* Bottom node (uses clause type color) */}
            <motion.circle
              cx={p.x}
              cy={p.y2}
              r={nodeR * 0.7}
              fill={p.color}
              initial={animated ? { opacity: 0 } : { opacity: p.intensity * 0.6 }}
              animate={{ opacity: p.intensity * 0.6 }}
              transition={{ delay: 0.85 + i * 0.07, duration: 0.35 }}
            />
          </g>
        );
      })}
    </svg>
  );
}