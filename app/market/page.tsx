"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import dynamic from "next/dynamic";
import Link from "next/link";
import {
  BarChart3,
  TrendingUp,
  Map,
  Database,
  ArrowRight,
  Loader2,
  Sparkles,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import MarketOverviewCards from "@/components/market/market-overview-cards";
import TrendInsightCard from "@/components/market/trend-insight-card";
import MarketEmptyState from "@/components/market/market-empty-state";
import MarketStatsFooter from "@/components/market/market-stats-footer";
import type { PlatformStats, GeographicRiskData, TrendInsight } from "@/types/market";
import { SEED_BENCHMARKS, BENCHMARK_TYPE_LABELS, UNIT_LABELS } from "@/lib/market/constants";

// Heavy map component — lazy loaded
const IndiaHeatMap = dynamic(
  () => import("@/components/market/india-heat-map"),
  {
    ssr: false,
    loading: () => (
      <div className="h-[400px] flex items-center justify-center bg-white/[0.02] rounded-xl border border-white/5">
        <Loader2 className="h-6 w-6 text-cyan-400 animate-spin" />
      </div>
    ),
  }
);

export default function MarketDashboardPage() {
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [geoData, setGeoData] = useState<{
    regions: GeographicRiskData[];
    national_average: number;
    total_contracts: number;
    last_updated: string | null;
  } | null>(null);
  const [trends, setTrends] = useState<TrendInsight[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, geoRes, trendsRes] = await Promise.all([
          fetch("/api/market/stats").then((r) => r.json()),
          fetch("/api/market/geographic").then((r) => r.json()),
          fetch("/api/market/trends?significant_only=true&limit=6").then((r) => r.json()),
        ]);

        if (statsRes.success) setStats(statsRes.stats);
        if (geoRes.success) {
          setGeoData({
            regions: geoRes.regions || [],
            national_average: geoRes.national_average || 0,
            total_contracts: geoRes.total_contracts || 0,
            last_updated: geoRes.last_updated || null,
          });
        }
        if (trendsRes.success) setTrends(trendsRes.trends || []);
      } catch (err) {
        console.error("Failed to load market data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white">
        <div className="max-w-6xl mx-auto px-4 py-12">
          <div className="flex items-center justify-center py-24">
            <Loader2 className="h-8 w-8 text-cyan-400 animate-spin" />
          </div>
        </div>
      </div>
    );
  }

  const hasData = (stats?.total_analyzed || 0) > 0;

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20">
              <BarChart3 className="h-6 w-6 text-cyan-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Market Intelligence</h1>
              <p className="text-sm text-white/50">
                Real-time benchmarks from anonymized contract analysis data
              </p>
            </div>
          </div>
        </motion.div>

        {!hasData ? (
          <MarketEmptyState />
        ) : (
          <>
            {/* Stats Overview */}
            {stats && <MarketOverviewCards stats={stats} />}

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
              {/* Left: Heat Map (2 cols) */}
              <div className="lg:col-span-2">
                <Card className="bg-gray-900/50 border-gray-800">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <Map className="h-5 w-5 text-cyan-400" />
                        <h2 className="font-semibold text-white">Geographic Risk Map</h2>
                      </div>
                      <Link
                        href="/market/heatmap"
                        className="text-[10px] text-cyan-400/60 hover:text-cyan-400 transition-colors flex items-center gap-1"
                      >
                        Full Screen <ArrowRight className="h-3 w-3" />
                      </Link>
                    </div>
                    {geoData && (
                      <IndiaHeatMap
                        regions={geoData.regions}
                        nationalAverage={geoData.national_average}
                        totalContracts={geoData.total_contracts}
                      />
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Right: Key Benchmarks + Quick Actions */}
              <div className="space-y-4">
                {/* Key Benchmarks from Seed Data */}
                <Card className="bg-gray-900/50 border-gray-800">
                  <CardContent className="p-5">
                    <div className="flex items-center gap-2 mb-3">
                      <Database className="h-4 w-4 text-amber-400" />
                      <h3 className="font-semibold text-white text-sm">Key Benchmarks</h3>
                    </div>
                    <div className="space-y-3">
                      {Object.entries(SEED_BENCHMARKS).slice(0, 5).map(([type, scopes]) => {
                        const national = scopes['national'];
                        if (!national) return null;
                        const label = BENCHMARK_TYPE_LABELS[type as keyof typeof BENCHMARK_TYPE_LABELS] || type;
                        const unit = UNIT_LABELS[national.unit] || national.unit;

                        return (
                          <div key={type} className="flex items-center justify-between py-1.5 border-b border-white/5 last:border-0">
                            <span className="text-xs text-white/60">{label}</span>
                            <span className="text-sm font-medium text-white">
                              {national.median} {unit}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                    <Link
                      href="/market/benchmarks"
                      className="flex items-center justify-center gap-1 mt-3 py-2 rounded-lg bg-white/[0.03] hover:bg-white/[0.06] transition-colors text-xs text-white/50 hover:text-white/70"
                    >
                      View All Benchmarks <ArrowRight className="h-3 w-3" />
                    </Link>
                  </CardContent>
                </Card>

                {/* Quick Actions */}
                <Card className="bg-gradient-to-br from-cyan-500/5 to-purple-500/5 border-cyan-500/10">
                  <CardContent className="p-5 space-y-2">
                    <h3 className="text-sm font-semibold text-white mb-2 flex items-center gap-1.5">
                      <Sparkles className="h-4 w-4 text-cyan-400" />
                      Explore
                    </h3>
                    {[
                      { href: "/market/benchmarks", label: "Benchmark Explorer", desc: "Filter & compare by type, city, category" },
                      { href: "/market/trends", label: "Market Trends", desc: "Time-series trend detection" },
                      { href: "/market/compare", label: "Compare Your Contract", desc: "Upload & get ammunition report" },
                      { href: "/market/heatmap", label: "Full-Page Heat Map", desc: "Interactive geographic visualization" },
                    ].map((link) => (
                      <Link
                        key={link.href}
                        href={link.href}
                        className="flex items-center justify-between p-2.5 rounded-lg bg-white/[0.02] hover:bg-white/[0.05] transition-colors border border-white/5 group"
                      >
                        <div>
                          <p className="text-xs font-medium text-white">{link.label}</p>
                          <p className="text-[10px] text-white/30">{link.desc}</p>
                        </div>
                        <ArrowRight className="h-3.5 w-3.5 text-white/20 group-hover:text-white/50 group-hover:translate-x-0.5 transition-all" />
                      </Link>
                    ))}
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Trending Insights */}
            {trends.length > 0 && (
              <div className="mt-8">
                <div className="flex items-center gap-2 mb-4">
                  <TrendingUp className="h-5 w-5 text-rose-400" />
                  <h2 className="font-semibold text-white">Trending Insights</h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {trends.map((insight, i) => (
                    <TrendInsightCard key={insight.trend.id} insight={insight} index={i} />
                  ))}
                </div>
              </div>
            )}

            {/* Footer */}
            <MarketStatsFooter
              totalContracts={geoData?.total_contracts || stats?.total_analyzed || 0}
              lastUpdated={geoData?.last_updated || null}
            />
          </>
        )}
      </div>
    </div>
  );
}
