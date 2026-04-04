"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import DirectionBadge from "./direction-badge";
import type {
  TosChangeWithCompany,
  SemanticChange,
  ChangeSeverity,
} from "@/types";

const severityConfig: Record<
  string,
  { color: string; emoji: string; label: string }
> = {
  critical: {
    color: "bg-red-500/15 text-red-400 border-red-500/30",
    emoji: "🔴",
    label: "CRITICAL",
  },
  major: {
    color: "bg-amber-500/15 text-amber-400 border-amber-500/30",
    emoji: "🟡",
    label: "MAJOR",
  },
  minor: {
    color: "bg-blue-500/15 text-blue-400 border-blue-500/30",
    emoji: "🔵",
    label: "MINOR",
  },
  cosmetic: {
    color: "bg-gray-500/15 text-gray-400 border-gray-500/30",
    emoji: "⚪",
    label: "COSMETIC",
  },
};

export default function ChangeCard({
  change,
}: {
  change: TosChangeWithCompany;
}) {
  const changes = (change.changes || []) as SemanticChange[];
  const highestSeverity = getHighestSeverity(changes);
  const config = severityConfig[highestSeverity] || severityConfig.minor;
  const companyName = change.company?.name || "Unknown Company";
  const timeAgo = getTimeAgo(new Date(change.detected_at));

  return (
    <Card
      className={`bg-background border-2 border-foreground card-impact/50 border-foreground border-2 hover:border-foreground border-2 transition-all overflow-hidden`}
    >
      {highestSeverity === "critical" && <div className="h-0.5 bg-red-500" />}
      {highestSeverity === "major" && <div className="h-0.5 bg-amber-500" />}

      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge className={`${config.color} text-[10px]`}>
              {config.emoji} {config.label}
            </Badge>
            <span className="font-semibold">{companyName}</span>
            <span className="text-sm text-muted-foreground">· {timeAgo}</span>
          </div>
          {change.overall_direction && (
            <DirectionBadge
              direction={
                change.overall_direction as import("@/types").ChangeDirection
              }
            />
          )}
        </div>

        <p className="text-sm text-muted-foreground mb-3">
          {change.summary ||
            `${changes.length} change${changes.length !== 1 ? "s" : ""} detected`}
        </p>

        {/* Top changes preview */}
        <div className="space-y-2 mb-4">
          {changes.slice(0, 3).map((c, i) => {
            const cConfig = severityConfig[c.severity] || severityConfig.minor;
            return (
              <div key={i} className="flex items-start gap-2 text-sm">
                <span className="flex-shrink-0">{cConfig.emoji}</span>
                <span className="text-muted-foreground">
                  {c.user_impact_summary}
                </span>
              </div>
            );
          })}
          {changes.length > 3 && (
            <p className="text-xs text-muted-foreground ml-5">
              +{changes.length - 3} more changes
            </p>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-3">
          <Link href={`/watchdog/changes/${change.id}`}>
            <button className="text-sm text-blue-400 hover:text-blue-300 transition-colors font-medium">
              View Full Analysis →
            </button>
          </Link>
          {change.legality_issues &&
            (change.legality_issues as unknown[]).length > 0 && (
              <Badge className="bg-red-500/10 text-red-400 border-red-500/20 text-[10px]">
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

function getTimeAgo(date: Date): string {
  const diffMs = Date.now() - date.getTime();
  const hours = Math.floor(diffMs / 3600000);
  if (hours < 1) return "Just now";
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}
