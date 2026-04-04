"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import DirectionBadge from "./direction-badge";
import type { SemanticChange } from "@/types";

const severityConfig: Record<
  string,
  { color: string; emoji: string; label: string; bgColor: string }
> = {
  critical: {
    color: "text-red-400",
    emoji: "🔴",
    label: "CRITICAL",
    bgColor: "border-red-500/20",
  },
  major: {
    color: "text-amber-400",
    emoji: "🟡",
    label: "MAJOR",
    bgColor: "border-amber-500/20",
  },
  minor: {
    color: "text-blue-400",
    emoji: "🔵",
    label: "MINOR",
    bgColor: "border-blue-500/20",
  },
  cosmetic: {
    color: "text-gray-400",
    emoji: "⚪",
    label: "COSMETIC",
    bgColor: "border-gray-500/20",
  },
};

const changeTypeLabels: Record<string, string> = {
  rights_gained: "Rights Gained",
  rights_lost: "Rights Lost",
  obligation_added: "Obligation Added",
  obligation_removed: "Obligation Removed",
  liability_changed: "Liability Changed",
  data_usage_changed: "Data Usage Changed",
  dispute_resolution_changed: "Dispute Resolution Changed",
  pricing_terms_changed: "Pricing Changed",
  termination_changed: "Termination Changed",
  neutral_clarification: "Clarification",
};

export default function ChangeDiffView({
  changes,
}: {
  changes: SemanticChange[];
}) {
  return (
    <div className="space-y-4">
      {changes.map((change, index) => {
        const config = severityConfig[change.severity] || severityConfig.minor;

        return (
          <Card
            key={index}
            className={`bg-background/50 ${config.bgColor} overflow-hidden`}
          >
            {change.severity === "critical" && (
              <div className="h-0.5 bg-red-500" />
            )}
            {change.severity === "major" && (
              <div className="h-0.5 bg-amber-500" />
            )}

            <CardContent className="p-5">
              {/* Header */}
              <div className="flex items-center gap-2 flex-wrap mb-3">
                <Badge
                  className={`bg-${change.severity === "critical" ? "red" : change.severity === "major" ? "amber" : change.severity === "minor" ? "blue" : "gray"}-500/15 ${config.color} border-${change.severity === "critical" ? "red" : change.severity === "major" ? "amber" : change.severity === "minor" ? "blue" : "gray"}-500/30 text-[10px]`}
                >
                  {config.emoji} {config.label}
                </Badge>
                <Badge
                  variant="outline"
                  className="text-[10px] border-foreground border-2"
                >
                  {changeTypeLabels[change.change_type] || change.change_type}
                </Badge>
                <DirectionBadge direction={change.direction} />
              </div>

              <h4 className="font-semibold mb-3">{change.section_title}</h4>

              {/* Before / After */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                {change.old_text && (
                  <div className="rounded-lg bg-red-500/5 border border-red-500/10 p-3">
                    <p className="text-[10px] text-red-400 font-semibold mb-1.5 uppercase tracking-wider">
                      Before
                    </p>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {change.old_text}
                    </p>
                  </div>
                )}
                {change.new_text && (
                  <div className="rounded-lg bg-green-500/5 border border-green-500/10 p-3">
                    <p className="text-[10px] text-green-400 font-semibold mb-1.5 uppercase tracking-wider">
                      After
                    </p>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {change.new_text}
                    </p>
                  </div>
                )}
              </div>

              {/* Impact */}
              <div className="space-y-2">
                <div className="flex items-start gap-2">
                  <span className="text-sm">📌</span>
                  <div>
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Impact
                    </span>
                    <p className="text-sm mt-0.5">
                      {change.user_impact_summary}
                    </p>
                  </div>
                </div>

                {change.legal_implications &&
                  change.legal_implications !== "No legal implications." && (
                    <div className="flex items-start gap-2">
                      <span className="text-sm">⚖️</span>
                      <div>
                        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                          Legal
                        </span>
                        <p className="text-sm mt-0.5 text-amber-300/80">
                          {change.legal_implications}
                        </p>
                      </div>
                    </div>
                  )}

                {change.affected_user_actions &&
                  change.affected_user_actions.length > 0 && (
                    <div className="flex items-start gap-2">
                      <span className="text-sm">👤</span>
                      <div>
                        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                          Affected Actions
                        </span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {change.affected_user_actions.map((action, i) => (
                            <Badge
                              key={i}
                              variant="outline"
                              className="text-[10px] border-foreground border-2"
                            >
                              {action}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
              </div>

              {/* Confidence */}
              <div className="mt-3 flex items-center justify-end">
                <span className="text-[10px] text-muted-foreground">
                  Confidence: {Math.round(change.confidence * 100)}%
                </span>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
