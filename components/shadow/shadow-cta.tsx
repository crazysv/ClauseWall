"use client";

import Link from "next/link";
import { FileSearch, AlertTriangle, ChevronRight } from "lucide-react";

interface ShadowCTAProps {
  documentId: string;
  shadowData?: {
    trust_score?: number;
    total_mismatches?: number;
    critical_mismatches?: number;
    has_analysis?: boolean;
  } | null;
}

export function ShadowCTA({ documentId, shadowData }: ShadowCTAProps) {
  const hasAnalysis = shadowData?.has_analysis;
  
  const isDanger = (shadowData?.critical_mismatches ?? 0) > 0;

  return (
    <Link href={`/shadow/${documentId}`} className="block w-full mt-4">
      <div className={`p-4 sm:p-5 rounded-2xl bg-white dark:bg-card border border-slate-200 dark:border-slate-700 shadow-sm dark:shadow-slate-900/20 hover:shadow-md transition-all cursor-pointer group border-l-[6px] ${isDanger ? 'border-l-red-500' : 'border-l-amber-500'}`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-xl flex-shrink-0 transition-colors shadow-inner border border-current/10 ${isDanger ? 'bg-red-50 text-red-600 group-hover:bg-red-100' : 'bg-amber-50 text-amber-600 group-hover:bg-amber-100'}`}>
              <FileSearch className={`h-6 w-6 currentColor`} />
            </div>
            <div>
              <p className="font-black text-sm uppercase tracking-widest text-slate-900 dark:text-slate-100 flex items-center gap-2">
                Shadow Agreement Detector
              </p>
              <p className="text-xs font-medium text-slate-600 dark:text-slate-400 mt-1 max-w-lg line-clamp-1 leading-relaxed">
                {hasAnalysis ? (
                  <span className="flex items-center gap-1.5">
                    {isDanger && (
                      <AlertTriangle className="w-4 h-4 text-red-500 inline" />
                    )}
                    Trust Score: <span className="font-black text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 px-1.5 rounded">{shadowData?.trust_score ?? "?"}/100</span> •{" "}
                    {shadowData?.total_mismatches ?? 0} mismatch{(shadowData?.total_mismatches ?? 0) !== 1 ? "es" : ""}
                    {isDanger && <span className="text-red-700 font-bold ml-1 bg-red-50 px-1.5 rounded">({shadowData?.critical_mismatches} critical hooks)</span>}
                  </span>
                ) : (
                  "Cross-reference spoken promises against the actual contract."
                )}
              </p>
            </div>
          </div>
          <div className="w-full sm:w-auto flex-shrink-0">
             <button className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-indigo-200 text-indigo-700 bg-white dark:bg-card group-hover:bg-indigo-50 dark:hover:bg-indigo-950/30 group-hover:border-indigo-300 text-[10px] font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-1.5 shadow-sm dark:shadow-slate-900/20">
                {hasAnalysis ? "View Shadows" : "Scan Promises"} <ChevronRight className="h-4 w-4 text-indigo-600 group-hover:translate-x-1 transition-transform" />
             </button>
          </div>
        </div>
      </div>
    </Link>
  );
}
