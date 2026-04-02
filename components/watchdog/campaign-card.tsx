"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users } from "lucide-react";
import type { OptoutCampaignWithCompany } from "@/types";

export function CampaignCard({ campaign }: { campaign: OptoutCampaignWithCompany }) {
  const progress = Math.min(100, (campaign.signatory_count / campaign.target_count) * 100);
  const companyName = campaign.company?.name || "Unknown";

  return (
    <Card className="bg-white dark:bg-card border-slate-200 dark:border-slate-700 hover:border-slate-300 hover:shadow-md transition-all rounded-xl overflow-hidden">
      <CardContent className="p-6">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <h3 className="font-black text-slate-900 dark:text-slate-100 text-base mb-1.5">{campaign.title}</h3>
            <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 font-medium">
              <span>vs {companyName}</span>
              <Badge className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full ${ campaign.status === "active" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : campaign.status === "delivered" ? "bg-indigo-50 text-indigo-700 border-indigo-200" : "bg-slate-50 dark:bg-slate-800 text-slate-700 border-slate-200 dark:border-slate-700" }`}>
                {campaign.status}
              </Badge>
            </div>
          </div>
          <div className="text-right flex-shrink-0 bg-amber-50 rounded-xl p-2 border border-amber-100">
            <div className="flex items-center justify-center gap-1.5 text-amber-600">
              <Users className="h-4 w-4" />
              <span className="font-black text-lg leading-none">{campaign.signatory_count}</span>
            </div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mt-1">of {campaign.target_count}</p>
          </div>
        </div>

        <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-5 line-clamp-2 leading-relaxed">
          {campaign.description}
        </p>

        {/* Progress bar */}
        <div className="mb-5">
          <div className="h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden shadow-inner">
            <div
              className="h-full bg-amber-500 rounded-full transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mt-2">
            {Math.round(progress)}% of target
          </p>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-[10px] font-bold uppercase tracking-widest bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1">
              ⚖️ {campaign.legal_basis}
            </Badge>
          </div>

          <Link href={`/watchdog/campaigns/${campaign.id}`}>
            <button className="text-sm font-bold text-amber-600 hover:text-amber-700 transition-colors flex items-center gap-1">
              View & Sign <span aria-hidden="true">&rarr;</span>
            </button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
