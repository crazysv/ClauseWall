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
          <span className="text-xs font-black uppercase tracking-widest text-red-600 bg-red-100 px-2 py-1 border-2 border-red-600 shadow-[2px_2px_0px_0px_rgba(220,38,38,1)]">
            This Contract
          </span>
          <span className="text-sm font-black text-red-600">
            {formatINRCompact(comparison.currentP90)}
          </span>
        </div>
        <div className="w-full h-8 bg-gray-100 border-4 border-black border-dashed overflow-hidden shadow-[inset_4px_4px_0px_0px_rgba(0,0,0,0.1)]">
          <motion.div
            className="h-full bg-red-500 border-r-4 border-black"
            initial={{ width: 0 }}
            animate={{ width: `${currentWidth}%` }}
            transition={{ duration: 1, delay: 0.2 }}
          />
        </div>
      </div>

      {/* Fair contract bar */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-black uppercase tracking-widest text-green-700 bg-green-100 px-2 py-1 border-2 border-green-600 shadow-[2px_2px_0px_0px_rgba(22,163,74,1)]">
            Fair Contract
          </span>
          <span className="text-sm font-black text-green-600">
            {formatINRCompact(comparison.fairP90)}
          </span>
        </div>
        <div className="w-full h-8 bg-gray-100 border-4 border-black border-dashed overflow-hidden shadow-[inset_4px_4px_0px_0px_rgba(0,0,0,0.1)]">
          <motion.div
            className="h-full bg-green-500 border-r-4 border-black"
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
          className="p-4 bg-orange-100 border-4 border-orange-500 text-center shadow-[4px_4px_0px_0px_rgba(249,115,22,1)]"
        >
          <p className="text-sm font-black uppercase tracking-widest text-orange-600">
            PREDATORY PREMIUM:{" "}
            {formatINRCompact(comparison.totalPredatoryPremium)}{" "}
            <span className="text-orange-900 ml-2">
              ({Math.round(comparison.excessPercent)}% excess risk)
            </span>
          </p>
        </motion.div>
      )}
    </div>
  );
}
