"use client";

import { motion } from "framer-motion";

interface TrustScoreGaugeProps {
  score: number;
  totalPromises: number;
  totalMismatches: number;
}

export default function TrustScoreGauge({
  score,
  totalPromises,
  totalMismatches,
}: TrustScoreGaugeProps) {
  const getColor = (s: number) => {
    if (s >= 80)
      return {
        stroke: "#22c55e",
        label: "PROMISES MOSTLY KEPT",
        labelColor:
          "text-emerald-400 bg-emerald-950/20 border border-emerald-900/50",
      };
    if (s >= 50)
      return {
        stroke: "#eab308",
        label: "SOME PROMISES BROKEN",
        labelColor:
          "text-amber-400 bg-amber-950/20 border border-amber-900/50",
      };
    if (s >= 20)
      return {
        stroke: "#f97316",
        label: "MANY PROMISES BROKEN",
        labelColor:
          "text-amber-500 bg-amber-950/20 border border-amber-900/50",
      };
    return {
      stroke: "#ef4444",
      label: "MOST PROMISES CONTRADICTED",
      labelColor: "text-red-400 bg-red-950/20 border border-red-900/50",
    };
  };

  const { stroke, label, labelColor } = getColor(score);

  // SVG circle math
  const radius = 50;
  const circumference = 2 * Math.PI * radius;
  const progress = ((100 - score) / 100) * circumference;

  return (
    <div className="flex flex-col items-center justify-center p-6 w-full">
      <div className="relative w-40 h-40">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
          {/* Background circle */}
          <circle
            cx="60"
            cy="60"
            r={radius}
            fill="#0a0a0a"
            stroke="#262626"
            strokeWidth="6"
          />
          {/* Progress circle */}
          <motion.circle
            cx="60"
            cy="60"
            r={radius}
            fill="none"
            stroke={stroke}
            strokeWidth="8"
            strokeLinecap="square"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: progress }}
            transition={{ duration: 1.5, ease: "easeOut" }}
          />
          {/* Inner ring */}
          <circle
            cx="60"
            cy="60"
            r={radius - 4}
            fill="none"
            stroke="#171717"
            strokeWidth="1"
          />
        </svg>

        {/* Center text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pt-2">
          <motion.span
            className="text-3xl font-mono tabular-nums text-neutral-200"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5, duration: 0.5 }}
          >
            {score}
          </motion.span>
          <span className="text-[7px] font-mono uppercase tracking-widest text-neutral-600 mt-1">
            TRUST SCORE
          </span>
        </div>
      </div>

      <div className="mt-5 text-center w-full">
        <span
          className={`text-[8px] font-mono uppercase tracking-widest px-2 py-1 block ${labelColor}`}
        >
          {label}
        </span>
        <p className="text-[8px] font-mono uppercase tracking-widest text-neutral-600 mt-3 p-2 border border-dashed border-neutral-800 bg-[#050505]">
          <strong className="text-neutral-300">{totalMismatches}</strong> OF{" "}
          <strong className="text-neutral-300">{totalPromises}</strong> PROMISES
          DON&apos;T MATCH CONTRACT
        </p>
      </div>
    </div>
  );
}
