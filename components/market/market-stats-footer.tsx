"use client";

import { Database, Shield } from "lucide-react";

interface MarketStatsFooterProps {
  totalContracts: number;
  lastUpdated: string | null;
}

export default function MarketStatsFooter({
  totalContracts,
  lastUpdated,
}: MarketStatsFooterProps) {
  const formattedDate = lastUpdated
    ? new Date(lastUpdated).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "N/A";

  return (
    <div className="flex flex-wrap items-center justify-between gap-2 py-4 px-1 border-t border-white/5 mt-8">
      <div className="flex items-center gap-4 text-[10px] text-white/25">
        <span className="flex items-center gap-1">
          <Database className="h-3 w-3" />
          Based on {totalContracts.toLocaleString()} anonymized contracts
        </span>
        <span>Last updated: {formattedDate}</span>
      </div>
      <div className="flex items-center gap-1 text-[10px] text-white/20">
        <Shield className="h-3 w-3" />
        All data is anonymized & aggregated. No individual contract data is exposed.
      </div>
    </div>
  );
}
