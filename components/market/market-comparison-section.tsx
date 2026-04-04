"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Minus,
  ChevronDown,
  ChevronUp,
  Zap,
  Users,
  ExternalLink,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import BenchmarkChart from "@/components/market/benchmark-chart";
import PercentileBadge from "@/components/market/percentile-badge";
import type { ClauseMarketContext, BenchmarkType } from "@/types/market";
import {
  BENCHMARK_TYPE_LABELS,
  UNIT_LABELS,
  HIGHER_IS_WORSE,
  CLAUSE_TO_BENCHMARK,
} from "@/lib/market/constants";
import Link from "next/link";

interface MarketComparisonSectionProps {
  documentId: string;
  documentType: string;
  jurisdiction?: string;
}

export default function MarketComparisonSection({
  documentId,
  documentType,
  jurisdiction,
}: MarketComparisonSectionProps) {
  const [comparisons, setComparisons] = useState<ClauseMarketContext[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedChart, setExpandedChart] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchComparisons = async () => {
      try {
        const res = await fetch("/api/market/compare", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            document_id: documentId,
            document_type: documentType,
            jurisdiction,
          }),
        });

        const data = await res.json();
        if (data.success) {
          setComparisons(data.comparisons || []);
        }
      } catch {
        setError("Failed to load market data");
      } finally {
        setLoading(false);
      }
    };

    fetchComparisons();
  }, [documentId, documentType, jurisdiction]);

  const comparableItems = comparisons.filter((c) => c.has_data && c.comparison);

  if (loading) {
    return (
      <Card className="bg-background/50 border-foreground border-2 animate-pulse">
        <CardContent className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="h-5 w-5 text-cyan-400" />
            <div className="h-5 w-48 bg-muted rounded" />
          </div>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-white/[0.02] rounded-none" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || comparableItems.length === 0) {
    return null; // Silently hide if no market data
  }

  const unfavorableCount = comparableItems.filter(
    (c) => !c.comparison!.is_favorable,
  ).length;

  return (
    <Card className="bg-background /5 /5 border-cyan-500/15">
      <CardContent className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-none bg-cyan-500/10">
              <BarChart3 className="h-5 w-5 text-cyan-400" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">
                Market Comparison
              </h3>
              <p className="text-xs text-foreground/40">
                How your contract compares to{" "}
                {comparableItems[0]?.comparison?.scope_used || "the market"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {unfavorableCount > 0 && (
              <Badge className="bg-red-500/15 text-red-400 border-red-500/30 text-[10px]">
                {unfavorableCount} above market
              </Badge>
            )}
            <Badge className="bg-cyan-500/15 text-cyan-400 border-cyan-500/30 text-[10px]">
              <Users className="h-3 w-3 mr-0.5" />
              {comparableItems[0]?.sample_count || 0}+ contracts
            </Badge>
          </div>
        </div>

        {/* Comparison Cards */}
        <div className="space-y-2">
          {comparableItems.map((ctx) => {
            if (!ctx.comparison || !ctx.benchmark) return null;

            const benchmarkType = ctx.benchmark.benchmark_type as BenchmarkType;
            const label = BENCHMARK_TYPE_LABELS[benchmarkType] || benchmarkType;
            const higherIsWorse = HIGHER_IS_WORSE[benchmarkType] ?? true;
            const percentile = ctx.comparison.percentile_rank;
            const isExpanded = expandedChart === ctx.clause_id;

            // Percentile bar
            const barWidth = percentile;
            const barColor = ctx.comparison.is_favorable
              ? "bg-green-500"
              : percentile > 75
                ? "bg-red-500"
                : "bg-yellow-500";

            return (
              <div key={ctx.clause_id}>
                <button
                  onClick={() =>
                    setExpandedChart(isExpanded ? null : ctx.clause_id)
                  }
                  className="w-full text-left p-3 rounded-none bg-white/[0.03] hover:bg-white/[0.05] transition-colors border border-foreground border-2"
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      {ctx.comparison.is_favorable ? (
                        <TrendingDown className="h-3.5 w-3.5 text-green-400" />
                      ) : percentile > 75 ? (
                        <TrendingUp className="h-3.5 w-3.5 text-red-400" />
                      ) : (
                        <Minus className="h-3.5 w-3.5 text-yellow-400" />
                      )}
                      <span className="text-sm font-medium text-foreground">
                        {label}
                      </span>
                      <PercentileBadge
                        percentile={percentile}
                        benchmarkType={benchmarkType}
                        size="sm"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-foreground/30">
                        {ctx.comparison.chart_data.user_value}{" "}
                        {UNIT_LABELS[ctx.benchmark.value_unit || ""] || ""}
                      </span>
                      {isExpanded ? (
                        <ChevronUp className="h-3.5 w-3.5 text-foreground/30" />
                      ) : (
                        <ChevronDown className="h-3.5 w-3.5 text-foreground/30" />
                      )}
                    </div>
                  </div>

                  {/* Percentile Bar */}
                  <div className="relative h-1.5 bg-muted rounded-full overflow-hidden">
                    <motion.div
                      className={`absolute left-0 top-0 h-full rounded-full ${barColor}`}
                      initial={{ width: 0 }}
                      animate={{ width: `${barWidth}%` }}
                      transition={{ duration: 0.8, ease: "easeOut" }}
                    />
                    {/* Median marker */}
                    <div
                      className="absolute top-0 h-full w-0.5 bg-muted"
                      style={{ left: "50%" }}
                    />
                  </div>

                  <p className="text-[10px] text-foreground/40 mt-1">
                    {ctx.comparison.narrative}
                  </p>
                </button>

                {/* Expanded Chart */}
                <AnimatePresence>
                  {isExpanded &&
                    ctx.comparison.chart_data.distribution.length > 0 && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="pt-2 pb-1 px-3">
                          <BenchmarkChart
                            distribution={
                              ctx.comparison.chart_data.distribution
                            }
                            userValue={ctx.comparison.chart_data.user_value}
                            median={ctx.comparison.chart_data.median}
                            mean={ctx.comparison.chart_data.mean}
                            p25={ctx.comparison.chart_data.p25}
                            p75={ctx.comparison.chart_data.p75}
                            unit={UNIT_LABELS[ctx.benchmark.value_unit || ""]}
                            height={180}
                          />
                          {ctx.data_quality === "seed" && (
                            <p className="text-[10px] text-foreground/20 text-center mt-1">
                              ⚠ Based on statutory/public reference data, not
                              live analysis
                            </p>
                          )}
                        </div>
                      </motion.div>
                    )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between mt-4 pt-3 border-t border-foreground border-2">
          <p className="text-[10px] text-foreground/25">
            Based on anonymized data from{" "}
            {comparableItems[0]?.sample_count || 0}+ contracts
          </p>
          <Link
            href="/market"
            className="text-[10px] text-cyan-400/60 hover:text-cyan-400 transition-colors flex items-center gap-1"
          >
            Full Market Dashboard <ExternalLink className="h-2.5 w-2.5" />
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
