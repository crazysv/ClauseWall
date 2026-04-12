"use client";

import { motion } from "framer-motion";
import type {
  SimulationStatistics,
  PercentileData,
} from "@/lib/simulation/types";
import { formatINRCompact } from "@/lib/simulation/formatters";

interface Props {
  statistics: SimulationStatistics;
  percentiles: PercentileData;
}

export default function ProbabilityCallouts({
  statistics,
  percentiles,
}: Props) {
  const callouts: {
    icon: string;
    text: string;
    type: "warning" | "danger" | "safe";
  }[] = [];

  // "X% chance of zero cost"
  if (statistics.zeroLossPercent > 0) {
    callouts.push({
      icon: "✅",
      text: `${Math.round(statistics.zeroLossPercent)}% chance of zero additional cost (nothing goes wrong)`,
      type: "safe",
    });
  }

  // "X% chance > P75"
  const pctAboveP75 = 25; // by definition
  if (percentiles.p75 > 0) {
    callouts.push({
      icon: "⚠️",
      text: `${pctAboveP75}% chance this contract costs you more than ${formatINRCompact(percentiles.p75)}`,
      type: "warning",
    });
  }

  // "X% chance > P90"
  if (percentiles.p90 > 0) {
    callouts.push({
      icon: "🔴",
      text: `10% chance it costs more than ${formatINRCompact(percentiles.p90)}`,
      type: "danger",
    });
  }

  // "X% chance > P95"
  if (percentiles.p95 > 0 && percentiles.p95 !== percentiles.p90) {
    callouts.push({
      icon: "🔴",
      text: `5% chance it costs more than ${formatINRCompact(percentiles.p95)}`,
      type: "danger",
    });
  }

  if (callouts.length === 0) return null;

  const typeStyles = {
    safe: "bg-emerald-950/20 border-emerald-900/50 text-emerald-500",
    warning: "bg-amber-950/20 border-amber-900/50 text-amber-500",
    danger: "bg-red-950/20 border-red-900/50 text-red-500",
  };

  return (
    <div className="space-y-4 mt-6">
      {callouts.map((callout, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.1 }}
          className={`px-4 py-3 border ${typeStyles[callout.type]} flex items-center justify-start gap-3 rounded-sm`}
        >
          <span className="text-sm bg-[#050505] border border-[currentColor] p-1.5 opacity-80 rounded-sm">
            {callout.icon}
          </span>
          <p className="text-[10px] font-mono uppercase tracking-widest leading-snug">
            [{callout.text}]
          </p>
        </motion.div>
      ))}
    </div>
  );
}
