"use client";

import { motion } from "framer-motion";
import type { FairComparisonResult } from "@/lib/simulation/types";
import { formatINRCompact } from "@/lib/simulation/formatters";

interface Props {
  comparison: FairComparisonResult;
}

export function FairComparisonBar({ comparison }: Props) {
  const maxVal = Math.max(comparison.currentP90, comparison.fairP90, 1);
  const currentWidth = (comparison.currentP90 / maxVal) * 100;
  const fairWidth = (comparison.fairP90 / maxVal) * 100;

  return (
    <div className="space-y-4">
      {/* Current contract bar */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs text-red-400 font-medium uppercase tracking-wider">
            This Contract
          </span>
          <span className="text-sm font-bold text-red-400">
            {formatINRCompact(comparison.currentP90)}
          </span>
        </div>
        <div className="w-full h-6 bg-indigo-50/50 rounded-full overflow-hidden">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-red-500/60 to-red-500/40"
            initial={{ width: 0 }}
            animate={{ width: `${currentWidth}%` }}
            transition={{ duration: 1, delay: 0.2 }}
          />
        </div>
      </div>

      {/* Fair contract bar */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs text-green-400 font-medium uppercase tracking-wider">
            Fair Contract
          </span>
          <span className="text-sm font-bold text-green-400">
            {formatINRCompact(comparison.fairP90)}
          </span>
        </div>
        <div className="w-full h-6 bg-indigo-50/50 rounded-full overflow-hidden">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-green-500/60 to-green-500/40"
            initial={{ width: 0 }}
            animate={{ width: `${fairWidth}%` }}
            transition={{ duration: 1, delay: 0.4 }}
          />
        </div>
      </div>

      {/* Premium callout */}
      {comparison.totalPredatoryPremium > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="p-3 rounded-xl bg-orange-500/5 border border-orange-500/15 text-center"
        >
          <p className="text-sm text-orange-400 font-semibold">
            PREDATORY PREMIUM:{" "}
            {formatINRCompact(comparison.totalPredatoryPremium)}{" "}
            <span className="text-slate-900 dark:text-slate-100/40">
              ({Math.round(comparison.excessPercent)}% excess risk)
            </span>
          </p>
        </motion.div>
      )}
    </div>
  );
}
