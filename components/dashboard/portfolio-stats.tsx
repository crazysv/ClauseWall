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

export function PortfolioStatsSection({ stats }: PortfolioStatsProps) {
  const cards = [
    {
      label: "Contracts Scanned",
      value: stats.totalContracts.toString(),
      subtext: `${stats.totalClauses} clauses analyzed`,
      icon: <FileSearch className="w-6 h-6" />,
      color: "blue",
      bg: "bg-indigo-50",
      border: "border-indigo-100",
      iconColor: "text-indigo-600",
      textColor: "text-slate-900",
      indicatorId: "bg-indigo-500"
    },
    {
      label: "Risky Clauses Found",
      value: (stats.dangerousClausesCount + stats.illegalClausesCount).toString(),
      subtext: `${stats.illegalClausesCount} illegal · ${stats.dangerousClausesCount} dangerous`,
      icon: <ShieldAlert className="w-6 h-6" />,
      color: "red",
      bg: "bg-rose-50",
      border: "border-rose-100",
      iconColor: "text-rose-600",
      textColor: "text-rose-700",
      indicatorId: "bg-rose-500"
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
          <TrendingDown className="w-6 h-6" />
        ) : stats.riskTrend === "worsening" ? (
          <TrendingUp className="w-6 h-6" />
        ) : (
          <Minus className="w-6 h-6" />
        ),
      color:
        stats.riskTrend === "improving"
          ? "emerald"
          : stats.riskTrend === "worsening"
          ? "amber"
          : "gray",
      bg:
        stats.riskTrend === "improving"
          ? "bg-emerald-50"
          : stats.riskTrend === "worsening"
          ? "bg-amber-50"
          : "bg-slate-50",
      border:
        stats.riskTrend === "improving"
          ? "border-emerald-100"
          : stats.riskTrend === "worsening"
          ? "border-amber-100"
          : "border-slate-100",
      iconColor:
        stats.riskTrend === "improving"
          ? "text-emerald-600"
          : stats.riskTrend === "worsening"
          ? "text-amber-600"
          : "text-slate-500",
      textColor: "text-slate-900",
      indicatorId: stats.riskTrend === "improving" ? "bg-emerald-500" : stats.riskTrend === "worsening" ? "bg-amber-500" : "bg-slate-400"
    },
    {
      label: "Potential Savings",
      value: formatIndianCurrency(stats.estimatedSavings),
      subtext:
        stats.contractsBuilt > 0
          ? `${stats.contractsBuilt} fair contract${stats.contractsBuilt > 1 ? "s" : ""} built`
          : "By spotting risky clauses",
      icon: <IndianRupee className="w-6 h-6" />,
      color: "emerald",
      bg: "bg-emerald-50",
      border: "border-emerald-100",
      iconColor: "text-emerald-600",
      textColor: "text-emerald-700",
      indicatorId: "bg-emerald-500"
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, index) => (
        <motion.div
          key={card.label}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          className="relative overflow-hidden bg-white dark:bg-card rounded-xl shadow-sm dark:shadow-slate-900/20 hover:shadow-md hover:-translate-y-0.5 border border-slate-200 dark:border-slate-700 p-5 transition-all group"
        >
          <div className="flex items-center gap-4 mb-4">
             {/* Icon */}
            <div className={`p-4 rounded-full ${card.bg} ${card.iconColor} shadow-inner`}>{card.icon}</div>
             {/* Value */}
            <div className="flex-1">
               <p className={`text-2xl lg:text-3xl font-black tracking-tight ${card.textColor} leading-tight truncate`}>{card.value}</p>
            </div>
          </div>

          <div className="space-y-1">
            {/* Label */}
            <p className="text-sm font-bold text-slate-700 tracking-wide">{card.label}</p>
            {/* Subtext */}
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{card.subtext}</p>
          </div>
          
          {/* Subtle colored bottom border indicator tracking on Hover */}
          <div className={`absolute bottom-0 left-0 right-0 h-1.5 ${card.indicatorId} opacity-0 group-hover:opacity-100 transition-opacity`} />
        </motion.div>
      ))}
    </div>
  );
}