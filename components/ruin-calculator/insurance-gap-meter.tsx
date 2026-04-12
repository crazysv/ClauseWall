"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import type { InsuranceGapResult } from "@/lib/simulation/types";
import { formatINRCompact } from "@/lib/simulation/formatters";

interface Props {
  gap: InsuranceGapResult;
  onCoverageChange: (coverage: number) => void;
}

export default function InsuranceGapMeter({ gap, onCoverageChange }: Props) {
  const [inputValue, setInputValue] = useState(
    gap.userCoverage > 0 ? String(gap.userCoverage) : "",
  );

  const handleChange = (value: string) => {
    setInputValue(value);
    const num = parseInt(value.replace(/[^\d]/g, ""), 10);
    if (!isNaN(num) && num >= 0) {
      onCoverageChange(num);
    } else if (value === "") {
      onCoverageChange(0);
    }
  };

  return (
    <div className="space-y-8">
      {/* Total exposure */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-mono uppercase tracking-widest text-red-500 bg-red-950/20 border border-red-900/50 px-2 py-1 rounded-sm">
            [TOTAL EXPOSURE]
          </span>
          <span className="text-[10px] font-mono text-red-500">
            {formatINRCompact(gap.totalExposure)}
          </span>
        </div>
        <div className="w-full h-4 bg-[#0a0a0a] border border-neutral-800 border-dashed overflow-hidden rounded-sm">
          <div className="h-full w-full bg-red-500/80 border-r border-red-400" />
        </div>
        <p className="text-[9px] font-mono uppercase tracking-widest text-neutral-500 mt-2">
          100%
        </p>
      </div>

      {/* Coverage */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-mono uppercase tracking-widest text-emerald-500 bg-emerald-950/20 border border-emerald-900/50 px-2 py-1 rounded-sm">
            [YOUR COVERAGE]
          </span>
          <div className="flex items-center gap-4">
            <span className="text-[10px] font-mono text-emerald-500">
              {formatINRCompact(gap.userCoverage)}
            </span>
            <input
              type="text"
              value={inputValue}
              onChange={(e) => handleChange(e.target.value)}
              placeholder="ENTER ₹"
              className="w-28 px-3 py-1.5 bg-[#0a0a0a] border border-neutral-800 text-[10px] font-mono text-white focus:outline-none focus:ring-1 focus:ring-emerald-500/50 transition-colors rounded-sm"
            />
          </div>
        </div>
        <div className="w-full h-4 bg-[#0a0a0a] border border-neutral-800 border-dashed overflow-hidden rounded-sm relative">
          <motion.div
            className="absolute top-0 left-0 bottom-0 bg-emerald-500/80 border-r border-emerald-400"
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(100, gap.coveragePercent)}%` }}
            transition={{ duration: 0.8 }}
          />
        </div>
        <p className="text-[9px] font-mono uppercase tracking-widest text-neutral-500 mt-2">
          {Math.round(gap.coveragePercent)}%
        </p>
      </div>

      {/* Gap warning */}
      {gap.gap > 0 && (
        <div className="p-4 bg-amber-950/20 border border-amber-900/50 text-center rounded-sm">
          <p className="text-[10px] font-mono uppercase tracking-widest text-amber-500">
            [WARNING] // UNCOVERED GAP: <strong>{formatINRCompact(gap.gap)}</strong>{" "}
            <span className="text-amber-600/70 ml-2">
              ({Math.round(gap.gapPercent)}%)
            </span>
          </p>
        </div>
      )}

      {/* Recommendations */}
      {gap.recommendations.length > 0 && (
        <div className="space-y-3 mt-6 border-t border-neutral-800 pt-6">
          <p className="text-[9px] font-mono uppercase tracking-widest text-neutral-400">
            [RECOMMENDED POLICIES]:
          </p>
          {gap.recommendations.map((rec, i) => (
            <div
              key={i}
              className="flex items-center justify-between p-4 bg-[#050505] border border-neutral-900 hover:border-neutral-700 transition-colors rounded-sm"
            >
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-mono uppercase tracking-widest text-neutral-300">
                  {rec.product}
                </p>
                <p className="text-[9px] font-mono uppercase tracking-widest text-neutral-500 mt-1">
                  {rec.relevance}
                </p>
              </div>
              <div className="text-right flex-shrink-0 ml-4 pl-4 border-l border-neutral-800">
                <p className="text-[10px] font-mono text-emerald-500 bg-emerald-950/20 px-2 py-1 mb-1 inline-block border border-emerald-900/50 rounded-sm">
                  {rec.annualCost}
                </p>
                <p className="text-[9px] font-mono uppercase tracking-widest text-neutral-500 block">
                  COVERS {rec.coverageAmount}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
