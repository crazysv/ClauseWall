"use client";

import { motion } from "framer-motion";
import { DNAStyleProps } from "@/lib/dna/utils";

export default function ConstellationStyle({
  nodes,
  width = 600,
  height = 400,
  animated = true,
  onHover,
}: DNAStyleProps) {
  if (!nodes.length) return null;

  const cx = width / 2;
  const cy = height / 2;
  const maxR = Math.min(cx, cy) - 25;
  const goldenAngle = Math.PI * (3 - Math.sqrt(5));

  // Position stars using golden angle
  const stars = nodes.map((node, i) => {
    const angle = i * goldenAngle;
    const r = Math.sqrt((i + 1) / nodes.length) * maxR;
    return {
      ...node,
      x: cx + r * Math.cos(angle),
      y: cy + r * Math.sin(angle),
      size: 3 + (node.riskScore / 100) * 9,
    };
  });

  // Connect same-type clauses
  const typeGroups: Record<string, typeof stars> = {};
  stars.forEach((s) => {
    const key = s.clauseType;
    if (!typeGroups[key]) typeGroups[key] = [];
    typeGroups[key].push(s);
  });

  const connections: { x1: number; y1: number; x2: number; y2: number; color: string }[] = [];
  Object.values(typeGroups).forEach((group) => {
    for (let i = 0; i < group.length - 1; i++) {
      connections.push({
        x1: group[i].x,
        y1: group[i].y,
        x2: group[i + 1].x,
        y2: group[i + 1].y,
        color: group[i].color,
      });
    }
  });

  // Deterministic background stars
  const bgStars = Array.from({ length: 60 }, (_, i) => ({
    x: ((i * 137.508) % width),
    y: ((i * 73.137) % height),
    r: 0.4 + (i % 3) * 0.4,
    opacity: 0.08 + (i % 5) * 0.04,
  }));

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full">
      {/* Background stars */}
      {bgStars.map((s, i) => (
        <circle key={`bg-${i}`} cx={s.x} cy={s.y} r={s.r} fill="white" opacity={s.opacity} />
      ))}

      {/* Connections */}
      {connections.map((c, i) => (
        <motion.line
          key={`conn-${i}`}
          x1={c.x1}
          y1={c.y1}
          x2={c.x2}
          y2={c.y2}
          stroke={c.color}
          strokeWidth="1"
          initial={animated ? { opacity: 0 } : { opacity: 0.12 }}
          animate={{ opacity: 0.12 }}
          transition={{ delay: 0.6 + i * 0.04, duration: 0.5 }}
        />
      ))}

      {/* Stars */}
      {stars.map((star, i) => (
        <g key={i}>
          {/* Outer glow for dangerous/illegal */}
          {(star.riskLevel === "dangerous" || star.riskLevel === "illegal") && (
            <motion.circle
              cx={star.x}
              cy={star.y}
              r={star.size * 2.5}
              fill={star.riskColor}
              initial={animated ? { opacity: 0 } : { opacity: 0.1 }}
              animate={{ opacity: 0.1 }}
              transition={{ delay: i * 0.06 + 0.3, duration: 0.5 }}
            />
          )}

          {/* Star body */}
          <motion.circle
            cx={star.x}
            cy={star.y}
            r={star.size}
            fill={star.riskColor}
            initial={animated ? { opacity: 0, r: 0 } : undefined}
            animate={{ opacity: star.intensity, r: star.size }}
            transition={{ delay: i * 0.06, duration: 0.4, ease: "backOut" }}
            onMouseEnter={() => onHover?.(star)}
            onMouseLeave={() => onHover?.(null)}
            className="cursor-pointer"
          />

          {/* Inner bright core */}
          <motion.circle
            cx={star.x}
            cy={star.y}
            r={star.size * 0.35}
            fill="white"
            initial={animated ? { opacity: 0 } : { opacity: 0.6 }}
            animate={{ opacity: 0.6 }}
            transition={{ delay: i * 0.06 + 0.2, duration: 0.3 }}
            style={{ pointerEvents: "none" }}
          />
        </g>
      ))}
    </svg>
  );
}