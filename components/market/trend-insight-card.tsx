"use client";

import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Minus, AlertTriangle, Info, AlertCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { TrendInsight } from "@/types/market";
import { BENCHMARK_TYPE_LABELS } from "@/lib/market/constants";

interface TrendInsightCardProps {
  insight: TrendInsight;
  index?: number;
}

export function TrendInsightCard({ insight, index = 0 }: TrendInsightCardProps) {
  const { trend, benchmark } = insight;

  const isUp = trend.change_percent > 0;
  const isStable = Math.abs(trend.change_percent) < 2;

  const trendIcon = isStable
    ? <Minus className="h-4 w-4 text-slate-400" />
    : isUp
      ? <TrendingUp className="h-4 w-4 text-red-600" />
      : <TrendingDown className="h-4 w-4 text-emerald-600" />;

  const severityConfig = {
    info: { icon: <Info className="h-3 w-3" />, color: "text-blue-700", bg: "bg-blue-50 border-blue-200" },
    warning: { icon: <AlertTriangle className="h-3 w-3" />, color: "text-amber-700", bg: "bg-amber-50 border-amber-200" },
    critical: { icon: <AlertCircle className="h-3 w-3" />, color: "text-red-700", bg: "bg-red-50 border-red-200" },
  };

  const severity = severityConfig[insight.severity] || severityConfig.info;
  const label = benchmark ? (BENCHMARK_TYPE_LABELS[benchmark.benchmark_type as keyof typeof BENCHMARK_TYPE_LABELS] || benchmark.benchmark_type) : "Unknown";

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.1 }}
    >
      <Card className={`${severity.bg} border h-full shadow-sm dark:shadow-slate-900/20 rounded-xl`}>
        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2">
              {trendIcon}
              <span className="text-sm font-black text-slate-900 dark:text-slate-100">{label}</span>
            </div>
            <Badge className={`${severity.bg} ${severity.color} text-[10px] font-bold uppercase tracking-widest gap-0.5 rounded-full px-2 py-0.5 border shadow-sm dark:shadow-slate-900/20`}>
              {severity.icon}
              {insight.severity}
            </Badge>
          </div>

          <p className="text-sm text-slate-600 dark:text-slate-400 font-medium mb-3 leading-relaxed">
            {trend.description}
          </p>

          <div className="flex items-center justify-between">
            <span className={`text-xl font-black ${isStable ? "text-slate-400" : isUp ? "text-red-600" : "text-emerald-600"}`}>
              {isUp ? "+" : ""}{trend.change_percent.toFixed(1)}%
            </span>
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
              {trend.period_months}mo period
            </span>
          </div>

          {insight.actionable_advice && (
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-3 pt-3 border-t border-slate-200 dark:border-slate-700/50 italic">
              💡 {insight.actionable_advice}
            </p>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
