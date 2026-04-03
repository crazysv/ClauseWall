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
      {cards.map((card, index) => {
        // Derive bold impact classes based on card.color
        const shadowColor = 
          card.color === "blue" ? "rgba(37,99,235,1)" :
          card.color === "red" ? "rgba(220,38,38,1)" :
          card.color === "emerald" ? "rgba(22,163,74,1)" :
          card.color === "amber" ? "rgba(234,179,8,1)" :
          "rgba(10,10,10,1)";
          
        const borderColor = 
          card.color === "blue" ? "border-blue-600" :
          card.color === "red" ? "border-red-600" :
          card.color === "emerald" ? "border-green-600" :
          card.color === "amber" ? "border-yellow-500" :
          "border-foreground";

        const iconBg = 
          card.color === "blue" ? "bg-blue-100 text-blue-800" :
          card.color === "red" ? "bg-red-100 text-red-800" :
          card.color === "emerald" ? "bg-green-100 text-green-800" :
          card.color === "amber" ? "bg-yellow-100 text-yellow-800" :
          "bg-muted text-foreground";

        return (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`card-impact border-2 ${borderColor} bg-background p-5 hover:-translate-y-1 transition-transform`}
            style={{ boxShadow: `4px 4px 0px 0px ${shadowColor}` }}
          >
            {/* Icon */}
            <div className={`inline-flex items-center justify-center p-2 border-2 border-current shadow-[2px_2px_0px_0px_currentColor] mb-4 ${iconBg}`}>
              {card.icon}
            </div>

            {/* Value */}
            <p className="text-2xl font-black text-foreground mb-1 tracking-tighter">{card.value}</p>

            {/* Label */}
            <p className="text-xs font-black uppercase tracking-wider text-muted-foreground mb-1">{card.label}</p>

            {/* Subtext */}
            <p className="text-[10px] font-bold text-foreground/70 uppercase">{card.subtext}</p>
          </motion.div>
        );
      })}
    </div>
  );
}