"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import TosScoreBadge from "./tos-score-badge";
import TrendIndicator from "./trend-indicator";
import WatchlistToggle from "./watchlist-toggle";
import type { MonitoredCompany } from "@/types";

const SECTOR_ICONS: Record<string, string> = {
  ride_hailing: "🚗", food_delivery: "🍔", ecommerce: "🛒", payments: "💳", social: "💬",
  streaming: "🎬", travel: "✈️", banking: "🏦", telecom: "📱", edtech: "📚", government: "🏛️", other: "📋",
};

const SECTOR_LABELS: Record<string, string> = {
  ride_hailing: "Ride-hailing", food_delivery: "Food Delivery", ecommerce: "E-commerce",
  payments: "Payments", social: "Social", streaming: "Streaming", travel: "Travel",
  banking: "Banking", telecom: "Telecom", edtech: "EdTech", government: "Government", other: "Other",
};

export default function CompanyCard({
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
    <Card className="bg-gray-900/50 border-gray-800 hover:border-blue-500/20 transition-all group">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-10 w-10 rounded-lg bg-white/5 flex items-center justify-center text-lg flex-shrink-0">
              {SECTOR_ICONS[company.sector] || "📋"}
            </div>
            <div className="min-w-0">
              <Link href={`/watchdog/companies/${company.slug}`} className="hover:text-blue-400 transition-colors">
                <h3 className="font-semibold truncate">{company.name}</h3>
              </Link>
              <Badge variant="outline" className="text-[10px] border-white/10 text-muted-foreground">
                {SECTOR_LABELS[company.sector] || company.sector}
              </Badge>
            </div>
          </div>
          <TosScoreBadge score={company.current_tos_score} />
        </div>

        {company.score_trend && (
          <div className="mb-3">
            <TrendIndicator trend={company.score_trend} />
          </div>
        )}

        <div className="flex items-center justify-between text-sm text-muted-foreground mb-3">
          <span>Last change: {timeAgo}</span>
          <span>{company.total_changes} total changes</span>
        </div>

        {/* Pro-company vs pro-consumer bar */}
        {company.total_changes > 0 && (
          <div className="mb-3">
            <div className="flex gap-1 h-1.5 rounded-full overflow-hidden bg-gray-800">
              {company.pro_company_changes > 0 && (
                <div
                  className="bg-red-500 rounded-full"
                  style={{ width: `${(company.pro_company_changes / company.total_changes) * 100}%` }}
                />
              )}
              {company.pro_consumer_changes > 0 && (
                <div
                  className="bg-green-500 rounded-full"
                  style={{ width: `${(company.pro_consumer_changes / company.total_changes) * 100}%` }}
                />
              )}
            </div>
            <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
              <span className="text-red-400">{company.pro_company_changes} pro-company</span>
              <span className="text-green-400">{company.pro_consumer_changes} pro-consumer</span>
            </div>
          </div>
        )}

        <div className="flex items-center gap-2">
          {showWatchToggle && (
            <WatchlistToggle companyId={company.id} isWatching={isWatching} />
          )}
          <Link href={`/watchdog/companies/${company.slug}`}>
            <button className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              View Details →
            </button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

function getTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffHours < 1) return "Just now";
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
  return date.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}
