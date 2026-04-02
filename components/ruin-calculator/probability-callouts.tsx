"use client";

import { motion } from "framer-motion";
import type { SimulationStatistics, PercentileData } from "@/lib/simulation/types";
import { formatINRCompact } from "@/lib/simulation/formatters";

interface Props {
  statistics: SimulationStatistics;
  percentiles: PercentileData;
}

export function ProbabilityCallouts({ statistics, percentiles }: Props) {
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
    safe: "bg-green-500/5 border-green-500/15 text-green-400",
    warning: "bg-yellow-500/5 border-yellow-500/15 text-yellow-400",
    danger: "bg-red-500/5 border-red-500/15 text-red-400",
  };

  return (
    <div className="space-y-2">
      {callouts.map((callout, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.1 }}
          className={`p-3 rounded-xl border ${typeStyles[callout.type]}`}
        >
          <p className="text-sm">
            {callout.icon}{" "}
            <span className="text-slate-900 dark:text-slate-100/70">{callout.text}</span>
          </p>
        </motion.div>
      ))}
    </div>
  );
}
