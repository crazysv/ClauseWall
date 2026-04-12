"use client";

import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import type { ScoreTrend } from "@/types";

const trendConfig: Record<
  string,
  { icon: typeof TrendingUp; color: string; label: string }
> = {
  improving: { icon: TrendingUp, color: "text-emerald-500", label: "IMPROVING" },
  declining: { icon: TrendingDown, color: "text-red-500", label: "DECLINING" },
  stable: { icon: Minus, color: "text-neutral-500", label: "STABLE" },
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
    <div className={`flex items-center gap-1 font-mono uppercase tracking-widest text-[10px] ${config.color}`}>
      <Icon className="h-3 w-3" />
      <span>{detail ? `[ ${detail.toUpperCase()} ]` : `[ ${config.label} ]`}</span>
    </div>
  );
}
