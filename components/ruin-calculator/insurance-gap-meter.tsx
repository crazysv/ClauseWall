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
          <span className="text-xs font-black uppercase tracking-widest text-red-700 bg-red-100 px-2 py-1">
            Total Exposure
          </span>
          <span className="text-sm font-black text-red-600">
            {formatINRCompact(gap.totalExposure)}
          </span>
        </div>
        <div className="w-full h-8 bg-gray-100 border-4 border-black border-dashed overflow-hidden shadow-[inset_4px_4px_0px_0px_rgba(0,0,0,0.1)]">
          <div className="h-full w-full bg-red-500 border-r-4 border-black" />
        </div>
        <p className="text-xs font-bold uppercase tracking-widest text-black/50 mt-2">
          100%
        </p>
      </div>

      {/* Coverage */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-black uppercase tracking-widest text-green-700 bg-green-100 px-2 py-1">
            Your Coverage
          </span>
          <div className="flex items-center gap-4">
            <span className="text-sm font-black text-green-600">
              {formatINRCompact(gap.userCoverage)}
            </span>
            <input
              type="text"
              value={inputValue}
              onChange={(e) => handleChange(e.target.value)}
              placeholder="Enter ₹"
              className="w-28 px-3 py-2 bg-white border-4 border-black text-sm font-bold text-black focus:outline-none focus:ring-0 focus:border-green-600 transition-colors"
            />
          </div>
        </div>
        <div className="w-full h-8 bg-gray-100 border-4 border-black border-dashed overflow-hidden shadow-[inset_4px_4px_0px_0px_rgba(0,0,0,0.1)]">
          <motion.div
            className="h-full bg-green-500 border-r-4 border-black"
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(100, gap.coveragePercent)}%` }}
            transition={{ duration: 0.8 }}
          />
        </div>
        <p className="text-xs font-bold uppercase tracking-widest text-black/50 mt-2">
          {Math.round(gap.coveragePercent)}%
        </p>
      </div>

      {/* Gap warning */}
      {gap.gap > 0 && (
        <div className="card-impact p-4 bg-yellow-100 border-4 border-yellow-500 shadow-[4px_4px_0px_0px_rgba(234,179,8,1)] text-center">
          <p className="text-sm font-black uppercase tracking-widest text-yellow-700">
            ⚠️ UNCOVERED GAP: <strong>{formatINRCompact(gap.gap)}</strong>{" "}
            <span className="text-yellow-900 ml-2">
              ({Math.round(gap.gapPercent)}%)
            </span>
          </p>
        </div>
      )}

      {/* Recommendations */}
      {gap.recommendations.length > 0 && (
        <div className="space-y-3 mt-6 border-t-4 border-black pt-6">
          <p className="text-xs font-black uppercase tracking-widest text-black">
            Recommended Policies:
          </p>
          {gap.recommendations.map((rec, i) => (
            <div
              key={i}
              className="flex items-center justify-between p-4 bg-white border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-y-1 hover:shadow-[0px_0px_0px_0px_rgba(0,0,0,1)] transition-all"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-black uppercase tracking-widest text-black">
                  {rec.product}
                </p>
                <p className="text-xs font-bold uppercase tracking-widest text-black/60 mt-1">
                  {rec.relevance}
                </p>
              </div>
              <div className="text-right flex-shrink-0 ml-4 pl-4 border-l-4 border-black">
                <p className="text-sm font-black text-green-600 bg-green-100 px-2 py-1 mb-1 inline-block border-2 border-green-600">
                  {rec.annualCost}
                </p>
                <p className="text-xs font-bold uppercase tracking-widest text-black/50 block">
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
