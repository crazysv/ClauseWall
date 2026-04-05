// ============================================
// /watchdog/changes/[id] — Change Detail
// ============================================

import { notFound } from "next/navigation";
import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, AlertTriangle, Scale } from "lucide-react";
import ChangeDiffView from "@/components/watchdog/change-diff-view";
import DirectionBadge from "@/components/watchdog/direction-badge";
import type {
  TosChange,
  SemanticChange,
  MonitoredCompany,
  WatchdogLegalityIssue,
  ChangeDirection,
} from "@/types";

export default async function ChangeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = createAdminClient();

  const { data: changeData } = await supabase
    .from("tos_changes")
    .select("*, company:monitored_companies(*)")
    .eq("id", id)
    .single();

  if (!changeData) notFound();

  const change = changeData as TosChange & { company: MonitoredCompany };
  const company = change.company;
  const changes = (change.changes || []) as SemanticChange[];
  const legalityIssues = (change.legality_issues ||
    []) as WatchdogLegalityIssue[];

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        {/* Back nav */}
        <Link
          href={`/watchdog/companies/${company.slug}`}
          className="flex items-center gap-2 text-sm text-foreground hover:text-foreground mb-6 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to {company.name}
        </Link>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold mb-2">
            {company.name} — ToS Change Analysis
          </h1>
          <div className="flex items-center gap-3 flex-wrap">
            <Badge
              variant="outline"
              className="border-foreground border-2 text-xs"
            >
              {change.tos_type.toUpperCase()}
            </Badge>
            <span className="text-sm text-foreground">
              Detected {new Date(change.detected_at).toLocaleString("en-IN")}
            </span>
            {change.overall_direction && (
              <DirectionBadge
                direction={change.overall_direction as ChangeDirection}
              />
            )}
          </div>
        </div>

        {/* Summary */}
        {change.summary && (
          <Card className="bg-background border-2 border-foreground card-impact/50 border-foreground border-2 mb-6">
            <CardContent className="p-5">
              <p className="text-sm leading-relaxed">{change.summary}</p>
            </CardContent>
          </Card>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {[
            {
              label: "Total Changes",
              value: change.total_changes,
              color: "text-foreground",
            },
            {
              label: "Critical",
              value: change.critical_count,
              color: "text-red-400",
            },
            {
              label: "Major",
              value: change.major_count,
              color: "text-amber-400",
            },
            {
              label: "Minor / Cosmetic",
              value: change.minor_count + change.cosmetic_count,
              color: "text-blue-400",
            },
          ].map((stat) => (
            <Card
              key={stat.label}
              className="bg-background border-2 border-foreground card-impact/50 border-foreground border-2"
            >
              <CardContent className="p-3 text-center">
                <p className={`text-xl font-bold ${stat.color}`}>
                  {stat.value}
                </p>
                <p className="text-[10px] text-foreground">
                  {stat.label}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Legality issues */}
        {legalityIssues.length > 0 && (
          <Card className="bg-red-500/5 border-red-500/20 mb-6">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2 text-red-400">
                <Scale className="h-4 w-4" />
                ⚖️ Legal Issues Found ({legalityIssues.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {legalityIssues.map((issue, i) => (
                <div
                  key={i}
                  className="flex items-start gap-3 p-3 bg-red-500/5 rounded-none border border-red-500/10"
                >
                  <AlertTriangle className="h-4 w-4 text-red-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-red-300">
                      {issue.law_name} — {issue.section}
                    </p>
                    <p className="text-sm text-foreground mt-0.5">
                      {issue.violation_description}
                    </p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Semantic diff */}
        <h2 className="text-lg font-semibold mb-4">📋 Detailed Changes</h2>
        <ChangeDiffView changes={changes} />
      </div>
    </div>
  );
}
