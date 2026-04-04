"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import type { TosChange, SemanticChange } from "@/types";

export default function TosTimeline({ changes }: { changes: TosChange[] }) {
  if (changes.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>No change history yet.</p>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Vertical line */}
      <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-background border-2 border-foreground card-impact" />

      <div className="space-y-6">
        {changes.map((change, index) => {
          const semanticChanges = (change.changes || []) as SemanticChange[];
          const date = new Date(change.detected_at);

          return (
            <div key={change.id} className="relative pl-10">
              {/* Dot on timeline */}
              <div
                className={`absolute left-2.5 top-1.5 w-3 h-3 rounded-full border-2 ${change.critical_count > 0 ? "bg-red-500 border-red-500" : change.major_count > 0 ? "bg-amber-500 border-amber-500" : "bg-blue-500 border-blue-500"}`}
              />

              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <span className="text-sm font-medium">
                  {date.toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </span>
                <Badge
                  variant="outline"
                  className="text-[10px] border-foreground border-2"
                >
                  {change.tos_type.toUpperCase()} v
                  {change.change_number || index + 1}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {change.total_changes} change
                  {change.total_changes !== 1 ? "s" : ""}
                </span>
                {change.critical_count > 0 && (
                  <Badge className="bg-red-500/15 text-red-400 border-red-500/30 text-[10px]">
                    {change.critical_count}🔴
                  </Badge>
                )}
                {change.major_count > 0 && (
                  <Badge className="bg-amber-500/15 text-amber-400 border-amber-500/30 text-[10px]">
                    {change.major_count}🟡
                  </Badge>
                )}
              </div>

              {/* Change items */}
              <div className="space-y-1 mb-2">
                {semanticChanges.slice(0, 3).map((sc, i) => {
                  const emoji =
                    sc.severity === "critical"
                      ? "🔴"
                      : sc.severity === "major"
                        ? "🟡"
                        : sc.severity === "minor"
                          ? "🔵"
                          : "⚪";
                  return (
                    <div key={i} className="flex items-start gap-2 text-sm">
                      <span className="flex-shrink-0 text-xs mt-0.5">
                        {emoji}
                      </span>
                      <span className="text-muted-foreground">
                        {sc.user_impact_summary}
                      </span>
                    </div>
                  );
                })}
                {semanticChanges.length > 3 && (
                  <p className="text-xs text-muted-foreground ml-5">
                    +{semanticChanges.length - 3} more
                  </p>
                )}
              </div>

              <Link href={`/watchdog/changes/${change.id}`}>
                <span className="text-xs text-blue-400 hover:text-blue-300 transition-colors">
                  View full analysis →
                </span>
              </Link>
            </div>
          );
        })}
      </div>
    </div>
  );
}
