"use client";

import Link from "next/link";
import { FileSearch, AlertTriangle, ArrowRight } from "lucide-react";

interface ShadowCTAProps {
  documentId: string;
  shadowData?: {
    trust_score?: number;
    total_mismatches?: number;
    critical_mismatches?: number;
    has_analysis?: boolean;
  } | null;
}

export default function ShadowCTA({ documentId, shadowData }: ShadowCTAProps) {
  const hasAnalysis = shadowData?.has_analysis;
  const hasCritical = (shadowData?.critical_mismatches ?? 0) > 0;

  return (
    <Link
      href={`/shadow/${documentId}`}
      className="block px-3 py-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 hover:bg-amber-500/15 transition-colors"
    >
      <div className="flex items-center gap-3">
        <FileSearch className="w-4 h-4 text-amber-400 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-[12px] font-semibold text-amber-400">
            {hasAnalysis
              ? `Shadow Clause: ${shadowData?.total_mismatches ?? 0} found`
              : "Shadow Agreement Detector"}
          </p>
          <p className="text-[10px] text-[#a3a3a3] mt-0.5">
            {hasAnalysis ? (
              <span className="flex items-center gap-1">
                {hasCritical && (
                  <AlertTriangle className="w-3 h-3 text-red-400 inline" />
                )}
                Trust: {shadowData?.trust_score ?? "?"}/100
                {hasCritical &&
                  ` • ${shadowData?.critical_mismatches} critical`}
              </span>
            ) : (
              "Check if verbal promises match your contract"
            )}
          </p>
        </div>
        <ArrowRight className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
      </div>
    </Link>
  );
}
