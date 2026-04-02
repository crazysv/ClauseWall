"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import type { TosChange, SemanticChange } from "@/types";

export function TosTimeline({ changes }: { changes: TosChange[] }) {
  if (changes.length === 0) {
    return (
      <div className="text-center py-8 text-slate-500 dark:text-slate-400 font-medium">
        <p>No change history yet.</p>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Vertical line */}
      <div className="absolute left-4 top-2 bottom-0 w-0.5 bg-slate-200" />

      <div className="space-y-6">
        {changes.map((change, index) => {
          const semanticChanges = (change.changes || []) as SemanticChange[];
          const date = new Date(change.detected_at);

          return (
            <div key={change.id} className="relative pl-10">
              {/* Dot on timeline */}
              <div className={`absolute left-[11px] top-1.5 w-3.5 h-3.5 rounded-full border-2 border-white shadow-sm dark:shadow-slate-900/20 transition-all ring-2 ${ change.critical_count > 0 ? "bg-red-500 ring-red-100" : change.major_count > 0 ? "bg-amber-500 ring-amber-100" : "bg-indigo-500 ring-indigo-100" }`} />

              <div className="flex items-center gap-3 mb-3 flex-wrap">
                <span className="text-sm font-black text-slate-900 dark:text-slate-100 pt-0.5">
                  {date.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                </span>
                <Badge variant="outline" className="text-[10px] font-bold uppercase tracking-widest bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 rounded-md">
                  {change.tos_type} v{change.change_number || index + 1}
                </Badge>
                <span className="text-xs font-bold uppercase tracking-widest text-slate-400 pt-1">
                  {change.total_changes} change{change.total_changes !== 1 ? "s" : ""}
                </span>
                {change.critical_count > 0 && (
                  <Badge className="bg-red-50 text-red-700 border-red-200 font-black px-2 py-0.5 mt-0.5 shadow-sm dark:shadow-slate-900/20 text-[10px] rounded-full">
                    {change.critical_count}🔴
                  </Badge>
                )}
                {change.major_count > 0 && (
                  <Badge className="bg-amber-50 text-amber-700 border-amber-200 font-black px-2 py-0.5 mt-0.5 shadow-sm dark:shadow-slate-900/20 text-[10px] rounded-full">
                    {change.major_count}🟡
                  </Badge>
                )}
              </div>

              {/* Change items */}
              <div className="space-y-1.5 mb-3 bg-white dark:bg-card border border-slate-100 p-4 rounded-xl shadow-sm dark:shadow-slate-900/20">
                {semanticChanges.slice(0, 3).map((sc, i) => {
                  const emoji = sc.severity === "critical" ? "🔴" : sc.severity === "major" ? "🟡" : sc.severity === "minor" ? "🔵" : "⚪";
                  return (
                    <div key={i} className="flex items-start gap-3 text-sm">
                      <span className="flex-shrink-0 text-base drop-shadow-sm dark:shadow-slate-900/20 leading-none pt-[2px]">{emoji}</span>
                      <span className="font-medium text-slate-600 dark:text-slate-400 leading-snug">{sc.user_impact_summary}</span>
                    </div>
                  );
                })}
                {semanticChanges.length > 3 && (
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-8 pt-1">
                    + {semanticChanges.length - 3} more
                  </p>
                )}
              </div>

              <Link href={`/watchdog/changes/${change.id}`} className="inline-block mt-1">
                <span className="text-sm font-bold text-indigo-600 hover:text-indigo-800 transition-colors flex items-center gap-1 bg-indigo-50 px-3 py-1.5 rounded-lg border border-indigo-100 shadow-sm dark:shadow-slate-900/20">
                  View full analysis <span aria-hidden="true">&rarr;</span>
                </span>
              </Link>
            </div>
          );
        })}
      </div>
    </div>
  );
}
