// ============================================
// /watchdog/changes/[id] — Change Detail
// ============================================

import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { ArrowLeft, Scale, Fingerprint, ActivitySquare } from "lucide-react";
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
  const supabase = await createClient();

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
    <div className="min-h-screen bg-[#050505]">
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        {/* Back nav */}
        <Link
          href={`/watchdog/companies/${company.slug}`}
          className="inline-flex items-center gap-2 text-[10px] uppercase font-mono tracking-widest text-neutral-500 hover:text-cyan-500 mb-8 transition-colors"
        >
          <ArrowLeft className="h-3 w-3" />
          [ RETURN TO ENTITY DOSSIER : {company.name.toUpperCase()} ]
        </Link>

        {/* Header Array */}
        <div className="mb-10 border-b border-neutral-900 pb-8">
          <div className="flex items-center gap-3 flex-wrap mb-4">
            <span className="text-[9px] font-mono uppercase tracking-widest border border-neutral-800 text-neutral-400 bg-[#0a0a0a] px-2 py-0.5">
              [ TARGET: {company.name.toUpperCase()} ]
            </span>
            <span className="text-[9px] font-mono uppercase tracking-widest border border-cyan-900/40 text-cyan-500 bg-cyan-950/20 px-2 py-0.5">
              TYPE: {change.tos_type.toUpperCase()}
            </span>
            <span className="text-[9px] font-mono uppercase tracking-widest text-neutral-500">
              DETECTED: {new Date(change.detected_at).toLocaleString("en-IN")}
            </span>
            {change.overall_direction && (
              <DirectionBadge
                direction={change.overall_direction as ChangeDirection}
              />
            )}
          </div>
          <h1 className="text-2xl font-mono tracking-wide text-neutral-200">
            [ DELTA SCAN SEQUENCE COMPLETE ]
          </h1>
        </div>

        {/* Executive Summary */}
        {change.summary && (
          <div className="mb-8 p-6 bg-[#0a0a0a] border border-neutral-900 relative">
            <div className="absolute top-0 left-0 w-1 h-full bg-cyan-900/50" />
            <h2 className="text-[10px] font-mono font-bold uppercase tracking-widest text-cyan-600 mb-3 block">
              [ MACRO SUMMARY ]
            </h2>
            <p className="text-[11px] font-mono text-neutral-400 leading-relaxed">
              {change.summary}
            </p>
          </div>
        )}

        {/* Telemetry Row */}
        <div className="mb-10">
           <h2 className="text-[10px] font-mono font-bold uppercase tracking-widest text-neutral-600 mb-3 block">
              [ VECTOR SEVERITY DISTRIBUTION ]
            </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-neutral-900 border border-neutral-900">
             {[
               {
                 label: "TOTAL DEVIATIONS",
                 value: change.total_changes,
                 color: "text-neutral-300",
                 border: "bg-[#0a0a0a]",
               },
               {
                 label: "CRITICAL VECTORS",
                 value: change.critical_count,
                 color: "text-red-500",
                 border: "bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-red-950/20 to-[#0a0a0a]",
               },
               {
                 label: "MAJOR VECTORS",
                 value: change.major_count,
                 color: "text-amber-500",
                 border: "bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-amber-950/20 to-[#0a0a0a]",
               },
               {
                 label: "MINOR / COSMETIC",
                 value: change.minor_count + change.cosmetic_count,
                 color: "text-cyan-500",
                 border: "bg-[#0a0a0a]",
               },
             ].map((stat) => (
               <div
                 key={stat.label}
                 className={`${stat.border} p-5 flex flex-col justify-center items-center`}
               >
                 <span className={`text-3xl font-mono tracking-tighter ${stat.color}`}>
                   {stat.value}
                 </span>
                 <span className="text-[9px] font-mono text-neutral-600 tracking-widest uppercase mt-2 text-center">
                   {stat.label}
                 </span>
               </div>
             ))}
          </div>
        </div>

        {/* Legality issues */}
        {legalityIssues.length > 0 && (
          <div className="bg-red-950/10 border border-red-900/30 mb-10 overflow-hidden">
            <div className="bg-red-900/20 border-b border-red-900/30 p-4">
               <h2 className="text-[10px] font-mono uppercase tracking-widest text-red-500 flex items-center gap-2">
                <Scale className="h-3 w-3" />
                [ LEGAL VIOLATIONS DETECTED : {legalityIssues.length} ]
              </h2>
            </div>
            
            <div className="p-4 space-y-4">
              {legalityIssues.map((issue, i) => (
                <div
                  key={i}
                  className="flex items-start gap-4 p-4 bg-[#0a0a0a] border border-red-900/20"
                >
                  <Fingerprint className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[10px] font-mono text-red-400 uppercase tracking-widest mb-1.5">
                      {issue.law_name} — {issue.section}
                    </p>
                    <p className="text-[11px] font-mono text-red-300/80 leading-relaxed">
                      {issue.violation_description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Semantic diff */}
        <div>
           <h2 className="text-[10px] font-mono font-bold uppercase tracking-widest text-neutral-600 mb-6 flex gap-2 items-center">
              <ActivitySquare className="h-3 w-3" />
              [ DETAILED FORENSIC ARRAY ]
            </h2>
          <ChangeDiffView changes={changes} />
        </div>
      </div>
    </div>
  );
}
