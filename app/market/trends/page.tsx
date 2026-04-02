"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  TrendingUp,
  ArrowLeft,
  Loader2,
  BarChart3,
  AlertTriangle,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { Card, CardContent } from "@/components/ui/card";
import { TrendInsightCard } from "@/components/market/trend-insight-card";
import { MarketStatsFooter } from "@/components/market/market-stats-footer";
import type { TrendInsight } from "@/types/market";

export default function TrendsPage() {
  const [trends, setTrends] = useState<TrendInsight[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/market/trends?limit=20")
      .then((r) => r.json())
      .then((data) => {
        if (data.success) setTrends(data.trends || []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const alerts = trends.filter((t) => t.trend.is_alert);
  const significant = trends.filter((t) => t.trend.is_significant && !t.trend.is_alert);
  const stable = trends.filter((t) => !t.trend.is_significant && !t.trend.is_alert);

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <Link href="/market" className="text-xs text-white/30 hover:text-white/50 mb-3 flex items-center gap-1">
            <ArrowLeft className="h-3 w-3" /> Back to Market Dashboard
          </Link>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-rose-500/20 to-orange-500/20">
              <TrendingUp className="h-6 w-6 text-rose-400" />
            </div>
            <div>
              <h1 className="text-lg md:text-xl lg:text-2xl font-bold">Market Trends</h1>
              <p className="text-sm text-white/50">Time-series trend detection from benchmark snapshots</p>
            </div>
          </div>
        </motion.div>

        {loading ? (
          <div className="flex items-center justify-center py-6 md:py-8 lg:py-12 md:py-8 md:py-6 md:py-8 lg:py-12 lg:py-16 lg:py-24">
            <Loader2 className="h-8 w-8 text-cyan-400 animate-spin" />
          </div>
        ) : trends.length === 0 ? (
          <div className="text-center py-20">
            <BarChart3 className="h-12 w-12 text-white/10 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white/60">No Trends Detected Yet</h3>
            <p className="text-sm text-white/30 mt-2 max-w-md mx-auto">
              Trends are detected automatically as more contracts are analyzed over time.
              Keep analyzing contracts to build trend data.
            </p>
          </div>
        ) : (
          <>
            {/* Alerts */}
            {alerts.length > 0 && (
              <div className="mb-8">
                <div className="flex items-center gap-2 mb-3">
                  <AlertTriangle className="h-4 w-4 text-red-400" />
                  <h2 className="font-semibold text-red-400 text-sm">Active Alerts</h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {alerts.map((t, i) => (
                    <TrendInsightCard key={t.trend.id} insight={t} index={i} />
                  ))}
                </div>
              </div>
            )}

            {/* Significant Trends */}
            {significant.length > 0 && (
              <div className="mb-8">
                <div className="flex items-center gap-2 mb-3">
                  <TrendingUp className="h-4 w-4 text-amber-400" />
                  <h2 className="font-semibold text-white text-sm">Significant Trends</h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {significant.map((t, i) => (
                    <TrendInsightCard key={t.trend.id} insight={t} index={i} />
                  ))}
                </div>
              </div>
            )}

            {/* Stable Metrics */}
            {stable.length > 0 && (
              <div className="mb-8">
                <div className="flex items-center gap-2 mb-3">
                  <BarChart3 className="h-4 w-4 text-slate-400" />
                  <h2 className="font-semibold text-white/60 text-sm">Stable Metrics</h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {stable.map((t, i) => (
                    <TrendInsightCard key={t.trend.id} insight={t} index={i} />
                  ))}
                </div>
              </div>
            )}

            <MarketStatsFooter totalContracts={0} lastUpdated={null} />
          </>
        )}
      </div>
    </div>
  );
}
