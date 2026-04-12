"use client";

import { motion } from "framer-motion";
import type { FairComparisonResult } from "@/lib/simulation/types";
import { formatINRCompact } from "@/lib/simulation/formatters";

interface Props {
  comparison: FairComparisonResult;
}

export default function FairComparisonBar({ comparison }: Props) {
  const maxVal = Math.max(comparison.currentP90, comparison.fairP90, 1);
  const currentWidth = (comparison.currentP90 / maxVal) * 100;
  const fairWidth = (comparison.fairP90 / maxVal) * 100;

  return (
    <div className="space-y-6">
      {/* Current contract bar */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-mono uppercase tracking-widest text-red-500 bg-red-950/20 px-2 py-1 border border-red-900/50 rounded-sm">
            [THIS CONTRACT]
          </span>
          <span className="text-[10px] font-mono text-red-500">
            {formatINRCompact(comparison.currentP90)}
          </span>
        </div>
        <div className="w-full h-4 bg-[#0a0a0a] border border-neutral-800 border-dashed overflow-hidden rounded-sm relative">
          <motion.div
            className="absolute top-0 left-0 bottom-0 bg-red-500/80 border-r border-red-400"
            initial={{ width: 0 }}
            animate={{ width: `${currentWidth}%` }}
            transition={{ duration: 1, delay: 0.2 }}
          />
        </div>
      </div>

      {/* Fair contract bar */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-mono uppercase tracking-widest text-emerald-500 bg-emerald-950/20 px-2 py-1 border border-emerald-900/50 rounded-sm">
            [FAIR CONTRACT]
          </span>
          <span className="text-[10px] font-mono text-emerald-500">
            {formatINRCompact(comparison.fairP90)}
          </span>
        </div>
        <div className="w-full h-4 bg-[#0a0a0a] border border-neutral-800 border-dashed overflow-hidden rounded-sm relative">
          <motion.div
            className="absolute top-0 left-0 bottom-0 bg-emerald-500/80 border-r border-emerald-400"
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
          className="p-4 bg-orange-950/20 border border-orange-900/50 text-center rounded-sm"
        >
          <p className="text-[10px] font-mono uppercase tracking-widest text-orange-500">
            [PREDATORY PREMIUM:{" "}
            {formatINRCompact(comparison.totalPredatoryPremium)}]
            <span className="text-orange-600/70 ml-2">
              // {Math.round(comparison.excessPercent)}% EXCESS RISK
            </span>
          </p>
        </motion.div>
      )}
    </div>
  );
}
