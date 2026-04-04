// ============================================
// /watchdog/campaigns/[id] — Campaign Detail
// ============================================

import { notFound } from "next/navigation";
import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { ArrowLeft, Users, Scale, FileText } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  const supabase = createAdminClient();

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
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Link
          href="/watchdog/campaigns"
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Campaigns
        </Link>

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <Badge
              className={`text-[10px] ${campaign.status === "active" ? "bg-green-500/15 text-green-400 border-green-500/30" : "bg-gray-500/15 text-gray-400 border-gray-500/30"}`}
            >
              {campaign.status}
            </Badge>
            <span className="text-sm text-muted-foreground">
              vs {campaign.company?.name}
            </span>
          </div>
          <h1 className="text-2xl font-bold mb-2">{campaign.title}</h1>
          <p className="text-muted-foreground">{campaign.description}</p>
        </div>

        {/* Progress */}
        <Card className="bg-background/50 border-gray-800 mb-6">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-amber-400" />
                <span className="text-2xl font-bold text-amber-400">
                  {campaign.signatory_count}
                </span>
                <span className="text-muted-foreground">
                  / {campaign.target_count} signatories
                </span>
              </div>
              <span className="text-lg font-bold">{Math.round(progress)}%</span>
            </div>
            <div className="h-3 bg-gray-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-background rounded-full transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left: Details + Legal basis */}
          <div className="space-y-6">
            <Card className="bg-background/50 border-gray-800">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Scale className="h-4 w-4" /> Legal Basis
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  {campaign.legal_basis}
                </p>
              </CardContent>
            </Card>

            {campaign.objection_template && (
              <Card className="bg-background/50 border-gray-800">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <FileText className="h-4 w-4" /> Objection Letter
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <pre className="text-sm text-muted-foreground whitespace-pre-wrap font-sans leading-relaxed">
                    {campaign.objection_template}
                  </pre>
                </CardContent>
              </Card>
            )}

            {/* Signatories */}
            <Card className="bg-background/50 border-gray-800">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Users className="h-4 w-4" /> Signatories (
                  {typedSignatories.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {typedSignatories.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No signatories yet. Be the first!
                  </p>
                ) : (
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {typedSignatories.map((sig) => (
                      <div
                        key={sig.id}
                        className="flex items-center justify-between py-1.5 text-sm"
                      >
                        <span>{sig.display_name}</span>
                        <span className="text-[10px] text-muted-foreground">
                          {new Date(sig.signed_at).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                          })}
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
      </div>
    </div>
  );
}
