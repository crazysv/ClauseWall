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
        stroke: "#16a34a",
        glow: "transparent",
        label: "PROMISES MOSTLY KEPT",
        labelColor:
          "text-green-700 bg-green-100 border-2 border-green-600 block px-2 py-1 mt-2",
      };
    if (s >= 50)
      return {
        stroke: "#ca8a04",
        glow: "transparent",
        label: "SOME PROMISES BROKEN",
        labelColor:
          "text-yellow-700 bg-yellow-100 border-2 border-yellow-500 block px-2 py-1 mt-2",
      };
    if (s >= 20)
      return {
        stroke: "#ea580c",
        glow: "transparent",
        label: "MANY PROMISES BROKEN",
        labelColor:
          "text-orange-700 bg-orange-100 border-2 border-orange-500 block px-2 py-1 mt-2",
      };
    return {
      stroke: "#dc2626",
      glow: "transparent",
      label: "MOST PROMISES CONTRADICTED",
      labelColor:
        "text-red-700 bg-red-100 border-2 border-red-600 block px-2 py-1 mt-2",
    };
  };

  const { stroke, label, labelColor } = getColor(score);

  // SVG circle math
  const radius = 50;
  const circumference = 2 * Math.PI * radius;
  const progress = ((100 - score) / 100) * circumference;

  return (
    <div className="flex flex-col items-center justify-center p-6 bg-white w-full">
      <div className="relative w-40 h-40">
        <svg
          className="w-full h-full -rotate-90 drop-shadow-[4px_4px_0px_rgba(0,0,0,1)]"
          viewBox="0 0 120 120"
        >
          {/* Background circle */}
          <circle
            cx="60"
            cy="60"
            r={radius}
            fill="#f3f4f6"
            stroke="#000000"
            strokeWidth="8"
          />
          {/* Progress circle */}
          <motion.circle
            cx="60"
            cy="60"
            r={radius}
            fill="none"
            stroke={stroke}
            strokeWidth="10"
            strokeLinecap="square"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: progress }}
            transition={{ duration: 1.5, ease: "easeOut" }}
          />
          {/* Inner ring for border effect */}
          <circle
            cx="60"
            cy="60"
            r={radius - 4}
            fill="none"
            stroke="#000000"
            strokeWidth="2"
          />
        </svg>

        {/* Center text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pt-2">
          <motion.span
            className="text-4xl font-black text-black"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5, duration: 0.5 }}
          >
            {score}
          </motion.span>
          <span className="text-[10px] font-black uppercase tracking-widest text-black/60 bg-gray-200 mt-1 px-1">
            Trust Score
          </span>
        </div>
      </div>

      <div className="mt-6 text-center w-full">
        <span
          className={`text-xs font-black uppercase tracking-widest ${labelColor}`}
        >
          {label}
        </span>
        <p className="text-xs font-bold uppercase tracking-widest text-black/60 mt-3 p-2 border-2 border-black border-dashed bg-gray-50">
          <strong className="text-black">{totalMismatches}</strong> of{" "}
          <strong className="text-black">{totalPromises}</strong> promises
          don&apos;t match contract
        </p>
      </div>
    </div>
  );
}
