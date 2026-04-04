"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { Database, ArrowLeft, Loader2, BarChart3 } from "lucide-react";
import BenchmarkTable from "@/components/market/benchmark-table";
import CategoryFilterBar from "@/components/market/category-filter-bar";
import MarketStatsFooter from "@/components/market/market-stats-footer";
import type { MarketBenchmark } from "@/types/market";

export default function BenchmarkExplorerPage() {
  const [benchmarks, setBenchmarks] = useState<MarketBenchmark[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState("all");
  const [filterScope, setFilterScope] = useState("all");
  const [filterDocType, setFilterDocType] = useState("all");

  useEffect(() => {
    const params = new URLSearchParams();
    if (filterType !== "all") params.set("type", filterType);
    if (filterDocType !== "all") params.set("document_type", filterDocType);
    if (filterScope !== "all") {
      params.set(
        "scope_type",
        filterScope === "national" ? "national" : "state",
      );
      params.set(
        "scope_value",
        filterScope === "national" ? "all" : filterScope,
      );
    }
    params.set("limit", "100");

    setLoading(true);
    fetch(`/api/market/benchmarks?${params.toString()}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.success) setBenchmarks(data.benchmarks || []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [filterType, filterScope, filterDocType]);

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <Link
            href="/market"
            className="text-xs text-white/30 hover:text-white/50 mb-3 flex items-center gap-1"
          >
            <ArrowLeft className="h-3 w-3" /> Back to Market Dashboard
          </Link>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20">
              <Database className="h-6 w-6 text-amber-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Benchmark Explorer</h1>
              <p className="text-sm text-white/50">
                Filter and compare market benchmarks by metric, contract type,
                and region
              </p>
            </div>
          </div>
        </motion.div>

        {/* Filters */}
        <CategoryFilterBar
          selectedType={filterType}
          selectedScope={filterScope}
          selectedDocType={filterDocType}
          onTypeChange={setFilterType}
          onScopeChange={setFilterScope}
          onDocTypeChange={setFilterDocType}
        />

        {/* Results */}
        <div className="mt-6">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-6 w-6 text-cyan-400 animate-spin" />
            </div>
          ) : benchmarks.length === 0 ? (
            <div className="text-center py-16">
              <BarChart3 className="h-10 w-10 text-white/10 mx-auto mb-3" />
              <p className="text-sm text-white/40">
                No benchmarks match your filters.
              </p>
              <p className="text-xs text-white/20 mt-1">
                Try broadening your filters or analyze more contracts to build
                data.
              </p>
            </div>
          ) : (
            <>
              <p className="text-xs text-white/30 mb-3">
                Showing {benchmarks.length} benchmark
                {benchmarks.length !== 1 ? "s" : ""}
              </p>
              <BenchmarkTable benchmarks={benchmarks} />
            </>
          )}
        </div>

        <MarketStatsFooter totalContracts={0} lastUpdated={null} />
      </div>
    </div>
  );
}
