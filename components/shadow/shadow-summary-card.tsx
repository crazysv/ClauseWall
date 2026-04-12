"use client";

import { AlertTriangle, CheckCircle2, Clock, FileSearch } from "lucide-react";
import type { ShadowAnalysis } from "@/types";

interface ShadowSummaryCardProps {
  analysis: ShadowAnalysis;
}

export default function ShadowSummaryCard({
  analysis,
}: ShadowSummaryCardProps) {
  const trustColor =
    analysis.overall_trust_score >= 80
      ? "text-emerald-400 border-emerald-900/50 bg-emerald-950/20"
      : analysis.overall_trust_score >= 50
        ? "text-amber-400 border-amber-900/50 bg-amber-950/20"
        : analysis.overall_trust_score >= 20
          ? "text-amber-500 border-amber-900/50 bg-amber-950/20"
          : "text-red-400 border-red-900/50 bg-red-950/20";

  return (
    <div className="h-full p-5">
      <div className="flex flex-col gap-5">
        <div className="flex items-center gap-3 border-b border-neutral-800 pb-3">
          <div className="p-2 border border-amber-900/50 bg-amber-950/10 shrink-0">
            <FileSearch className="w-4 h-4 text-amber-500" />
          </div>
          <h3 className="text-[9px] font-mono uppercase tracking-widest text-neutral-200">
            ANALYSIS_SUMMARY
          </h3>
        </div>

        <div className="flex-1 min-w-0">
          {/* Stats Row */}
          <div className="flex flex-col gap-2 mb-5">
            <div className="flex items-center justify-between p-2.5 border border-emerald-900/50 bg-emerald-950/10">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-[8px] font-mono uppercase tracking-widest text-neutral-300">
                  PROMISES FOUND
                </span>
              </div>
              <span className="text-sm font-mono tabular-nums text-emerald-400">
                {analysis.total_promises_found}
              </span>
            </div>

            <div className="flex items-center justify-between p-2.5 border border-amber-900/50 bg-amber-950/10">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-[8px] font-mono uppercase tracking-widest text-neutral-300">
                  MISMATCHES
                </span>
              </div>
              <span className="text-sm font-mono tabular-nums text-amber-400">
                {analysis.total_mismatches}
              </span>
            </div>

            {analysis.critical_mismatches > 0 && (
              <div className="flex items-center justify-between p-2.5 border border-red-900/50 bg-red-950/20">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 border border-red-500 bg-red-500" />
                  <span className="text-[8px] font-mono uppercase tracking-widest text-red-400">
                    CRITICAL RISK
                  </span>
                </div>
                <span className="text-sm font-mono tabular-nums text-red-400">
                  {analysis.critical_mismatches}
                </span>
              </div>
            )}

            <div className="flex items-center justify-between p-2.5 border border-neutral-800 bg-[#050505]">
              <div className="flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-neutral-500" />
                <span className="text-[8px] font-mono uppercase tracking-widest text-neutral-400">
                  SOURCES CHECKED
                </span>
              </div>
              <span className="text-sm font-mono tabular-nums text-neutral-300">
                {analysis.evidence_sources.length}
              </span>
            </div>
          </div>

          {/* Summary */}
          {analysis.summary && (
            <div className="p-3 border border-dashed border-neutral-800 bg-[#050505] mb-5">
              <p className="text-[8px] font-mono text-neutral-500 leading-relaxed">
                {analysis.summary}
              </p>
            </div>
          )}

          {/* Trust Score Badge */}
          <div className="flex items-center justify-between pt-3 border-t border-neutral-800">
            <span className="text-[8px] font-mono uppercase tracking-widest text-neutral-600">
              TRUST SCORE:
            </span>
            <span
              className={`text-sm font-mono uppercase tracking-widest px-2 py-0.5 border ${trustColor}`}
            >
              {analysis.overall_trust_score}/100
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
