"use client";

import { motion } from "framer-motion";
import { DNAStyleProps } from "@/lib/dna/utils";

export default function FingerprintStyle({
  nodes,
  width = 400,
  height = 400,
  animated = true,
  onHover,
}: DNAStyleProps) {
  if (!nodes.length) return null;

  const cx = width / 2;
  const cy = height / 2;
  const minR = Math.min(width, height) * 0.08;
  const maxR = Math.min(cx, cy) - 15;
  const ringGap = (maxR - minR) / Math.max(nodes.length, 1);

  const arcs = nodes.map((node, i) => {
    const r = minR + i * ringGap;
    const arcFraction = 0.25 + (node.riskScore / 100) * 0.65;
    const startAngle = (i * 32 + 10) * (Math.PI / 180);
    const endAngle = startAngle + arcFraction * 2 * Math.PI;

    const x1 = cx + r * Math.cos(startAngle);
    const y1 = cy + r * Math.sin(startAngle);
    const x2 = cx + r * Math.cos(endAngle);
    const y2 = cy + r * Math.sin(endAngle);
    const largeArc = arcFraction > 0.5 ? 1 : 0;

    return {
      node,
      d: `M ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2}`,
      strokeWidth: Math.max(2, ringGap * 0.55),
    };
  });

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full">
      <defs>
        {nodes.map((node, i) =>
          node.riskLevel === "illegal" || node.riskLevel === "dangerous" ? (
            <filter key={`glow-fp-${i}`} id={`glow-fp-${i}`}>
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          ) : null,
        )}
      </defs>

      {arcs.map((arc, i) => (
        <motion.path
          key={i}
          d={arc.d}
          fill="none"
          stroke={arc.node.riskColor}
          strokeWidth={arc.strokeWidth}
          strokeLinecap="round"
          opacity={arc.node.intensity}
          filter={
            arc.node.riskLevel === "illegal" ||
            arc.node.riskLevel === "dangerous"
              ? `url(#glow-fp-${i})`
              : undefined
          }
          initial={animated ? { pathLength: 0, opacity: 0 } : undefined}
          animate={
            animated
              ? { pathLength: 1, opacity: arc.node.intensity }
              : undefined
          }
          transition={{ delay: i * 0.07, duration: 0.5, ease: "easeOut" }}
          onMouseEnter={() => onHover?.(arc.node)}
          onMouseLeave={() => onHover?.(null)}
          className="cursor-pointer transition-all duration-200 hover:opacity-100"
        />
      ))}

      {/* Center circle */}
      <circle cx={cx} cy={cy} r={minR - 3} fill="rgba(0,0,0,0.6)" />
      <text
        x={cx}
        y={cy}
        textAnchor="middle"
        dominantBaseline="central"
        fill="white"
        fontSize={minR * 0.7}
        fontWeight="bold"
      >
        {nodes.length}
      </text>
    </svg>
  );
}
