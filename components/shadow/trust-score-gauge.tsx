"use client";

import { motion } from "framer-motion";

interface TrustScoreGaugeProps {
  score: number;
  totalPromises: number;
  totalMismatches: number;
}

export default function TrustScoreGauge({ score, totalPromises, totalMismatches }: TrustScoreGaugeProps) {
  const getColor = (s: number) => {
    if (s >= 80) return { stroke: "#22c55e", glow: "rgba(34, 197, 94, 0.3)", label: "Promises Mostly Kept", labelColor: "text-green-400" };
    if (s >= 50) return { stroke: "#eab308", glow: "rgba(234, 179, 8, 0.3)", label: "Some Promises Broken", labelColor: "text-yellow-400" };
    if (s >= 20) return { stroke: "#f97316", glow: "rgba(249, 115, 22, 0.3)", label: "Many Promises Broken", labelColor: "text-orange-400" };
    return { stroke: "#ef4444", glow: "rgba(239, 68, 68, 0.3)", label: "Most Promises Contradicted", labelColor: "text-red-400" };
  };

  const { stroke, glow, label, labelColor } = getColor(score);

  // SVG circle math
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const progress = ((100 - score) / 100) * circumference; // Invert for trust (100 = full)

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-36 h-36">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
          {/* Background circle */}
          <circle
            cx="60"
            cy="60"
            r={radius}
            fill="none"
            stroke="rgba(255,255,255,0.05)"
            strokeWidth="8"
          />
          {/* Progress circle */}
          <motion.circle
            cx="60"
            cy="60"
            r={radius}
            fill="none"
            stroke={stroke}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: progress }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            style={{ filter: `drop-shadow(0 0 6px ${glow})` }}
          />
        </svg>

        {/* Center text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.span
            className="text-3xl font-bold"
            style={{ color: stroke }}
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5, duration: 0.5 }}
          >
            {score}
          </motion.span>
          <span className="text-[10px] text-white/40 uppercase tracking-wider">Trust Score</span>
        </div>
      </div>

      <p className={`text-sm font-medium mt-2 ${labelColor}`}>{label}</p>
      <p className="text-xs text-white/40 mt-1">
        {totalMismatches} of {totalPromises} promises don&apos;t match contract
      </p>
    </div>
  );
}
