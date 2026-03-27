"use client";

import { useState, useEffect } from "react";
import { TrendingUp, TrendingDown, Minus, BarChart3 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { ComparisonResult } from "@/types/market";
import { HIGHER_IS_WORSE, CLAUSE_TO_BENCHMARK } from "@/lib/market/constants";

interface ClauseMarketBadgeProps {
  clauseId: string;
  clauseType: string;
  extractedValue?: number | null;
  extractedUnit?: string | null;
  documentType: string;
  jurisdiction?: string;
}

export default function ClauseMarketBadge({
  clauseId,
  clauseType,
  extractedValue,
  extractedUnit,
  documentType,
  jurisdiction,
}: ClauseMarketBadgeProps) {
  const [comparison, setComparison] = useState<ComparisonResult | null>(null);
  const [loading, setLoading] = useState(false);

  const benchmarkType = CLAUSE_TO_BENCHMARK[clauseType];

  useEffect(() => {
    if (!benchmarkType || !extractedValue) return;

    const fetchComparison = async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/market/compare", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            clauses: [{
              clause_id: clauseId,
              value: extractedValue,
              unit: extractedUnit || "unknown",
              clause_type: clauseType,
            }],
            document_type: documentType,
            jurisdiction,
          }),
        });

        const data = await res.json();
        if (data.success && data.comparisons?.[0]?.comparison) {
          setComparison(data.comparisons[0].comparison);
        }
      } catch {
        // Silently fail — badge is optional
      } finally {
        setLoading(false);
      }
    };

    fetchComparison();
  }, [clauseId, clauseType, extractedValue, extractedUnit, documentType, jurisdiction, benchmarkType]);

  if (!benchmarkType || !extractedValue || loading) return null;
  if (!comparison) return null;

  const higherIsWorse = HIGHER_IS_WORSE[benchmarkType] ?? true;
  const isFavorable = comparison.is_favorable;

  // Choose icon and colors
  const percentile = comparison.percentile_rank;
  let icon;
  let colorClass;
  let bgClass;
  let label;

  if (isFavorable) {
    icon = higherIsWorse ? <TrendingDown className="h-3 w-3" /> : <TrendingUp className="h-3 w-3" />;
    colorClass = "text-green-400";
    bgClass = "bg-green-500/15 border-green-500/30";
    label = percentile <= 25 ? "Below Market" : "Market OK";
  } else if (percentile >= 75) {
    icon = higherIsWorse ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />;
    colorClass = "text-red-400";
    bgClass = "bg-red-500/15 border-red-500/30";
    label = "Above Market";
  } else {
    icon = <Minus className="h-3 w-3" />;
    colorClass = "text-yellow-400";
    bgClass = "bg-yellow-500/15 border-yellow-500/30";
    label = "Market Avg";
  }

  return (
    <Badge
      className={`${bgClass} ${colorClass} text-[10px] px-1.5 gap-1 cursor-help`}
      title={comparison.narrative || `${percentile}th percentile - ${comparison.scope_used}`}
    >
      {icon}
      <span className="flex items-center gap-0.5">
        <BarChart3 className="h-2.5 w-2.5 opacity-60" />
        {label}
      </span>
    </Badge>
  );
}
