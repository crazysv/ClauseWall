// ============================================
// /watchdog/campaigns — Campaign List
// ============================================

import { createAdminClient } from "@/lib/supabase/admin";
import { Shield, Users, AlertTriangle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { CampaignCard } from "@/components/watchdog/campaign-card";
import { Navbar } from "@/components/shared/navbar";
import { Footer } from "@/components/shared/footer";
import type { OptoutCampaignWithCompany } from "@/types";

export const metadata = {
  title: "Opt-Out Campaigns — Contract Watchdog — ClauseWall",
  description: "Join collective opt-out campaigns against unfair Terms of Service changes",
};

export default async function CampaignsPage() {
  const supabase = createAdminClient();

  const { data: campaigns } = await supabase
    .from("optout_campaigns")
    .select("*, company:monitored_companies(*)")
    .order("created_at", { ascending: false });

  const typedCampaigns = (campaigns as OptoutCampaignWithCompany[]) || [];
  const activeCampaigns = typedCampaigns.filter((c) => c.status === "active");
  const totalSignatories = typedCampaigns.reduce((sum, c) => sum + c.signatory_count, 0);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 font-sans flex flex-col relative overflow-hidden text-slate-900 dark:text-slate-100">
      {/* Background gradients */}
      <div className="absolute top-0 right-1/4 w-[40%] h-[40%] bg-amber-500/5 rounded-full blur-[120px] pointer-events-none -z-10" />
      <div className="absolute bottom-0 left-1/4 w-[30%] h-[30%] bg-orange-500/5 rounded-full blur-[100px] pointer-events-none -z-10" />

      <Navbar />

      <main className="flex-1 container mx-auto px-4 py-8 md:py-16 max-w-5xl animate-in fade-in slide-in-from-bottom-8 duration-700">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
          <div className="space-y-4">
            <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 mb-2 shadow-sm border border-amber-100 dark:border-amber-800/30">
               <Shield className="h-8 w-8" />
            </div>
            <h1 className="text-4xl md:text-5xl font-black tracking-tight text-slate-900 dark:text-slate-100">
              Opt-Out Campaigns
            </h1>
            <p className="text-lg font-medium text-slate-600 dark:text-slate-400 max-w-2xl">
              Collective legal objections against predatory <span className="text-amber-600 dark:text-amber-400 font-bold">Terms of Service</span> changes.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
          <Card className="bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-800/60 shadow-xl dark:shadow-slate-900/20 rounded-3xl overflow-hidden relative backdrop-blur-md">
             <div className="absolute top-0 right-0 p-4 opacity-10">
               <AlertTriangle className="w-16 h-16 text-amber-500" />
             </div>
            <CardContent className="p-6 md:p-8">
              <p className="text-4xl lg:text-5xl font-black text-amber-500 dark:text-amber-400 mb-2">{activeCampaigns.length}</p>
              <p className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Active Campaigns</p>
            </CardContent>
          </Card>
          <Card className="bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-800/60 shadow-xl dark:shadow-slate-900/20 rounded-3xl overflow-hidden relative backdrop-blur-md">
             <div className="absolute top-0 right-0 p-4 opacity-10">
               <Users className="w-16 h-16 text-indigo-500" />
             </div>
            <CardContent className="p-6 md:p-8">
              <p className="text-4xl lg:text-5xl font-black text-indigo-500 dark:text-indigo-400 mb-2">{totalSignatories.toLocaleString()}</p>
              <p className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Total Signatories</p>
            </CardContent>
          </Card>
        </div>

        {typedCampaigns.length === 0 ? (
          <div className="text-center py-16 md:py-24 border-2 border-dashed border-slate-200 dark:border-slate-800/60 rounded-3xl bg-white/50 dark:bg-slate-800/20 backdrop-blur-sm">
            <div className="inline-flex items-center justify-center p-4 rounded-3xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 mb-6">
               <Shield className="h-10 w-10 text-slate-400" />
            </div>
            <p className="text-xl font-bold text-slate-700 dark:text-slate-300">No campaigns yet.</p>
            <p className="text-slate-500 dark:text-slate-400 max-w-sm mx-auto mt-2 font-medium">
              Campaigns will be created automatically when critical or illegal ToS changes are detected.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {typedCampaigns.map((campaign) => (
              <CampaignCard key={campaign.id} campaign={campaign} />
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
