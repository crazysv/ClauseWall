"use client";

import { Card, CardContent } from "@/components/ui/card";
import { AlertTriangle, CheckCircle2, Clock, FileSearch } from "lucide-react";
import type { ShadowAnalysis } from "@/types";

interface ShadowSummaryCardProps {
  analysis: ShadowAnalysis;
}

export function ShadowSummaryCard({ analysis }: ShadowSummaryCardProps) {
  const trustColor = analysis.overall_trust_score >= 80 ? "text-emerald-700"
    : analysis.overall_trust_score >= 50 ? "text-amber-600"
    : analysis.overall_trust_score >= 20 ? "text-orange-600"
    : "text-red-700";

  return (
    <Card className="bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50 border-amber-200 shadow-sm dark:shadow-slate-900/20 rounded-2xl relative overflow-hidden">
      <div className="absolute -top-1/2 -right-1/2 w-full h-full bg-white dark:bg-slate-900/40 rounded-full blur-3xl pointer-events-none" />
      <CardContent className="p-6 relative z-10">
        <div className="flex items-start gap-4">
          <div className="p-3.5 rounded-xl bg-amber-100 flex-shrink-0 shadow-sm dark:shadow-slate-900/20 border border-amber-200">
            <FileSearch className="w-6 h-6 text-amber-600" />
          </div>

          <div className="flex-1 min-w-0 pr-2">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-900 dark:text-slate-100 mb-3 block">Shadow Analysis Summary</h3>

            {/* Stats Row */}
            <div className="flex flex-wrap gap-4 mb-4">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
                  {analysis.total_promises_found} promises
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
                  {analysis.total_mismatches} mismatches
                </span>
              </div>
              {analysis.critical_mismatches > 0 && (
                <div className="flex items-center gap-1.5 bg-red-100/50 px-2 py-0.5 rounded-md border border-red-200">
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                  <span className="text-[10px] font-bold uppercase tracking-widest text-red-700">
                    {analysis.critical_mismatches} critical
                  </span>
                </div>
              )}
              <div className="flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-slate-400" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
                  {analysis.evidence_sources.length} source{analysis.evidence_sources.length !== 1 ? "s" : ""}
                </span>
              </div>
            </div>

            {/* Summary */}
            {analysis.summary && (
              <p className="text-sm text-slate-700 font-medium leading-relaxed bg-white dark:bg-card/50 p-4 rounded-xl border border-white/60 shadow-inner backdrop-blur-sm">{analysis.summary}</p>
            )}

            {/* Trust Score Badge */}
            <div className="mt-4 flex items-center gap-2 bg-white dark:bg-card px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm dark:shadow-slate-900/20 inline-flex">
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Trust Score:</span>
              <span className={`text-sm font-black ${trustColor}`}>
                {analysis.overall_trust_score}/100
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
