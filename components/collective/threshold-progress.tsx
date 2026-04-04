"use client";

import { motion } from "framer-motion";

interface Props {
  current: number;
  threshold: number;
}

export default function ThresholdProgress({ current, threshold }: Props) {
  const percentage = Math.min(100, Math.round((current / threshold) * 100));
  const isReached = current >= threshold;

  return (
    <div>
      <div className="flex items-center justify-between text-[10px] mb-1">
        <span className="text-white/40">
          {current}/{threshold} members
        </span>
        <span className={isReached ? "text-green-400" : "text-amber-400"}>
          {isReached
            ? "✓ Threshold reached"
            : `${threshold - current} more needed`}
        </span>
      </div>
      <div className="h-2 rounded-full bg-white/5 overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 1, ease: "easeOut" }}
          className={`h-full rounded-full ${
            isReached
              ? "bg-gradient-to-r from-green-500 to-emerald-500"
              : "bg-gradient-to-r from-amber-500 to-orange-500"
          }`}
        />
      </div>
    </div>
  );
}
