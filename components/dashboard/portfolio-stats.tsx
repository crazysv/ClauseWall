"use client";

import { motion } from "framer-motion";
import {
  FileSearch,
  AlertTriangle,
  TrendingDown,
  TrendingUp,
  Minus,
  IndianRupee,
  Hammer,
  ShieldAlert,
} from "lucide-react";
import type { PortfolioStats } from "@/types";
import { formatIndianCurrency } from "@/lib/stats/portfolio-stats";

interface PortfolioStatsProps {
  stats: PortfolioStats;
}

export default function PortfolioStatsSection({ stats }: PortfolioStatsProps) {
  const cards = [
    {
      label: "Contracts Scanned",
      value: stats.totalContracts.toString(),
      subtext: `${stats.totalClauses} clauses analyzed`,
      icon: <FileSearch className="w-5 h-5" />,
      color: "blue",
      bg: "bg-blue-500/10",
      border: "border-blue-500/20",
      iconColor: "text-blue-400",
    },
    {
      label: "Risky Clauses Found",
      value: (stats.dangerousClausesCount + stats.illegalClausesCount).toString(),
      subtext: `${stats.illegalClausesCount} illegal · ${stats.dangerousClausesCount} dangerous`,
      icon: <ShieldAlert className="w-5 h-5" />,
      color: "red",
      bg: "bg-red-500/10",
      border: "border-red-500/20",
      iconColor: "text-red-400",
    },
    {
      label: "Risk Trend",
      value:
        stats.riskTrend === "improving"
          ? `↓ ${stats.riskTrendPercentage}%`
          : stats.riskTrend === "worsening"
          ? `↑ ${stats.riskTrendPercentage}%`
          : "Stable",
      subtext:
        stats.riskTrend === "improving"
          ? "Your contracts are getting safer!"
          : stats.riskTrend === "worsening"
          ? "Recent contracts are riskier"
          : `Average risk: ${stats.averageRiskScore}/100`,
      icon:
        stats.riskTrend === "improving" ? (
          <TrendingDown className="w-5 h-5" />
        ) : stats.riskTrend === "worsening" ? (
          <TrendingUp className="w-5 h-5" />
        ) : (
          <Minus className="w-5 h-5" />
        ),
      color:
        stats.riskTrend === "improving"
          ? "emerald"
          : stats.riskTrend === "worsening"
          ? "amber"
          : "gray",
      bg:
        stats.riskTrend === "improving"
          ? "bg-emerald-500/10"
          : stats.riskTrend === "worsening"
          ? "bg-amber-500/10"
          : "bg-gray-500/10",
      border:
        stats.riskTrend === "improving"
          ? "border-emerald-500/20"
          : stats.riskTrend === "worsening"
          ? "border-amber-500/20"
          : "border-gray-500/20",
      iconColor:
        stats.riskTrend === "improving"
          ? "text-emerald-400"
          : stats.riskTrend === "worsening"
          ? "text-amber-400"
          : "text-gray-400",
    },
    {
      label: "Potential Savings",
      value: formatIndianCurrency(stats.estimatedSavings),
      subtext:
        stats.contractsBuilt > 0
          ? `${stats.contractsBuilt} fair contract${stats.contractsBuilt > 1 ? "s" : ""} built`
          : "By spotting risky clauses",
      icon: <IndianRupee className="w-5 h-5" />,
      color: "emerald",
      bg: "bg-emerald-500/10",
      border: "border-emerald-500/20",
      iconColor: "text-emerald-400",
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, index) => (
        <motion.div
          key={card.label}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          className={`relative overflow-hidden rounded-xl border ${card.border} ${card.bg} p-5`}
        >
          {/* Icon */}
          <div className={`${card.iconColor} mb-3`}>{card.icon}</div>

          {/* Value */}
          <p className="text-2xl font-bold text-white mb-1">{card.value}</p>

          {/* Label */}
          <p className="text-sm text-gray-400 mb-1">{card.label}</p>

          {/* Subtext */}
          <p className="text-xs text-gray-500">{card.subtext}</p>

          {/* Decorative blur */}
          <div
            className={`absolute -top-4 -right-4 w-20 h-20 rounded-full blur-2xl opacity-20`}
            style={{
              backgroundColor:
                card.color === "blue"
                  ? "#3b82f6"
                  : card.color === "red"
                  ? "#ef4444"
                  : card.color === "emerald"
                  ? "#10b981"
                  : card.color === "amber"
                  ? "#f59e0b"
                  : "#6b7280",
            }}
          />
        </motion.div>
      ))}
    </div>
  );
}