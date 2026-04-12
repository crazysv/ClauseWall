// ============================================
// /watchdog/companies/[slug] — Company Detail
// ============================================

import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import TosScoreBadge from "@/components/watchdog/tos-score-badge";
import TrendIndicator from "@/components/watchdog/trend-indicator";
import TosTimeline from "@/components/watchdog/tos-timeline";
import WatchlistToggle from "@/components/watchdog/watchlist-toggle";
import type { MonitoredCompany, TosChange } from "@/types";
import { Box, ExternalLink, Activity, ScanLine, LayoutDashboard } from "lucide-react";

const SECTOR_LABELS: Record<string, string> = {
  ride_hailing: "RIDE_HAILING",
  food_delivery: "FOOD_DELIVERY",
  ecommerce: "E_COMMERCE",
  payments: "PAYMENTS",
  social: "SOCIAL",
  streaming: "STREAMING",
  travel: "TRAVEL",
  banking: "BANKING",
  telecom: "TELECOM",
  edtech: "ED_TECH",
  government: "GOVERNMENT",
  other: "OTHER_NODE",
};

export default async function CompanyDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: company } = await supabase
    .from("monitored_companies")
    .select("*")
    .eq("slug", slug)
    .single();

  if (!company) notFound();

  const typedCompany = company as MonitoredCompany;

  const { data: changes } = await supabase
    .from("tos_changes")
    .select("*")
    .eq("company_id", typedCompany.id)
    .eq("is_published", true)
    .order("detected_at", { ascending: false })
    .limit(50);

  const tosUrls = typedCompany.tos_urls as Array<{
    label: string;
    url: string;
    type: string;
  }>;

  return (
    <div className="min-h-screen bg-[#050505]">
      <div className="container mx-auto px-4 py-12 max-w-5xl">
        {/* Header Block Array */}
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 mb-12 border-b border-neutral-900 pb-8">
          <div className="flex items-start gap-5">
            <div className="h-16 w-16 bg-[#0a0a0a] border border-neutral-800 flex items-center justify-center relative overflow-hidden">
              <div className="absolute top-0 inset-x-0 h-px bg-cyan-900/50" />
              <Box className="h-6 w-6 text-neutral-500" />
            </div>
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className="font-mono text-[10px] uppercase tracking-widest text-neutral-600">
                  [ TARGET NODE ]
                </span>
                <span className="font-mono text-[9px] uppercase tracking-widest px-1.5 py-0.5 border border-cyan-900/30 text-cyan-500 bg-cyan-950/10">
                  SECTOR: {SECTOR_LABELS[typedCompany.sector] || typedCompany.sector.toUpperCase()}
                </span>
              </div>
              <h1 className="text-3xl font-mono uppercase tracking-widest text-neutral-200 mb-2">
                {typedCompany.name}
              </h1>
              <a
                href={`https://${typedCompany.website}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-widest text-cyan-600 hover:text-cyan-400 transition-colors"
              >
                <ExternalLink className="h-3 w-3" />
                {typedCompany.website}
              </a>
            </div>
          </div>
          
          <div className="flex flex-col items-end gap-4">
            <TosScoreBadge score={typedCompany.current_tos_score} size="lg" />
            <WatchlistToggle companyId={typedCompany.id} isWatching={false} />
          </div>
        </div>

        {/* Telemetry Row */}
        <div className="mb-12">
          <h2 className="text-[10px] font-mono font-bold uppercase tracking-widest text-neutral-500 mb-4 flex items-center gap-2">
            <Activity className="h-3 w-3" />
            [ EXECUTIVE TELEMETRY ]
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-neutral-900 border border-neutral-900">
            <div className="bg-[#0a0a0a] p-5 flex flex-col justify-center items-center relative">
              <span className="text-3xl font-mono tracking-tighter text-neutral-300">
                {typedCompany.total_changes}
              </span>
              <span className="text-[9px] font-mono text-neutral-600 tracking-widest uppercase mt-2">
                TOTAL VECTOR CHANGES
              </span>
            </div>
            <div className="bg-[#0a0a0a] p-5 flex flex-col justify-center items-center relative">
              <span className="text-3xl font-mono tracking-tighter text-red-500">
                {typedCompany.pro_company_changes}
              </span>
              <span className="text-[9px] font-mono text-red-700 tracking-widest uppercase mt-2">
                PRO-ENTITY VECTORS
              </span>
            </div>
            <div className="bg-[#0a0a0a] p-5 flex flex-col justify-center items-center relative">
              <span className="text-3xl font-mono tracking-tighter text-emerald-500">
                {typedCompany.pro_consumer_changes}
              </span>
              <span className="text-[9px] font-mono text-emerald-700 tracking-widest uppercase mt-2">
                PRO-CLIENT VECTORS
              </span>
            </div>
            <div className="bg-[#0a0a0a] p-5 flex flex-col justify-center items-center relative">
              <div className="mb-3">
                <TrendIndicator trend={typedCompany.score_trend} />
              </div>
              <span className="text-[9px] font-mono text-neutral-600 tracking-widest uppercase mt-2">
                THREAT TRAJECTORY
              </span>
            </div>
          </div>
        </div>

        {/* Grid Layout for Logs & Documents */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Log Column */}
          <div className="lg:col-span-2">
            <h2 className="text-[10px] font-mono font-bold uppercase tracking-widest text-neutral-500 mb-6 flex items-center gap-2">
              <LayoutDashboard className="h-3 w-3" />
              [ SYSTEM ALTERATION LOG ]
            </h2>
            <TosTimeline changes={(changes as TosChange[]) || []} />
          </div>

          {/* Right Rail: Document Targets */}
          <div className="lg:col-span-1">
            <h2 className="text-[10px] font-mono font-bold uppercase tracking-widest text-neutral-500 mb-6 flex items-center gap-2">
              <ScanLine className="h-3 w-3" />
              [ MONITORED SURFACES ]
            </h2>
            
            <div className="bg-[#0a0a0a] border border-neutral-900 p-4">
              <div className="space-y-4">
                {tosUrls.map((tos, i) => (
                  <div
                    key={i}
                    className="pb-4 border-b border-neutral-900 last:border-0 last:pb-0"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-mono text-neutral-300 tracking-wide">
                        {tos.label}
                      </span>
                      <span className="font-mono text-[9px] uppercase tracking-widest px-1 py-0.5 border border-neutral-800 text-neutral-500 bg-[#050505]">
                        {tos.type}
                      </span>
                    </div>
                    <a
                      href={tos.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 font-mono text-[10px] text-cyan-600 hover:text-cyan-400 transition-colors truncate max-w-full"
                    >
                      <ExternalLink className="h-3 w-3 flex-shrink-0" />
                      <span className="truncate">{tos.url}</span>
                    </a>
                  </div>
                ))}
              </div>
              
              {typedCompany.last_scraped_at && (
                <div className="mt-6 pt-4 border-t border-neutral-900">
                  <p className="text-[9px] font-mono uppercase tracking-widest text-neutral-600">
                    [ LAST INGESTION: {new Date(typedCompany.last_scraped_at).toLocaleString("en-IN")} ]
                  </p>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
