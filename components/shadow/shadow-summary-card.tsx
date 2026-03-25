"use client";

import { Card, CardContent } from "@/components/ui/card";
import { AlertTriangle, CheckCircle2, Clock, FileSearch } from "lucide-react";
import type { ShadowAnalysis } from "@/types";

interface ShadowSummaryCardProps {
  analysis: ShadowAnalysis;
}

export default function ShadowSummaryCard({ analysis }: ShadowSummaryCardProps) {
  const trustColor = analysis.overall_trust_score >= 80 ? "text-green-400"
    : analysis.overall_trust_score >= 50 ? "text-yellow-400"
    : analysis.overall_trust_score >= 20 ? "text-orange-400"
    : "text-red-400";

  return (
    <Card className="bg-gradient-to-br from-amber-500/5 to-orange-500/5 border-amber-500/15">
      <CardContent className="p-5">
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-xl bg-amber-500/10 flex-shrink-0">
            <FileSearch className="w-6 h-6 text-amber-400" />
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-white mb-2">Shadow Analysis Summary</h3>

            {/* Stats Row */}
            <div className="flex flex-wrap gap-4 mb-3">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />
                <span className="text-xs text-white/60">
                  {analysis.total_promises_found} promises
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-orange-400" />
                <span className="text-xs text-white/60">
                  {analysis.total_mismatches} mismatches
                </span>
              </div>
              {analysis.critical_mismatches > 0 && (
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-red-500" />
                  <span className="text-xs text-red-400">
                    {analysis.critical_mismatches} critical
                  </span>
                </div>
              )}
              <div className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-white/30" />
                <span className="text-xs text-white/40">
                  {analysis.evidence_sources.length} source{analysis.evidence_sources.length !== 1 ? "s" : ""}
                </span>
              </div>
            </div>

            {/* Summary */}
            {analysis.summary && (
              <p className="text-sm text-white/60 leading-relaxed">{analysis.summary}</p>
            )}

            {/* Trust Score Badge */}
            <div className="mt-3 flex items-center gap-2">
              <span className="text-xs text-white/40">Trust Score:</span>
              <span className={`text-sm font-bold ${trustColor}`}>
                {analysis.overall_trust_score}/100
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
