"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowUpDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { TosScoreBadge } from "./tos-score-badge";
import { TrendIndicator } from "./trend-indicator";
import type { MonitoredCompany } from "@/types";
import { SECTOR_LABELS } from "./watchdog-constants";

type SortKey = "score" | "name" | "changes";

export function LeaderboardTable({
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

  const SortHeader = ({ label, sortKey }: { label: string; sortKey: SortKey }) => (
    <button
      onClick={() => toggleSort(sortKey)}
      aria-label={`Sort by ${label}`}
      className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-widest hover:text-slate-900 dark:text-slate-100 transition-colors"
    >
      {label}
      <ArrowUpDown className="h-3 w-3 text-slate-400" />
    </button>
  );

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-slate-200 dark:border-slate-700">
            <th className="text-left py-4 px-4 w-12 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
              #
            </th>
            <th className="text-left py-4 px-4">
              <SortHeader label="Company" sortKey="name" />
            </th>
            <th className="text-left py-4 px-4 hidden sm:table-cell text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
              Sector
            </th>
            <th className="text-center py-4 px-4">
              <SortHeader label="Score" sortKey="score" />
            </th>
            <th className="text-center py-4 px-4 hidden sm:table-cell text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
              Trend
            </th>
            <th className="text-center py-4 px-4 hidden md:table-cell">
              <SortHeader label="Changes" sortKey="changes" />
            </th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((company, index) => {
            const rank = index + 1;
            const medal = rank === 1 ? "🥇" : rank === 2 ? "🥈" : rank === 3 ? "🥉" : null;

            return (
              <tr
                key={company.id}
                className="border-b border-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800 dark:bg-slate-800 transition-colors"
              >
                <td className="py-4 px-4 text-center">
                  {medal ? (
                    <span className="text-lg md:text-xl lg:text-2xl drop-shadow-sm dark:shadow-slate-900/20 leading-none">{medal}</span>
                  ) : (
                    <span className="text-sm font-bold text-slate-400">{rank}</span>
                  )}
                </td>
                <td className="py-4 px-4">
                  <Link
                    href={`/watchdog/companies/${company.slug}`}
                    className="font-black text-slate-900 dark:text-slate-100 tracking-tight hover:text-indigo-600 transition-colors"
                  >
                    {company.name}
                  </Link>
                </td>
                <td className="py-4 px-4 hidden sm:table-cell">
                  <Badge variant="outline" className="text-[10px] bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 font-bold uppercase tracking-widest">
                    {SECTOR_LABELS[company.sector] || company.sector}
                  </Badge>
                </td>
                <td className="py-4 px-4 text-center">
                  <TosScoreBadge score={company.current_tos_score} />
                </td>
                <td className="py-4 px-4 hidden sm:table-cell">
                  <div className="flex justify-center">
                    <TrendIndicator trend={company.score_trend} />
                  </div>
                </td>
                <td className="py-4 px-4 text-center hidden md:table-cell">
                  <span className="text-sm font-bold text-slate-500 dark:text-slate-400">{company.total_changes}</span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
