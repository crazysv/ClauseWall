"use client";

import { motion } from "framer-motion";
import {
  TrendingUp,
  TrendingDown,
  Minus,
  AlertTriangle,
  Info,
  AlertCircle,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { TrendInsight } from "@/types/market";
import { BENCHMARK_TYPE_LABELS } from "@/lib/market/constants";

interface TrendInsightCardProps {
  insight: TrendInsight;
  index?: number;
}

export default function TrendInsightCard({
  insight,
  index = 0,
}: TrendInsightCardProps) {
  const { trend, benchmark } = insight;

  const isUp = trend.change_percent > 0;
  const isStable = Math.abs(trend.change_percent) < 2;

  const trendIcon = isStable ? (
    <Minus className="h-4 w-4 text-foreground" />
  ) : isUp ? (
    <TrendingUp className="h-4 w-4 text-red-400" />
  ) : (
    <TrendingDown className="h-4 w-4 text-green-400" />
  );

  const severityConfig = {
    info: {
      icon: <Info className="h-3 w-3" />,
      color: "text-blue-400",
      bg: "bg-blue-500/10 border-blue-500/20",
    },
    warning: {
      icon: <AlertTriangle className="h-3 w-3" />,
      color: "text-yellow-400",
      bg: "bg-yellow-500/10 border-yellow-500/20",
    },
    critical: {
      icon: <AlertCircle className="h-3 w-3" />,
      color: "text-red-400",
      bg: "bg-red-500/10 border-red-500/20",
    },
  };

  const severity = severityConfig[insight.severity] || severityConfig.info;
  const label = benchmark
    ? BENCHMARK_TYPE_LABELS[
        benchmark.benchmark_type as keyof typeof BENCHMARK_TYPE_LABELS
      ] || benchmark.benchmark_type
    : "Unknown";

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.1 }}
    >
      <Card className={`${severity.bg} border h-full`}>
        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center gap-2">
              {trendIcon}
              <span className="text-sm font-medium text-foreground">
                {label}
              </span>
            </div>
            <Badge
              className={`${severity.bg} ${severity.color} text-[10px] gap-0.5`}
            >
              {severity.icon}
              {insight.severity}
            </Badge>
          </div>

          <p className="text-xs text-foreground mb-2 leading-relaxed">
            {trend.description}
          </p>

          <div className="flex items-center justify-between">
            <span
              className={`text-lg font-bold ${isStable ? "text-foreground" : isUp ? "text-red-400" : "text-green-400"}`}
            >
              {isUp ? "+" : ""}
              {trend.change_percent.toFixed(1)}%
            </span>
            <span className="text-[10px] text-foreground">
              {trend.period_months}mo period
            </span>
          </div>

          {insight.actionable_advice && (
            <p className="text-[10px] text-foreground mt-2 pt-2 border-t border-foreground border-2 italic">
              💡 {insight.actionable_advice}
            </p>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
