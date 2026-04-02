"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import type { InsuranceGapResult } from "@/lib/simulation/types";
import { formatINRCompact } from "@/lib/simulation/formatters";

interface Props {
  gap: InsuranceGapResult;
  onCoverageChange: (coverage: number) => void;
}

export function InsuranceGapMeter({ gap, onCoverageChange }: Props) {
  const [inputValue, setInputValue] = useState(
    gap.userCoverage > 0 ? String(gap.userCoverage) : ""
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
    <div className="space-y-4">
      {/* Total exposure */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs text-slate-900 dark:text-slate-100/40 font-medium">
            Total Exposure
          </span>
          <span className="text-sm font-bold text-red-400">
            {formatINRCompact(gap.totalExposure)}
          </span>
        </div>
        <div className="w-full h-4 bg-red-500/10 rounded-full overflow-hidden border border-red-500/20">
          <div className="h-full w-full bg-gradient-to-r from-red-500/40 to-red-500/20 rounded-full" />
        </div>
        <p className="text-[10px] text-slate-900 dark:text-slate-100/20 mt-0.5">100%</p>
      </div>

      {/* Coverage */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs text-slate-900 dark:text-slate-100/40 font-medium">
            Your Coverage
          </span>
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-green-400">
              {formatINRCompact(gap.userCoverage)}
            </span>
            <input
              type="text"
              value={inputValue}
              onChange={(e) => handleChange(e.target.value)}
              placeholder="Enter ₹"
              className="w-24 px-2 py-1 rounded-full bg-indigo-50/50 border border-white/10 text-xs text-slate-900 dark:text-slate-100 text-right focus:outline-none focus:ring-1 focus:ring-white/20"
            />
          </div>
        </div>
        <div className="w-full h-4 bg-indigo-50/50 rounded-full overflow-hidden border border-white/10">
          <motion.div
            className="h-full bg-gradient-to-r from-green-500/60 to-green-500/30 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(100, gap.coveragePercent)}%` }}
            transition={{ duration: 0.8 }}
          />
        </div>
        <p className="text-[10px] text-slate-900 dark:text-slate-100/20 mt-0.5">
          {Math.round(gap.coveragePercent)}%
        </p>
      </div>

      {/* Gap warning */}
      {gap.gap > 0 && (
        <Card className="bg-yellow-500/5 border-yellow-500/15">
          <CardContent className="p-3">
            <p className="text-xs text-yellow-400 font-medium">
              ⚠️ UNCOVERED GAP:{" "}
              <strong>{formatINRCompact(gap.gap)}</strong>{" "}
              ({Math.round(gap.gapPercent)}%)
            </p>
          </CardContent>
        </Card>
      )}

      {/* Recommendations */}
      {gap.recommendations.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs text-slate-900 dark:text-slate-100/40 font-medium">Recommended:</p>
          {gap.recommendations.map((rec, i) => (
            <div
              key={i}
              className="flex items-center justify-between p-2.5 rounded-xl bg-white dark:bg-card/[0.02] border border-white/5"
            >
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-slate-900 dark:text-slate-100/70">
                  {rec.product}
                </p>
                <p className="text-[10px] text-slate-900 dark:text-slate-100/30">{rec.relevance}</p>
              </div>
              <div className="text-right flex-shrink-0 ml-3">
                <p className="text-xs text-green-400 font-medium">
                  {rec.annualCost}
                </p>
                <p className="text-[10px] text-slate-900 dark:text-slate-100/20">
                  covers {rec.coverageAmount}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
