// ============================================
// /watchdog/campaigns — Campaign List
// ============================================

import { createAdminClient } from "@/lib/supabase/admin";
import { Shield, Users } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import CampaignCard from "@/components/watchdog/campaign-card";
import type { OptoutCampaignWithCompany } from "@/types";

export const metadata = {
  title: "Opt-Out Campaigns — Contract Watchdog — ClauseWall",
  description:
    "Join collective opt-out campaigns against unfair Terms of Service changes",
};

export default async function CampaignsPage() {
  const supabase = createAdminClient();

  const { data: campaigns } = await supabase
    .from("optout_campaigns")
    .select("*, company:monitored_companies(*)")
    .order("created_at", { ascending: false });

  const typedCampaigns = (campaigns as OptoutCampaignWithCompany[]) || [];
  const activeCampaigns = typedCampaigns.filter((c) => c.status === "active");
  const totalSignatories = typedCampaigns.reduce(
    (sum, c) => sum + c.signatory_count,
    0,
  );

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <div className="flex items-center gap-3 mb-2">
          <div className="h-10 w-10 rounded-none bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
            <Shield className="h-5 w-5 text-amber-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Opt-Out Campaigns</h1>
            <p className="text-sm text-muted-foreground">
              Collective legal objections against unfair ToS changes
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 my-6">
          <Card className="bg-background border-2 border-foreground bg-popover/50 border-foreground border-2">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-amber-400">
                {activeCampaigns.length}
              </p>
              <p className="text-xs text-muted-foreground">Active Campaigns</p>
            </CardContent>
          </Card>
          <Card className="bg-background border-2 border-foreground bg-popover/50 border-foreground border-2">
            <CardContent className="p-4 flex items-center justify-center gap-2">
              <Users className="h-5 w-5 text-muted-foreground" />
              <p className="text-2xl font-bold">{totalSignatories}</p>
              <p className="text-xs text-muted-foreground">Total Signatories</p>
            </CardContent>
          </Card>
        </div>

        {typedCampaigns.length === 0 ? (
          <div className="text-center py-12">
            <Shield className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">No campaigns yet.</p>
            <p className="text-sm text-muted-foreground mt-1">
              Campaigns will be created when critical or illegal ToS changes are
              detected.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {typedCampaigns.map((campaign) => (
              <CampaignCard key={campaign.id} campaign={campaign} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
