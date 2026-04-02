"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TosScoreBadge } from "./tos-score-badge";
import { TrendIndicator } from "./trend-indicator";
import { WatchlistToggle } from "./watchlist-toggle";
import type { MonitoredCompany } from "@/types";
import { SECTOR_ICONS, SECTOR_LABELS, getTimeAgo } from "./watchdog-constants";

export function CompanyCard({
  company,
  isWatching = false,
  showWatchToggle = true,
}: {
  company: MonitoredCompany;
  isWatching?: boolean;
  showWatchToggle?: boolean;
}) {
  const timeAgo = company.last_change_detected
    ? getTimeAgo(new Date(company.last_change_detected))
    : "No changes yet";

  return (
    <Card className="bg-white dark:bg-card border-slate-200 dark:border-slate-700 hover:border-slate-300 hover:shadow-md transition-all group rounded-xl overflow-hidden">
      <CardContent className="p-5 sm:p-6">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-10 w-10 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100 flex items-center justify-center text-lg flex-shrink-0 shadow-sm dark:shadow-slate-900/20 drop-shadow-sm dark:shadow-slate-900/20">
              {SECTOR_ICONS[company.sector] || "📋"}
            </div>
            <div className="min-w-0">
              <Link href={`/watchdog/companies/${company.slug}`} className="hover:text-indigo-600 transition-colors">
                <h3 className="font-black text-slate-900 dark:text-slate-100 text-lg truncate mb-0.5 leading-tight">{company.name}</h3>
              </Link>
              <Badge variant="outline" className="text-[10px] font-bold uppercase tracking-widest bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700 px-2 py-0.5 rounded-md">
                {SECTOR_LABELS[company.sector] || company.sector}
              </Badge>
            </div>
          </div>
          <TosScoreBadge score={company.current_tos_score} />
        </div>

        {company.score_trend && (
          <div className="mb-4">
            <TrendIndicator trend={company.score_trend} />
          </div>
        )}

        <div className="flex items-center justify-between text-xs font-bold uppercase tracking-widest text-slate-400 mb-4 pt-4 border-t border-slate-100">
          <span>Last change: {timeAgo}</span>
          <span>{company.total_changes} changes</span>
        </div>

        {/* Pro-company vs pro-consumer bar */}
        {company.total_changes > 0 && (
          <div className="mb-5">
            <div className="flex gap-1 h-2 rounded-full overflow-hidden bg-slate-100 dark:bg-slate-800 shadow-inner">
              {company.pro_company_changes > 0 && (
                <div
                  className="bg-red-500 rounded-full"
                  style={{ width: `${(company.pro_company_changes / company.total_changes) * 100}%` }}
                />
              )}
              {company.pro_consumer_changes > 0 && (
                <div
                  className="bg-emerald-500 rounded-full"
                  style={{ width: `${(company.pro_consumer_changes / company.total_changes) * 100}%` }}
                />
              )}
            </div>
            <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest mt-2">
              <span className="text-red-600">{company.pro_company_changes} pro-company</span>
              <span className="text-emerald-600">{company.pro_consumer_changes} pro-consumer</span>
            </div>
          </div>
        )}

        <div className="flex items-center gap-3">
          {showWatchToggle && (
            <WatchlistToggle companyId={company.id} isWatching={isWatching} />
          )}
          <Link href={`/watchdog/companies/${company.slug}`}>
            <button className="text-sm font-bold text-indigo-600 hover:text-indigo-800 transition-colors flex items-center gap-1">
              View Details <span aria-hidden="true">&rarr;</span>
            </button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

