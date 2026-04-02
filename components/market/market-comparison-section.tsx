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
import { BenchmarkChart } from "@/components/market/benchmark-chart";
import { PercentileBadge } from "@/components/market/percentile-badge";
import type { ClauseMarketContext, BenchmarkType } from "@/types/market";
import { BENCHMARK_TYPE_LABELS, UNIT_LABELS, HIGHER_IS_WORSE, CLAUSE_TO_BENCHMARK } from "@/lib/market/constants";
import Link from "next/link";

interface MarketComparisonSectionProps {
  documentId: string;
  documentType: string;
  jurisdiction?: string;
}

export function MarketComparisonSection({
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
      <Card className="bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 shadow-sm dark:shadow-slate-900/20 animate-pulse">
        <CardContent className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="h-5 w-5 text-teal-600" />
            <div className="h-5 w-48 bg-slate-200 rounded" />
          </div>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-white dark:bg-card border border-slate-100 shadow-sm dark:shadow-slate-900/20 rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || comparableItems.length === 0) {
    return null; // Silently hide if no market data
  }

  const unfavorableCount = comparableItems.filter((c) => !c.comparison!.is_favorable).length;

  return (
    <Card className="bg-gradient-to-br from-teal-50 to-indigo-50 border border-teal-100 shadow-sm dark:shadow-slate-900/20">
      <CardContent className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-white dark:bg-card shadow-sm dark:shadow-slate-900/20">
              <BarChart3 className="h-5 w-5 text-teal-600" />
            </div>
            <div>
              <h3 className="font-black text-slate-900 dark:text-slate-100 tracking-tight">Market Comparison</h3>
              <p className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mt-0.5">
                How your contract compares to {comparableItems[0]?.comparison?.scope_used || "the market"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {unfavorableCount > 0 && (
              <Badge className="bg-red-50 text-red-700 border-red-200 font-bold px-2.5 py-0.5 text-[10px] rounded-full">
                {unfavorableCount} above market
              </Badge>
            )}
            <Badge className="bg-teal-50 text-teal-700 border-teal-200 font-bold px-2.5 py-0.5 text-[10px] rounded-full flex gap-1">
              <Users className="h-3 w-3" />
              {comparableItems[0]?.sample_count || 0}+ contracts
            </Badge>
          </div>
        </div>

        {/* Comparison Cards */}
        <div className="space-y-2">
          {comparableItems.map((ctx) => {
            if (!ctx.comparison || !ctx.benchmark) return null;

            const benchmarkType = ctx.benchmark.benchmark_type as BenchmarkType;
            const label =
              BENCHMARK_TYPE_LABELS[benchmarkType] || benchmarkType;
            const higherIsWorse = HIGHER_IS_WORSE[benchmarkType] ?? true;
            const percentile = ctx.comparison.percentile_rank;
            const isExpanded = expandedChart === ctx.clause_id;

            // Percentile bar
            const barWidth = percentile;
            const barColor = ctx.comparison.is_favorable
              ? "bg-emerald-500"
              : percentile > 75
                ? "bg-red-500"
                : "bg-amber-500";

            return (
              <div key={ctx.clause_id}>
                <button
                  onClick={() =>
                    setExpandedChart(isExpanded ? null : ctx.clause_id)
                  }
                  className="w-full text-left p-4 rounded-xl bg-white dark:bg-card hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors border border-slate-200 dark:border-slate-700 shadow-sm dark:shadow-slate-900/20 mb-2"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {ctx.comparison.is_favorable ? (
                        <TrendingDown className="h-4 w-4 text-emerald-600" />
                      ) : percentile > 75 ? (
                        <TrendingUp className="h-4 w-4 text-red-600" />
                      ) : (
                        <Minus className="h-4 w-4 text-amber-600" />
                      )}
                      <span className="text-sm font-bold text-slate-900 dark:text-slate-100">
                        {label}
                      </span>
                      <PercentileBadge
                        percentile={percentile}
                        benchmarkType={benchmarkType}
                        size="sm"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                        {ctx.comparison.chart_data.user_value}{" "}
                        {UNIT_LABELS[ctx.benchmark.value_unit || ""] || ""}
                      </span>
                      {isExpanded ? (
                        <ChevronUp className="h-4 w-4 text-slate-400" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-slate-400" />
                      )}
                    </div>
                  </div>

                  {/* Percentile Bar */}
                  <div className="relative h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden mt-2">
                    <motion.div
                      className={`absolute left-0 top-0 h-full rounded-full ${barColor}`}
                      initial={{ width: 0 }}
                      animate={{ width: `${barWidth}%` }}
                      transition={{ duration: 0.8, ease: "easeOut" }}
                    />
                    {/* Median marker */}
                    <div
                      className="absolute top-0 h-full w-0.5 bg-slate-400"
                      style={{ left: "50%" }}
                    />
                  </div>

                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-2">
                    {ctx.comparison.narrative}
                  </p>
                </button>

                {/* Expanded Chart */}
                <AnimatePresence>
                  {isExpanded && ctx.comparison.chart_data.distribution.length > 0 && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="pt-2 pb-1 px-3">
                        <BenchmarkChart
                          distribution={ctx.comparison.chart_data.distribution}
                          userValue={ctx.comparison.chart_data.user_value}
                          median={ctx.comparison.chart_data.median}
                          mean={ctx.comparison.chart_data.mean}
                          p25={ctx.comparison.chart_data.p25}
                          p75={ctx.comparison.chart_data.p75}
                          unit={UNIT_LABELS[ctx.benchmark.value_unit || ""]}
                          height={180}
                        />
                        {ctx.data_quality === "seed" && (
                          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 text-center mt-2 pb-2">
                            ⚠ Based on statutory/public reference data, not live analysis
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
        <div className="flex items-center justify-between mt-5 pt-4 border-t border-slate-200 dark:border-slate-700">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
            Based on anonymized data from {comparableItems[0]?.sample_count || 0}+ contracts
          </p>
          <Link
            href="/market"
            className="text-[10px] font-bold uppercase tracking-widest text-teal-600 hover:text-teal-700 transition-colors flex items-center gap-1.5"
          >
            Full Market Dashboard <ExternalLink className="h-3 w-3" />
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
