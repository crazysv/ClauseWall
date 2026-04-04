"use client";

import { Card, CardContent } from "@/components/ui/card";
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
      ? "text-green-600 border-green-600 bg-green-100"
      : analysis.overall_trust_score >= 50
        ? "text-yellow-700 border-yellow-500 bg-yellow-100"
        : analysis.overall_trust_score >= 20
          ? "text-orange-700 border-orange-500 bg-orange-100"
          : "text-red-700 border-red-600 bg-red-100";

  return (
    <div className="h-full p-6">
      <div className="flex flex-col gap-6">
        <div className="flex items-center gap-3 border-b-4 border-black pb-4">
          <div className="p-2 border-2 border-black bg-black shrink-0">
            <FileSearch className="w-8 h-8 text-white" />
          </div>
          <h3 className="text-xl font-black uppercase tracking-widest text-black">
            Analysis Summary
          </h3>
        </div>

        <div className="flex-1 min-w-0">
          {/* Stats Row */}
          <div className="flex flex-col gap-3 mb-6">
            <div className="flex items-center justify-between p-2 border-2 border-black bg-green-50">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
                <span className="text-sm font-black uppercase tracking-widest text-black">
                  Promises Found
                </span>
              </div>
              <span className="text-lg font-black text-black">
                {analysis.total_promises_found}
              </span>
            </div>

            <div className="flex items-center justify-between p-2 border-2 border-black bg-orange-50">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-orange-600" />
                <span className="text-sm font-black uppercase tracking-widest text-black">
                  Mismatches
                </span>
              </div>
              <span className="text-lg font-black text-black">
                {analysis.total_mismatches}
              </span>
            </div>

            {analysis.critical_mismatches > 0 && (
              <div className="flex items-center justify-between p-2 border-2 border-black bg-red-100">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 border-2 border-black bg-red-600" />
                  <span className="text-sm font-black uppercase tracking-widest text-red-700">
                    Critical Risk
                  </span>
                </div>
                <span className="text-lg font-black text-red-700">
                  {analysis.critical_mismatches}
                </span>
              </div>
            )}

            <div className="flex items-center justify-between p-2 border-2 border-black bg-gray-50">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-gray-600" />
                <span className="text-sm font-black uppercase tracking-widest text-black">
                  Sources Checked
                </span>
              </div>
              <span className="text-lg font-black text-black">
                {analysis.evidence_sources.length}
              </span>
            </div>
          </div>

          {/* Summary */}
          {analysis.summary && (
            <div className="p-4 border-2 border-black border-dashed bg-white mb-6">
              <p className="text-sm font-bold uppercase tracking-widest leading-relaxed text-black/80">
                {analysis.summary}
              </p>
            </div>
          )}

          {/* Trust Score Badge */}
          <div className="flex items-center justify-between pt-4 border-t-2 border-black">
            <span className="text-sm font-black uppercase tracking-widest text-black/60">
              Trust Score:
            </span>
            <span
              className={`text-xl font-black uppercase tracking-widest px-3 py-1 border-2 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] ${trustColor}`}
            >
              {analysis.overall_trust_score}/100
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
