"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  Zap,
  ArrowLeft,
  Upload,
  BarChart3,
  ArrowRight,
  Loader2,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { ClauseMarketContext } from "@/types/market";
import {
  BENCHMARK_TYPE_LABELS,
  UNIT_LABELS,
  HIGHER_IS_WORSE,
} from "@/lib/market/constants";
import type { BenchmarkType } from "@/types/market";

export default function ComparePage() {
  const [documentId, setDocumentId] = useState("");
  const [comparisons, setComparisons] = useState<ClauseMarketContext[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runComparison = async () => {
    if (!documentId.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/market/compare", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          document_id: documentId,
          document_type: "rental",
        }),
      });
      const data = await res.json();
      if (data.success) {
        setComparisons(data.comparisons || []);
      } else {
        setError(data.error || "Comparison failed");
      }
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  };

  const comparableItems = comparisons.filter((c) => c.has_data && c.comparison);

  return (
    <div className="min-h-screen bg-black text-foreground">
      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Link
            href="/market"
            className="text-xs text-foreground hover:text-foreground mb-3 flex items-center gap-1"
          >
            <ArrowLeft className="h-3 w-3" /> Back to Market Dashboard
          </Link>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-none bg-background /20 /20">
              <Zap className="h-6 w-6 text-cyan-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Compare Your Contract</h1>
              <p className="text-sm text-foreground">
                Enter your analyzed document ID to compare against market
                benchmarks
              </p>
            </div>
          </div>
        </motion.div>

        {/* Input */}
        <Card className="bg-background/50 border-foreground border-2 mb-6">
          <CardContent className="p-5">
            <label className="text-xs text-foreground mb-2 block">
              Document ID
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={documentId}
                onChange={(e) => setDocumentId(e.target.value)}
                placeholder="Paste your document ID here..."
                className="flex-1 bg-white/[0.03] border border-foreground border-2 rounded-none px-4 py-2.5 text-sm text-foreground placeholder-white/20 focus:outline-none focus:border-cyan-500/30"
              />
              <button
                onClick={runComparison}
                disabled={loading || !documentId.trim()}
                className="px-5 py-2.5 rounded-none bg-cyan-500/15 text-cyan-400 hover:bg-cyan-500/25 transition-colors text-sm font-medium disabled:opacity-50 flex items-center gap-2"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <BarChart3 className="h-4 w-4" />
                )}
                Compare
              </button>
            </div>
            {error && <p className="text-xs text-red-400 mt-2">{error}</p>}
            <p className="text-[10px] text-foreground mt-2">
              💡 Tip: You can find your document ID in the URL of any analysis
              result page.
            </p>
          </CardContent>
        </Card>

        {/* Results */}
        {comparableItems.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-foreground">
                {comparableItems.length} Comparable Terms Found
              </h3>
              <Badge className="bg-cyan-500/15 text-cyan-400 border-cyan-500/30 text-[10px]">
                vs. market
              </Badge>
            </div>

            {comparableItems.map((ctx) => {
              if (!ctx.comparison || !ctx.benchmark) return null;
              const benchmarkType = ctx.benchmark
                .benchmark_type as BenchmarkType;
              const label =
                BENCHMARK_TYPE_LABELS[benchmarkType] || benchmarkType;
              const unit = UNIT_LABELS[ctx.benchmark.value_unit || ""] || "";
              const higherIsWorse = HIGHER_IS_WORSE[benchmarkType] ?? true;

              return (
                <Card
                  key={ctx.clause_id}
                  className="bg-white/[0.02] border-foreground border-2"
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-foreground">
                        {label}
                      </span>
                      <Badge
                        className={`text-[10px] ${ctx.comparison.is_favorable ? "bg-green-500/15 text-green-400 border-green-500/30" : "bg-red-500/15 text-red-400 border-red-500/30"}`}
                      >
                        P{ctx.comparison.percentile_rank} —{" "}
                        {ctx.comparison.is_favorable
                          ? "Favorable"
                          : "Unfavorable"}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-3 gap-2 mb-2">
                      <div className="text-center p-1.5 rounded bg-white/[0.03]">
                        <p className="text-sm font-bold text-foreground">
                          {ctx.comparison.chart_data.user_value} {unit}
                        </p>
                        <p className="text-[10px] text-foreground">
                          Your Value
                        </p>
                      </div>
                      <div className="text-center p-1.5 rounded bg-white/[0.03]">
                        <p className="text-sm font-bold text-amber-400">
                          {ctx.comparison.chart_data.median} {unit}
                        </p>
                        <p className="text-[10px] text-foreground">Median</p>
                      </div>
                      <div className="text-center p-1.5 rounded bg-white/[0.03]">
                        <p className="text-sm font-bold text-foreground">
                          {ctx.benchmark.sample_count}
                        </p>
                        <p className="text-[10px] text-foreground">
                          Samples
                        </p>
                      </div>
                    </div>
                    <p className="text-[10px] text-foreground">
                      {ctx.comparison.narrative}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {comparisons.length > 0 && comparableItems.length === 0 && (
          <div className="text-center py-12 text-foreground">
            <BarChart3 className="h-10 w-10 mx-auto mb-3 opacity-20" />
            <p className="text-sm">
              No comparable market data found for this document&apos;s clauses.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
