"use client";

import Link from "next/link";
import type { TosChange, SemanticChange } from "@/types";
import { AlertCircle, FileWarning, Fingerprint, Activity } from "lucide-react";

export default function TosTimeline({ changes }: { changes: TosChange[] }) {
  if (changes.length === 0) {
    return (
      <div className="text-center p-8 border border-neutral-900 bg-[#0a0a0a]">
        <p className="text-[10px] font-mono uppercase tracking-widest text-neutral-600">
          [ NO STRUCTURAL DEVIATIONS DETECTED ]
        </p>
      </div>
    );
  }

  return (
    <div className="relative font-mono">
      {/* Vertical tracking line */}
      <div className="absolute left-[11px] top-4 bottom-4 w-px bg-neutral-900" />

      <div className="space-y-8">
        {changes.map((change, index) => {
          const semanticChanges = (change.changes || []) as SemanticChange[];
          const date = new Date(change.detected_at);

          return (
            <div key={change.id} className="relative pl-10">
              {/* Node on timeline */}
              <div
                className={`absolute left-[8px] top-2 w-[7px] h-[7px] border
                  ${change.critical_count > 0 
                    ? "bg-red-500 border-red-900 shadow-[0_0_8px_rgba(239,68,68,0.5)]" 
                    : change.major_count > 0 
                      ? "bg-amber-500 border-amber-900" 
                      : "bg-cyan-500 border-cyan-900"
                  }`}
              />

              <div className="flex items-center gap-3 mb-3 flex-wrap">
                <span className="text-[10px] uppercase tracking-widest text-neutral-400">
                  {date.toLocaleDateString("en-IN", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })}
                </span>
                <span className="text-[9px] uppercase tracking-widest border border-neutral-800 bg-[#0a0a0a] px-1.5 py-0.5 text-neutral-500">
                  {change.tos_type.toUpperCase()} V
                  {change.change_number || index + 1}
                </span>
                <span className="text-[9px] text-neutral-600 tracking-widest uppercase">
                  {change.total_changes} VECTORS
                </span>
                {change.critical_count > 0 && (
                  <span className="text-[9px] px-1.5 py-0.5 border border-red-900/50 bg-red-950/20 text-red-500 uppercase tracking-widest flex items-center gap-1">
                    <AlertCircle className="h-2.5 w-2.5" />
                    {change.critical_count} CRITICAL
                  </span>
                )}
                {change.major_count > 0 && (
                  <span className="text-[9px] px-1.5 py-0.5 border border-amber-900/50 bg-amber-950/20 text-amber-500 uppercase tracking-widest flex items-center gap-1">
                    <FileWarning className="h-2.5 w-2.5" />
                    {change.major_count} MAJOR
                  </span>
                )}
              </div>

              {/* Semantic changes */}
              <div className="space-y-2 mb-3 bg-[#0a0a0a] border border-neutral-900 p-3">
                {semanticChanges.slice(0, 3).map((sc, i) => {
                  const isSevere = sc.severity === "critical" || sc.severity === "major";
                  return (
                    <div key={i} className="flex items-start gap-2">
                       {isSevere ? (
                         <Fingerprint className={`flex-shrink-0 h-3 w-3 mt-0.5 ${sc.severity === "critical" ? "text-red-500" : "text-amber-500"}`} />
                       ) : (
                         <Activity className="flex-shrink-0 h-3 w-3 mt-0.5 text-cyan-500" />
                       )}
                      <span className="text-[10px] leading-relaxed text-neutral-400">
                        {sc.user_impact_summary}
                      </span>
                    </div>
                  );
                })}
                {semanticChanges.length > 3 && (
                  <div className="text-[9px] text-neutral-600 uppercase tracking-widest pt-2 mt-2 border-t border-neutral-900">
                    + {semanticChanges.length - 3} ADDITIONAL VECTORS SUPPRESSED
                  </div>
                )}
              </div>

              <Link href={`/watchdog/changes/${change.id}`}>
                <span className="inline-flex items-center gap-2 text-[9px] uppercase tracking-widest text-cyan-500 hover:text-cyan-400 transition-colors">
                  [ INITIATE DELTA SCAN ]
                </span>
              </Link>
            </div>
          );
        })}
      </div>
    </div>
  );
}
