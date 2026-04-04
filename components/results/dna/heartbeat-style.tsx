"use client";

import { motion } from "framer-motion";
import { DNAStyleProps, DNANode } from "@/lib/dna/utils";

export default function HeartbeatStyle({
  nodes,
  width = 600,
  height = 400,
  animated = true,
  onHover,
}: DNAStyleProps) {
  if (!nodes.length) return null;

  const centerY = height / 2;
  const maxSpike = centerY - 40;
  const segW = (width - 60) / nodes.length;
  const startX = 30;

  // Build EKG path
  const pathParts: string[] = [`M ${startX} ${centerY}`];
  const dots: { x: number; y: number; node: DNANode }[] = [];

  nodes.forEach((node, i) => {
    const baseX = startX + i * segW;
    const spikeH = (node.riskScore / 100) * maxSpike;

    // Flat approach
    pathParts.push(`L ${baseX + segW * 0.1} ${centerY}`);

    switch (node.riskLevel) {
      case "safe":
        pathParts.push(
          `Q ${baseX + segW * 0.3} ${centerY - spikeH * 0.4} ${baseX + segW * 0.5} ${centerY}`,
        );
        dots.push({ x: baseX + segW * 0.3, y: centerY - spikeH * 0.4, node });
        break;

      case "warning":
        pathParts.push(`L ${baseX + segW * 0.25} ${centerY - spikeH * 0.6}`);
        pathParts.push(`L ${baseX + segW * 0.38} ${centerY + spikeH * 0.15}`);
        pathParts.push(`L ${baseX + segW * 0.5} ${centerY}`);
        dots.push({ x: baseX + segW * 0.25, y: centerY - spikeH * 0.6, node });
        break;

      case "dangerous":
        pathParts.push(`L ${baseX + segW * 0.2} ${centerY + spikeH * 0.1}`);
        pathParts.push(`L ${baseX + segW * 0.3} ${centerY - spikeH}`);
        pathParts.push(`L ${baseX + segW * 0.4} ${centerY + spikeH * 0.25}`);
        pathParts.push(`L ${baseX + segW * 0.5} ${centerY}`);
        dots.push({ x: baseX + segW * 0.3, y: centerY - spikeH, node });
        break;

      case "illegal":
        pathParts.push(`L ${baseX + segW * 0.15} ${centerY - spikeH}`);
        pathParts.push(`L ${baseX + segW * 0.25} ${centerY + spikeH * 0.15}`);
        pathParts.push(`L ${baseX + segW * 0.35} ${centerY - spikeH * 0.75}`);
        pathParts.push(`L ${baseX + segW * 0.45} ${centerY + spikeH * 0.2}`);
        pathParts.push(`L ${baseX + segW * 0.55} ${centerY}`);
        dots.push({ x: baseX + segW * 0.15, y: centerY - spikeH, node });
        break;
    }

    // Flat recovery
    pathParts.push(`L ${baseX + segW * 0.9} ${centerY}`);
  });

  pathParts.push(`L ${width - 30} ${centerY}`);
  const d = pathParts.join(" ");

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full">
      <defs>
        <linearGradient id="ekg-gradient" x1="0" y1="0" x2="1" y2="0">
          {nodes.map((node, i) => (
            <stop
              key={i}
              offset={`${(i / Math.max(nodes.length - 1, 1)) * 100}%`}
              stopColor={node.riskColor}
            />
          ))}
        </linearGradient>
        <filter id="ekg-glow">
          <feGaussianBlur stdDeviation="4" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Grid lines */}
      {[0.25, 0.5, 0.75].map((f) => (
        <line
          key={f}
          x1={30}
          y1={height * f}
          x2={width - 30}
          y2={height * f}
          stroke="rgba(255,255,255,0.04)"
          strokeWidth="1"
        />
      ))}

      {/* Glow path */}
      <motion.path
        d={d}
        fill="none"
        stroke="url(#ekg-gradient)"
        strokeWidth="6"
        opacity={0.2}
        filter="url(#ekg-glow)"
        initial={animated ? { pathLength: 0 } : undefined}
        animate={{ pathLength: 1 }}
        transition={{ duration: 2, ease: "easeInOut" }}
      />

      {/* Main path */}
      <motion.path
        d={d}
        fill="none"
        stroke="url(#ekg-gradient)"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={animated ? { pathLength: 0 } : undefined}
        animate={{ pathLength: 1 }}
        transition={{ duration: 2, ease: "easeInOut" }}
      />

      {/* Peak dots */}
      {dots.map((dot, i) => (
        <motion.circle
          key={i}
          cx={dot.x}
          cy={dot.y}
          r={5}
          fill={dot.node.riskColor}
          initial={animated ? { opacity: 0 } : undefined}
          animate={{ opacity: 0.9 }}
          transition={{ delay: 1.5 + i * 0.1, duration: 0.3 }}
          onMouseEnter={() => onHover?.(dot.node)}
          onMouseLeave={() => onHover?.(null)}
          className="cursor-pointer"
        />
      ))}
    </svg>
  );
}
