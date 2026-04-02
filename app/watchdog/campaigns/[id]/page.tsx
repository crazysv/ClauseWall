// ============================================
// /watchdog/campaigns/[id] — Campaign Detail
// ============================================

import { notFound } from "next/navigation";
import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { ArrowLeft, Users, Scale, FileText } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CampaignSignForm } from "@/components/watchdog/campaign-sign-form";
import { Navbar } from "@/components/shared/navbar";
import { Footer } from "@/components/shared/footer";
import type { OptoutCampaign, CampaignSignatory, MonitoredCompany } from "@/types";

export default async function CampaignDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = createAdminClient();

  const { data: campaignData } = await supabase
    .from("optout_campaigns")
    .select("*, company:monitored_companies(*)")
    .eq("id", id)
    .single();

  if (!campaignData) notFound();

  const campaign = campaignData as OptoutCampaign & { company: MonitoredCompany };

  const { data: signatories } = await supabase
    .from("campaign_signatories")
    .select("*")
    .eq("campaign_id", id)
    .order("signed_at", { ascending: false });

  const typedSignatories = (signatories as CampaignSignatory[]) || [];
  const progress = Math.min(100, (campaign.signatory_count / campaign.target_count) * 100);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 font-sans flex flex-col relative overflow-hidden text-slate-900 dark:text-slate-100">
      {/* Background gradients */}
      <div className="absolute top-0 right-1/4 w-[40%] h-[40%] bg-amber-500/5 rounded-full blur-[120px] pointer-events-none -z-10" />
      <div className="absolute bottom-0 left-1/4 w-[30%] h-[30%] bg-orange-500/5 rounded-full blur-[100px] pointer-events-none -z-10" />

      <Navbar />

      <main className="flex-1 container mx-auto px-4 py-8 md:py-16 max-w-5xl animate-in fade-in slide-in-from-bottom-8 duration-700">
        <Link
          href="/watchdog/campaigns"
          className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-amber-400 mb-8 transition-colors group"
        >
          <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
          Back to Campaigns
        </Link>

        {/* Header */}
        <div className="mb-10 space-y-4">
          <div className="flex items-center gap-3 flex-wrap">
            <span className={`inline-flex items-center px-3 py-1 rounded-lg text-xs font-black uppercase tracking-widest ${
              campaign.status === "active" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800" :
              "bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border border-slate-300 dark:border-slate-700"
            }`}>
              {campaign.status}
            </span>
            <span className="text-sm font-bold text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-800 px-3 py-1 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm">vs {campaign.company?.name || "Unknown Company"}</span>
          </div>
          <h1 className="text-3xl md:text-5xl font-black tracking-tight">{campaign.title}</h1>
          <p className="text-lg font-medium text-slate-600 dark:text-slate-400 max-w-3xl leading-relaxed">{campaign.description}</p>
        </div>

        {/* Progress */}
        <Card className="bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-800/60 shadow-xl dark:shadow-slate-900/20 rounded-3xl overflow-hidden mb-8 backdrop-blur-md">
          <CardContent className="p-6 md:p-8">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-xl border border-amber-200 dark:border-amber-800/50">
                  <Users className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                </div>
                <div className="flex flex-col">
                   <span className="text-2xl md:text-3xl font-black text-amber-600 dark:text-amber-400 leading-none">{campaign.signatory_count.toLocaleString()}</span>
                   <span className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mt-1">/ {campaign.target_count.toLocaleString()} expected</span>
                </div>
              </div>
              <span className="text-3xl font-black text-slate-900 dark:text-slate-100">{Math.round(progress)}%</span>
            </div>
            <div className="h-4 bg-slate-100 dark:bg-slate-900/80 rounded-full overflow-hidden border border-slate-200 dark:border-slate-800 shadow-inner">
              <div
                className="h-full bg-gradient-to-r from-amber-400 to-orange-500 dark:from-amber-500 dark:to-orange-600 rounded-full transition-all duration-1000 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Left: Details + Legal basis */}
          <div className="space-y-6">
            <Card className="bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-800/60 shadow-md dark:shadow-slate-900/20 rounded-2xl overflow-hidden backdrop-blur-md">
              <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-700/50 bg-slate-50/50 dark:bg-slate-900/30">
                <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2 text-slate-700 dark:text-slate-300">
                  <Scale className="h-4 w-4" /> Legal Basis
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400 leading-relaxed">{campaign.legal_basis}</p>
              </CardContent>
            </Card>

            {campaign.objection_template && (
              <Card className="bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-800/60 shadow-md dark:shadow-slate-900/20 rounded-2xl overflow-hidden backdrop-blur-md">
                <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-700/50 bg-slate-50/50 dark:bg-slate-900/30">
                  <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2 text-slate-700 dark:text-slate-300">
                    <FileText className="h-4 w-4" /> Objection Letter
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4">
                  <pre className="text-sm font-mono text-slate-600 dark:text-slate-400 whitespace-pre-wrap leading-relaxed bg-slate-100/50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
                    {campaign.objection_template}
                  </pre>
                </CardContent>
              </Card>
            )}

            {/* Signatories */}
            <Card className="bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-800/60 shadow-md dark:shadow-slate-900/20 rounded-2xl overflow-hidden backdrop-blur-md">
              <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-700/50 bg-slate-50/50 dark:bg-slate-900/30">
                <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2 text-slate-700 dark:text-slate-300">
                  <Users className="h-4 w-4" /> Signatories ({typedSignatories.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                {typedSignatories.length === 0 ? (
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400">No signatories yet. Be the first!</p>
                ) : (
                  <div className="space-y-1 max-h-60 overflow-y-auto pr-2">
                    {typedSignatories.map((sig) => (
                      <div key={sig.id} className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800/50 last:border-0">
                        <span className="font-bold text-sm text-slate-800 dark:text-slate-200">{sig.display_name}</span>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider bg-slate-100 dark:bg-slate-900 px-2 py-1 rounded-md border border-slate-200 dark:border-slate-800">
                          {new Date(sig.signed_at).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right: Sign form */}
          <div>
            <CampaignSignForm campaignId={campaign.id} />
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
