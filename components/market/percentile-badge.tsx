"use client";

import { Badge } from "@/components/ui/badge";
import { HIGHER_IS_WORSE } from "@/lib/market/constants";
import type { BenchmarkType } from "@/types/market";

interface PercentileBadgeProps {
  percentile: number;
  benchmarkType: BenchmarkType;
  size?: "sm" | "md" | "lg";
}

export default function PercentileBadge({
  percentile,
  benchmarkType,
  size = "md",
}: PercentileBadgeProps) {
  const higherIsWorse = HIGHER_IS_WORSE[benchmarkType] ?? true;

  // Determine color based on percentile and direction
  let bgColor: string;
  let textColor: string;
  let label: string;

  const effective = higherIsWorse ? percentile : 100 - percentile;

  if (effective <= 25) {
    bgColor = "bg-green-500/15 border-green-500/30";
    textColor = "text-green-400";
    label = "Favorable";
  } else if (effective <= 50) {
    bgColor = "bg-emerald-500/15 border-emerald-500/30";
    textColor = "text-emerald-400";
    label = "Good";
  } else if (effective <= 75) {
    bgColor = "bg-yellow-500/15 border-yellow-500/30";
    textColor = "text-yellow-400";
    label = "Above Avg";
  } else {
    bgColor = "bg-red-500/15 border-red-500/30";
    textColor = "text-red-400";
    label = "Unfavorable";
  }

  const sizeClasses = {
    sm: "text-[10px] px-1.5 py-0",
    md: "text-xs px-2 py-0.5",
    lg: "text-sm px-3 py-1",
  };

  return (
    <Badge className={`${bgColor} ${textColor} ${sizeClasses[size]}`}>
      P{percentile} — {label}
    </Badge>
  );
}
