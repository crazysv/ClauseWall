"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DirectionBadge } from "./direction-badge";
import type { TosChangeWithCompany, SemanticChange, ChangeSeverity } from "@/types";
import { SEVERITY_CONFIG, getTimeAgo } from "./watchdog-constants";

export function ChangeCard({ change }: { change: TosChangeWithCompany }) {
  const changes = (change.changes || []) as SemanticChange[];
  const highestSeverity = getHighestSeverity(changes);
  const config = SEVERITY_CONFIG[highestSeverity] || SEVERITY_CONFIG.minor;
  const companyName = change.company?.name || "Unknown Company";
  const timeAgo = getTimeAgo(new Date(change.detected_at));

  return (
    <Card className={`bg-white dark:bg-card border-slate-200 dark:border-slate-700 hover:border-slate-300 hover:shadow-md transition-all rounded-xl overflow-hidden`}>
      {highestSeverity === "critical" && <div className="h-1 bg-red-600" />}
      {highestSeverity === "major" && <div className="h-1 bg-amber-500" />}

      <CardContent className="p-5 sm:p-6">
        <div className="flex items-start justify-between gap-4 mb-3">
          <div className="flex items-center gap-2.5 flex-wrap">
            <Badge className={`${config.badgeClass} font-black uppercase tracking-widest px-2 py-0.5 rounded-full text-[10px] shadow-sm dark:shadow-slate-900/20`}>
              {config.emoji} {config.label}
            </Badge>
            <span className="font-black text-slate-900 dark:text-slate-100 text-base">{companyName}</span>
            <span className="text-sm font-medium text-slate-400">· {timeAgo}</span>
          </div>
          {change.overall_direction && (
            <DirectionBadge direction={change.overall_direction as import("@/types").ChangeDirection} />
          )}
        </div>

        <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-4 bg-slate-50 dark:bg-slate-800 p-3 rounded-lg border border-slate-100 italic">
          "{change.summary || `${changes.length} change${changes.length !== 1 ? "s" : ""} detected`}"
        </p>

        {/* Top changes preview */}
        <div className="space-y-2.5 mb-5 pl-1">
          {changes.slice(0, 3).map((c, i) => {
            const cConfig = SEVERITY_CONFIG[c.severity] || SEVERITY_CONFIG.minor;
            return (
              <div key={i} className="flex items-start gap-3 text-sm">
                <span className="flex-shrink-0 text-base drop-shadow-sm dark:shadow-slate-900/20 leading-none pt-0.5">{cConfig.emoji}</span>
                <span className="font-medium text-slate-700 leading-snug">{c.user_impact_summary}</span>
              </div>
            );
          })}
          {changes.length > 3 && (
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400 ml-8 pt-1">
              + {changes.length - 3} more changes
            </p>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-3 pt-4 border-t border-slate-100">
          <Link href={`/watchdog/changes/${change.id}`}>
            <button className="text-sm text-indigo-600 hover:text-indigo-800 transition-colors font-bold flex items-center gap-1">
              View Full Analysis <span aria-hidden="true">&rarr;</span>
            </button>
          </Link>
          {change.legality_issues && (change.legality_issues as unknown[]).length > 0 && (
            <Badge className="bg-red-50 text-red-700 border-red-200 font-bold uppercase tracking-widest px-2 py-0.5 rounded-md text-[10px]">
              ⚖️ Legal Issues Found
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function getHighestSeverity(changes: SemanticChange[]): string {
  const order: ChangeSeverity[] = ["critical", "major", "minor", "cosmetic"];
  for (const sev of order) {
    if (changes.some((c) => c.severity === sev)) return sev;
  }
  return "cosmetic";
}
