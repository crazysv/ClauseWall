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
      label: "NODES_SCANNED",
      value: stats.totalContracts.toString(),
      subtext: `${stats.totalClauses} CLAUSES_EXTRACTED`,
      icon: <FileSearch className="w-4 h-4" />,
      color: "cyan",
    },
    {
      label: "RISK_VECTORS",
      value: (
        stats.dangerousClausesCount + stats.illegalClausesCount
      ).toString(),
      subtext: `${stats.illegalClausesCount} ILL · ${stats.dangerousClausesCount} DNG`,
      icon: <ShieldAlert className="w-4 h-4" />,
      color: "red",
    },
    {
      label: "BASELINE_TREND",
      value:
        stats.riskTrend === "improving"
          ? `[↓ ${stats.riskTrendPercentage}%]`
          : stats.riskTrend === "worsening"
            ? `[↑ ${stats.riskTrendPercentage}%]`
            : "[ STABLE ]",
      subtext:
        stats.riskTrend === "improving"
          ? "RISK_MITIGATED"
          : stats.riskTrend === "worsening"
            ? "EXPOSURE_ELEVATED"
            : `AVG: ${stats.averageRiskScore}/100`,
      icon:
        stats.riskTrend === "improving" ? (
          <TrendingDown className="w-4 h-4" />
        ) : stats.riskTrend === "worsening" ? (
          <TrendingUp className="w-4 h-4" />
        ) : (
          <Minus className="w-4 h-4" />
        ),
      color:
        stats.riskTrend === "improving"
          ? "emerald"
          : stats.riskTrend === "worsening"
            ? "amber"
            : "neutral",
    },
    {
      label: "CAPITAL_SAVED",
      value: formatIndianCurrency(stats.estimatedSavings),
      subtext:
        stats.contractsBuilt > 0
          ? `${stats.contractsBuilt} DOC_GENERATED`
          : "VIA_PREVENTION",
      icon: <IndianRupee className="w-4 h-4" />,
      color: "emerald",
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, index) => {
        let borderColor = "border-neutral-900";
        let iconColor = "text-neutral-500";
        let iconBg = "bg-neutral-950/50";
        let glowColor = "bg-transparent";

        if (card.color === "cyan") {
          borderColor = "border-cyan-900/40";
          iconColor = "text-cyan-500";
          iconBg = "bg-cyan-950/20 text-cyan-500 border border-cyan-900/50";
          glowColor = "bg-cyan-500";
        } else if (card.color === "red") {
          borderColor = "border-red-900/40";
          iconColor = "text-red-500";
          iconBg = "bg-red-950/20 text-red-500 border border-red-900/50";
          glowColor = "bg-red-500";
        } else if (card.color === "emerald") {
          borderColor = "border-emerald-900/40";
          iconColor = "text-emerald-500";
          iconBg = "bg-emerald-950/20 text-emerald-500 border border-emerald-900/50";
          glowColor = "bg-emerald-500";
        } else if (card.color === "amber") {
          borderColor = "border-amber-900/40";
          iconColor = "text-amber-500";
          iconBg = "bg-amber-950/20 text-amber-500 border border-amber-900/50";
          glowColor = "bg-amber-500";
        } else if (card.color === "neutral") {
          borderColor = "border-neutral-800";
          iconColor = "text-neutral-400";
          iconBg = "bg-neutral-900/50 text-neutral-400 border border-neutral-800";
          glowColor = "bg-neutral-600";
        }

        return (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`relative bg-[#0a0a0a] border ${borderColor} p-5 group overflow-hidden`}
          >
            {/* Top accent glow line */}
            <div className={`absolute top-0 left-0 w-full h-[1px] opacity-20 group-hover:opacity-100 transition-opacity ${glowColor}`} />

            <div className="flex items-start justify-between mb-8">
              <p className="text-[10px] font-mono tracking-widest uppercase text-neutral-500 max-w-[70%]">
                {card.label}
              </p>
              <div className={`p-1.5 flex items-center justify-center ${iconBg}`}>
                {card.icon}
              </div>
            </div>

            <div>
              <p className={`text-2xl font-mono tracking-tighter mb-1.5 ${iconColor}`}>
                {card.value}
              </p>
              <p className="text-[9px] font-mono uppercase tracking-widest text-neutral-600">
                {card.subtext}
              </p>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
