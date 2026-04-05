"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users } from "lucide-react";
import type { OptoutCampaignWithCompany } from "@/types";

export default function CampaignCard({
  campaign,
}: {
  campaign: OptoutCampaignWithCompany;
}) {
  const progress = Math.min(
    100,
    (campaign.signatory_count / campaign.target_count) * 100,
  );
  const companyName = campaign.company?.name || "Unknown";

  return (
    <Card className="bg-background/50 border-foreground border-2 hover:border-amber-500/20 transition-all">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div>
            <h3 className="font-semibold mb-1">{campaign.title}</h3>
            <div className="flex items-center gap-2 text-sm text-foreground">
              <span>vs {companyName}</span>
              <Badge
                className={`text-[10px] ${campaign.status === "active" ? "bg-green-500/15 text-green-400 border-green-500/30" : campaign.status === "delivered" ? "bg-blue-500/15 text-blue-400 border-blue-500/30" : "bg-gray-500/15 text-foreground border-gray-500/30"}`}
              >
                {campaign.status}
              </Badge>
            </div>
          </div>
          <div className="text-right flex-shrink-0">
            <div className="flex items-center gap-1 text-amber-400">
              <Users className="h-4 w-4" />
              <span className="font-bold">{campaign.signatory_count}</span>
            </div>
            <p className="text-[10px] text-foreground">
              of {campaign.target_count}
            </p>
          </div>
        </div>

        <p className="text-sm text-foreground mb-3 line-clamp-2">
          {campaign.description}
        </p>

        {/* Progress bar */}
        <div className="mb-3">
          <div className="h-2 bg-background border-2 border-foreground card-impact rounded-full overflow-hidden">
            <div
              className="h-full bg-background rounded-full transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-[10px] text-foreground mt-1">
            {Math.round(progress)}% of target
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge
            variant="outline"
            className="text-[10px] border-foreground border-2"
          >
            ⚖️ {campaign.legal_basis}
          </Badge>
        </div>

        <Link href={`/watchdog/campaigns/${campaign.id}`}>
          <button className="text-sm text-amber-400 hover:text-amber-300 transition-colors mt-3 font-medium">
            View & Sign →
          </button>
        </Link>
      </CardContent>
    </Card>
  );
}
