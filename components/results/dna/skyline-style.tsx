"use client";

import { motion } from "framer-motion";
import { DNAStyleProps } from "@/lib/dna/utils";

export default function SkylineStyle({
  nodes,
  width = 600,
  height = 400,
  animated = true,
  onHover,
}: DNAStyleProps) {
  if (!nodes.length) return null;

  const groundY = height - 35;
  const maxBH = height - 80;
  const minBH = 25;
  const gap = 3;
  const bW = Math.min(45, (width - 50 - gap * (nodes.length - 1)) / nodes.length);
  const totalW = nodes.length * bW + (nodes.length - 1) * gap;
  const startX = (width - totalW) / 2;

  const buildings = nodes.map((node, i) => {
    const bH = minBH + (node.riskScore / 100) * (maxBH - minBH);
    const x = startX + i * (bW + gap);
    const y = groundY - bH;

    // Windows
    const wRows = Math.max(1, Math.floor(bH / 18));
    const wCols = Math.max(1, Math.floor(bW / 12));
    const windows: { wx: number; wy: number; lit: boolean }[] = [];
    for (let r = 0; r < wRows; r++) {
      for (let c = 0; c < wCols; c++) {
        windows.push({
          wx: x + 4 + c * ((bW - 8) / wCols),
          wy: y + 10 + r * 18,
          lit: (r * wCols + c + i) % 3 !== 0, // deterministic
        });
      }
    }

    return { node, x, y, bH, windows };
  });

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full">
      <defs>
        <linearGradient id="sky-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#070B14" />
          <stop offset="100%" stopColor="#111827" />
        </linearGradient>
      </defs>

      {/* Sky */}
      <rect x="0" y="0" width={width} height={height} fill="url(#sky-grad)" />

      {/* Decorative stars */}
      {Array.from({ length: 20 }, (_, i) => (
        <circle
          key={`star-${i}`}
          cx={(i * 131.7) % width}
          cy={(i * 47.3) % (groundY * 0.4)}
          r={0.8}
          fill="white"
          opacity={0.15 + (i % 4) * 0.08}
        />
      ))}

      {/* Ground */}
      <rect x="0" y={groundY} width={width} height={height - groundY} fill="#0D1117" />
      <line x1="0" y1={groundY} x2={width} y2={groundY} stroke="rgba(255,255,255,0.08)" strokeWidth="1" />

      {/* Buildings */}
      {buildings.map((b, i) => (
        <g key={i}>
          {/* Building glow for dangerous/illegal */}
          {(b.node.riskLevel === "dangerous" || b.node.riskLevel === "illegal") && (
            <motion.rect
              x={b.x - 3}
              width={bW + 6}
              rx={3}
              fill={b.node.riskColor}
              initial={animated ? { y: groundY, height: 0, opacity: 0 } : { y: b.y - 3, height: b.bH + 3, opacity: 0.08 }}
              animate={{ y: b.y - 3, height: b.bH + 3, opacity: 0.08 }}
              transition={{ delay: i * 0.06, duration: 0.55, ease: "easeOut" }}
            />
          )}

          {/* Building body */}
          <motion.rect
            x={b.x}
            width={bW}
            rx={2}
            fill={b.node.riskColor}
            opacity={b.node.intensity * 0.75}
            initial={animated ? { y: groundY, height: 0 } : { y: b.y, height: b.bH }}
            animate={{ y: b.y, height: b.bH }}
            transition={{ delay: i * 0.06, duration: 0.55, ease: "easeOut" }}
            onMouseEnter={() => onHover?.(b.node)}
            onMouseLeave={() => onHover?.(null)}
            className="cursor-pointer"
          />

          {/* Windows */}
          {b.windows.map((w, wi) => (
            <motion.rect
              key={wi}
              x={w.wx}
              y={w.wy}
              width={Math.min(5, bW * 0.3)}
              height={6}
              fill={w.lit ? "#FBBF24" : "#1F2937"}
              rx={0.5}
              initial={animated ? { opacity: 0 } : { opacity: w.lit ? 0.5 : 0.15 }}
              animate={{ opacity: w.lit ? 0.5 : 0.15 }}
              transition={{ delay: 0.4 + i * 0.06 + wi * 0.015, duration: 0.25 }}
              style={{ pointerEvents: "none" }}
            />
          ))}
        </g>
      ))}

      {/* Ground reflection */}
      {buildings.map((b, i) => (
        <motion.rect
          key={`ref-${i}`}
          x={b.x}
          y={groundY + 2}
          width={bW}
          height={Math.min(20, b.bH * 0.15)}
          fill={b.node.riskColor}
          rx={1}
          initial={animated ? { opacity: 0 } : { opacity: 0.06 }}
          animate={{ opacity: 0.06 }}
          transition={{ delay: i * 0.06 + 0.3, duration: 0.3 }}
        />
      ))}
    </svg>
  );
}