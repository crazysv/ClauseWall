"use client";

import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import type { ScoreTrend } from "@/types";

const trendConfig: Record<string, { icon: typeof TrendingUp; color: string; label: string }> = {
  improving: { icon: TrendingUp, color: "text-green-400", label: "Improving" },
  declining: { icon: TrendingDown, color: "text-red-400", label: "Declining" },
  stable: { icon: Minus, color: "text-gray-400", label: "Stable" },
};

export default function TrendIndicator({
  trend,
  detail,
}: {
  trend: ScoreTrend | null;
  detail?: string;
}) {
  const config = trendConfig[trend || "stable"] || trendConfig.stable;
  const Icon = config.icon;

  return (
    <div className={`flex items-center gap-1 text-sm ${config.color}`}>
      <Icon className="h-4 w-4" />
      <span>{detail || config.label}</span>
    </div>
  );
}
