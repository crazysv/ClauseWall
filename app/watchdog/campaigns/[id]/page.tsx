// ============================================
// /watchdog/campaigns/[id] — Campaign Detail
// ============================================

import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { ArrowLeft, Users, Scale, FileText, Crosshair, Terminal, Activity } from "lucide-react";
import CampaignSignForm from "@/components/watchdog/campaign-sign-form";
import type {
  OptoutCampaign,
  CampaignSignatory,
  MonitoredCompany,
} from "@/types";

export default async function CampaignDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: campaignData } = await supabase
    .from("optout_campaigns")
    .select("*, company:monitored_companies(*)")
    .eq("id", id)
    .single();

  if (!campaignData) notFound();

  const campaign = campaignData as OptoutCampaign & {
    company: MonitoredCompany;
  };

  const { data: signatories } = await supabase
    .from("campaign_signatories")
    .select("*")
    .eq("campaign_id", id)
    .order("signed_at", { ascending: false });

  const typedSignatories = (signatories as CampaignSignatory[]) || [];
  const progress = Math.min(
    100,
    (campaign.signatory_count / campaign.target_count) * 100,
  );

  return (
    <div className="min-h-screen bg-[#050505]">
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <Link
          href="/watchdog/campaigns"
          className="inline-flex items-center gap-2 text-[10px] uppercase font-mono tracking-widest text-neutral-500 hover:text-cyan-500 mb-8 transition-colors"
        >
          <ArrowLeft className="h-3 w-3" />
          [ ABORT ROUTE : RETURN TO STAGING ]
        </Link>

        {/* Header Array */}
        <div className="mb-10 border-b border-neutral-900 pb-8">
          <div className="flex items-center gap-3 mb-4 flex-wrap">
            <span className={`px-2 py-0.5 border text-[9px] font-mono uppercase tracking-widest ${
              campaign.status === "active" 
                ? "text-emerald-500 border-emerald-900/50 bg-emerald-950/20" 
                : "text-neutral-500 border-neutral-800 bg-[#0a0a0a]"
            }`}>
              [ STATUS: {campaign.status} ]
            </span>
            <span className="text-[9px] font-mono uppercase tracking-widest border border-cyan-900/40 text-cyan-500 bg-cyan-950/20 px-2 py-0.5">
              [ TARGET: {campaign.company?.name.toUpperCase()} ]
            </span>
          </div>
          <h1 className="text-3xl font-mono uppercase tracking-wider text-neutral-200 mb-4 flex items-center gap-3">
             <Crosshair className="h-6 w-6 text-red-500" />
            {campaign.title}
          </h1>
          <p className="text-[12px] font-mono text-neutral-400 max-w-3xl leading-relaxed">
            {campaign.description}
          </p>
        </div>

        {/* Tactical Telemetry & Readiness */}
        <div className="mb-10 bg-[#0a0a0a] border border-neutral-900 overflow-hidden relative">
           <div className="absolute top-0 left-0 bottom-0 w-1 bg-amber-500" />
           <div className="p-6 md:p-8">
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-6">
                <div>
                  <h2 className="text-[10px] font-mono uppercase tracking-widest text-amber-500 mb-2 flex items-center gap-2">
                    <Activity className="h-3 w-3" />
                    [ OPERATION READINESS ]
                  </h2>
                  <div className="flex items-baseline gap-2">
                     <span className="text-4xl font-mono tracking-tighter text-neutral-200">
                       {campaign.signatory_count}
                     </span>
                     <span className="text-[10px] font-mono uppercase tracking-widest text-neutral-500">
                        / {campaign.target_count} SIGNATORIES
                     </span>
                  </div>
                </div>
                <div className="text-right">
                   <span className="text-3xl font-mono tracking-tighter text-amber-500">
                     {Math.round(progress)}%
                   </span>
                   <span className="block text-[9px] font-mono uppercase tracking-widest text-neutral-600 mt-1">
                      ENGAGEMENT QUOTA
                   </span>
                </div>
              </div>
              
              {/* Severe Progress Array */}
              <div className="h-1 w-full bg-[#050505] border border-neutral-800 relative">
                 <div 
                   className="absolute left-0 top-0 bottom-0 bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)] transition-all duration-1000 ease-in-out"
                   style={{ width: `${progress}%` }}
                 />
              </div>
           </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Legal Logs */}
          <div className="lg:col-span-7 space-y-8">
            
            {/* Legal Basis */}
            <div className="bg-[#050505] border border-neutral-900 p-6 relative">
               <h3 className="text-[10px] font-mono font-bold uppercase tracking-widest text-neutral-500 mb-4 flex items-center gap-2">
                  <Scale className="h-3 w-3" />
                  [ ACTION_AUTHORITY: LEGAL BASIS ]
               </h3>
               <p className="text-[11px] font-mono text-neutral-400 leading-relaxed pl-4 border-l-2 border-neutral-800">
                 {campaign.legal_basis}
               </p>
            </div>

            {/* Template Manifest */}
            {campaign.objection_template && (
              <div className="bg-[#0a0a0a] border border-neutral-800">
                 <div className="border-b border-neutral-800 bg-neutral-900/40 p-3">
                   <h3 className="text-[9px] font-mono uppercase tracking-widest text-neutral-400 flex items-center gap-2">
                     <Terminal className="h-3 w-3 text-cyan-500" />
                     [ MANIFEST: OBJECTION_TEMPLATE.TXT ]
                   </h3>
                 </div>
                 <div className="p-4 overflow-x-auto">
                   <pre className="text-[10px] font-mono text-cyan-500/80 leading-relaxed font-mono whitespace-pre-wrap">
                     {campaign.objection_template}
                   </pre>
                 </div>
              </div>
            )}

            {/* Signatories Log */}
            <div className="border border-neutral-900">
               <div className="border-b border-neutral-900 bg-[#0a0a0a] p-4">
                 <h3 className="text-[10px] font-mono font-bold uppercase tracking-widest text-neutral-500 flex items-center gap-2">
                   <Users className="h-3 w-3" />
                   [ AUDIT LOG: ALLIED ENTITIES — {typedSignatories.length} ]
                 </h3>
               </div>
               <div className="p-4 bg-[#050505] max-h-80 overflow-y-auto">
                  {typedSignatories.length === 0 ? (
                    <p className="text-[10px] font-mono uppercase tracking-widest text-neutral-600 text-center py-8">
                       [ NO ALLIED NODES DETECTED ]
                    </p>
                  ) : (
                    <div className="space-y-1">
                      {typedSignatories.map((sig) => (
                        <div
                          key={sig.id}
                          className="flex items-center justify-between py-1.5 px-3 hover:bg-[#0a0a0a] transition-colors border-l-2 border-transparent hover:border-amber-500/50"
                        >
                          <span className="text-[10px] font-mono text-neutral-300">
                            {sig.display_name}
                          </span>
                          <span className="text-[9px] font-mono uppercase tracking-widest text-neutral-600">
                            {new Date(sig.signed_at).toLocaleDateString("en-IN", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric"
                            }).replace(/ /g, '-')}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
               </div>
            </div>

          </div>

          {/* Right Column: Execution Form */}
          <div className="lg:col-span-5">
            <CampaignSignForm campaignId={campaign.id} />
          </div>
        </div>
      </div>
    </div>
  );
}
