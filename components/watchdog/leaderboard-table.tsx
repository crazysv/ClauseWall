"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowUpDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import TosScoreBadge from "./tos-score-badge";
import TrendIndicator from "./trend-indicator";
import type { MonitoredCompany } from "@/types";

const SECTOR_LABELS: Record<string, string> = {
  ride_hailing: "Ride-hailing",
  food_delivery: "Food Delivery",
  ecommerce: "E-commerce",
  payments: "Payments",
  social: "Social",
  streaming: "Streaming",
  travel: "Travel",
  banking: "Banking",
  telecom: "Telecom",
  edtech: "EdTech",
  government: "Government",
  other: "Other",
};

type SortKey = "score" | "name" | "changes";

export default function LeaderboardTable({
  companies,
}: {
  companies: MonitoredCompany[];
}) {
  const [sortBy, setSortBy] = useState<SortKey>("score");
  const [sortAsc, setSortAsc] = useState(true);

  const sorted = [...companies].sort((a, b) => {
    let cmp = 0;
    switch (sortBy) {
      case "score":
        cmp = (a.current_tos_score || 0) - (b.current_tos_score || 0);
        break;
      case "name":
        cmp = a.name.localeCompare(b.name);
        break;
      case "changes":
        cmp = a.total_changes - b.total_changes;
        break;
    }
    return sortAsc ? cmp : -cmp;
  });

  const toggleSort = (key: SortKey) => {
    if (sortBy === key) {
      setSortAsc(!sortAsc);
    } else {
      setSortBy(key);
      setSortAsc(key === "score");
    }
  };

  const SortHeader = ({
    label,
    sortKey,
  }: {
    label: string;
    sortKey: SortKey;
  }) => (
    <button
      onClick={() => toggleSort(sortKey)}
      className="flex items-center gap-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider hover:text-foreground transition-colors"
    >
      {label}
      <ArrowUpDown className="h-3 w-3" />
    </button>
  );

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-800">
            <th className="text-left py-3 px-4 w-12">
              <span className="text-xs font-semibold text-muted-foreground">
                #
              </span>
            </th>
            <th className="text-left py-3 px-4">
              <SortHeader label="Company" sortKey="name" />
            </th>
            <th className="text-left py-3 px-4 hidden sm:table-cell">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Sector
              </span>
            </th>
            <th className="text-center py-3 px-4">
              <SortHeader label="Score" sortKey="score" />
            </th>
            <th className="text-center py-3 px-4 hidden sm:table-cell">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Trend
              </span>
            </th>
            <th className="text-center py-3 px-4 hidden md:table-cell">
              <SortHeader label="Changes" sortKey="changes" />
            </th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((company, index) => {
            const rank = index + 1;
            const medal =
              rank === 1 ? "🥇" : rank === 2 ? "🥈" : rank === 3 ? "🥉" : null;

            return (
              <tr
                key={company.id}
                className="border-b border-gray-800/50 hover:bg-white/[0.02] transition-colors"
              >
                <td className="py-3 px-4 text-center">
                  {medal ? (
                    <span className="text-lg">{medal}</span>
                  ) : (
                    <span className="text-sm text-muted-foreground">
                      {rank}
                    </span>
                  )}
                </td>
                <td className="py-3 px-4">
                  <Link
                    href={`/watchdog/companies/${company.slug}`}
                    className="font-medium hover:text-blue-400 transition-colors"
                  >
                    {company.name}
                  </Link>
                </td>
                <td className="py-3 px-4 hidden sm:table-cell">
                  <Badge
                    variant="outline"
                    className="text-[10px] border-foreground border-2"
                  >
                    {SECTOR_LABELS[company.sector] || company.sector}
                  </Badge>
                </td>
                <td className="py-3 px-4 text-center">
                  <TosScoreBadge score={company.current_tos_score} />
                </td>
                <td className="py-3 px-4 hidden sm:table-cell">
                  <div className="flex justify-center">
                    <TrendIndicator trend={company.score_trend} />
                  </div>
                </td>
                <td className="py-3 px-4 text-center hidden md:table-cell">
                  <span className="text-sm text-muted-foreground">
                    {company.total_changes}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
