"use client";

import { motion } from "framer-motion";
import {
  Lightbulb,
  TrendingDown,
  TrendingUp,
  BarChart3,
  MapPin,
  AlertCircle,
  CheckCircle2,
  Info,
} from "lucide-react";
import type { Document, PortfolioStats, InsightItem } from "@/types";
import {
  getDocTypeBreakdown,
  getJurisdictionBreakdown,
} from "@/lib/stats/portfolio-stats";

interface InsightsSectionProps {
  stats: PortfolioStats;
  documents: Document[];
}

function generateInsights(
  stats: PortfolioStats,
  documents: Document[],
): InsightItem[] {
  const insights: InsightItem[] = [];

  // 1. Risk Trend Insight
  if (stats.totalContracts >= 2) {
    if (stats.riskTrend === "improving") {
      insights.push({
        icon: "trending_down",
        title: "RISK PROFILE: IMPROVED",
        description: `Recent evaluations measure ${stats.riskTrendPercentage}% lower risk exposure compared to baseline analytics.`,
        type: "positive",
      });
    } else if (stats.riskTrend === "worsening") {
      insights.push({
        icon: "trending_up",
        title: "RISK PROFILE: DEGRADED",
        description: `Recent evaluations measure ${stats.riskTrendPercentage}% higher risk exposure. Stricter clearance protocols advised.`,
        type: "warning",
      });
    } else {
      insights.push({
        icon: "stable",
        title: "RISK PROFILE: STABLE",
        description: `Variance within expected thresholds. Average system risk maintains at ${stats.averageRiskScore}/100.`,
        type: "neutral",
      });
    }
  }

  // 2. Document Type Insight
  const typeBreakdown = getDocTypeBreakdown(documents);
  if (typeBreakdown.length > 0) {
    const mostCommon = typeBreakdown[0];
    const riskiest = [...typeBreakdown].sort(
      (a, b) => b.avgRisk - a.avgRisk,
    )[0];

    const typeLabels: Record<string, string> = {
      rental: "RENTAL",
      employment: "EMPLOYMENT",
      loan: "LOAN",
      tos: "TOS",
      freelance: "FREELANCE",
      nda: "NDA",
      sale: "SALE",
      partnership: "PARTNERSHIP",
      other: "GENERIC",
    };

    if (typeBreakdown.length >= 2 && riskiest.avgRisk > 40) {
      insights.push({
        icon: "alert",
        title: `CRITICAL DETECTED: [${typeLabels[riskiest.type] || riskiest.type}]`,
        description: `Highest risk vector identified in ${(typeLabels[riskiest.type] || riskiest.type).toLowerCase()} parameters. Average severity index: ${riskiest.avgRisk}/100.`,
        type: "warning",
      });
    } else {
      insights.push({
        icon: "chart",
        title: `VOLUME ANALYSIS: [${typeLabels[mostCommon.type] || mostCommon.type}]`,
        description: `Primary ingestion payload consists of ${mostCommon.count} ${(typeLabels[mostCommon.type] || mostCommon.type).toLowerCase()} documents.`,
        type: "neutral",
      });
    }
  }

  // 3. Clause Insight
  if (stats.totalClauses > 0) {
    const riskyPercent = Math.round(
      ((stats.dangerousClausesCount + stats.illegalClausesCount) /
        stats.totalClauses) *
        100,
    );

    if (riskyPercent > 30) {
      insights.push({
        icon: "alert",
        title: `SYSTEM ALERT: ${riskyPercent}% ANOMALY RATE`,
        description: `Density of hostile clauses exceeds safe threshold. Recommend utilizing Contract Generator for cleaner base templates.`,
        type: "warning",
      });
    } else if (riskyPercent < 10) {
      insights.push({
        icon: "check",
        title: "ANALYSIS: CLEAN PAYLOAD",
        description: `Hostile clause density (${riskyPercent}%) remains below critical thresholds. Current parameters acceptable.`,
        type: "positive",
      });
    } else {
      insights.push({
        icon: "info",
        title: `SCAN COMPLETE: ${stats.dangerousClausesCount + stats.illegalClausesCount} FLAGGED`,
        description: `Out of ${stats.totalClauses} total extracted clauses, ${riskyPercent}% require manual clearance verification.`,
        type: "neutral",
      });
    }
  }

  // 4. Actionable Tip
  if (stats.illegalClausesCount > 0) {
    insights.push({
      icon: "tip",
      title: "TACTICAL RECOMMENDATION",
      description: `Analysis detected ${stats.illegalClausesCount} illegal parameters. Deploy the Legal Notice Generator to initiate formal countermeasures.`,
      type: "tip",
    });
  } else if (stats.contractsBuilt === 0 && stats.totalContracts >= 1) {
    insights.push({
      icon: "tip",
      title: "SYSTEM RECOMMENDATION",
      description: `Shift from defensive scanning to offensive generation. Initialize the Contract Builder for pre-secured agreements.`,
      type: "tip",
    });
  } else {
    insights.push({
      icon: "tip",
      title: "PROTOCOL REMINDER",
      description: `Enforce 48-hour buffer protocol prior to execution signature. Rapid deployment increases risk slip-through.`,
      type: "tip",
    });
  }

  return insights;
}

const ICON_MAP: Record<string, React.ReactNode> = {
  trending_down: <TrendingDown className="w-4 h-4" />,
  trending_up: <TrendingUp className="w-4 h-4" />,
  stable: <BarChart3 className="w-4 h-4" />,
  chart: <BarChart3 className="w-4 h-4" />,
  alert: <AlertCircle className="w-4 h-4" />,
  check: <CheckCircle2 className="w-4 h-4" />,
  info: <Info className="w-4 h-4" />,
  tip: <Lightbulb className="w-4 h-4" />,
  map: <MapPin className="w-4 h-4" />,
};

const TYPE_STYLES: Record<
  string,
  { bg: string; border: string; iconColor: string }
> = {
  positive: {
    bg: "bg-[#050505]",
    border: "border-emerald-900/50",
    iconColor: "text-emerald-500 bg-emerald-950/20 border border-emerald-900/40",
  },
  warning: {
    bg: "bg-[#050505]",
    border: "border-red-900/50",
    iconColor: "text-red-500 bg-red-950/20 border border-red-900/40",
  },
  neutral: {
    bg: "bg-[#050505]",
    border: "border-cyan-900/50",
    iconColor: "text-cyan-500 bg-cyan-950/20 border border-cyan-900/40",
  },
  tip: {
    bg: "bg-[#050505]",
    border: "border-pink-900/50",
    iconColor: "text-pink-500 bg-pink-950/20 border border-pink-900/40",
  },
};

export default function InsightsSection({
  stats,
  documents,
}: InsightsSectionProps) {
  const insights = generateInsights(stats, documents);

  if (insights.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.25 }}
      className="bg-[#0a0a0a] border border-neutral-900 p-6 h-full flex flex-col"
    >
      <div className="flex items-center gap-3 mb-5 pb-4 border-b border-neutral-900">
        <Lightbulb className="w-4 h-4 text-pink-500" />
        <h3 className="text-[10px] font-mono uppercase tracking-widest text-neutral-400">
          [ SYSTEM_INSIGHTS ]
        </h3>
      </div>

      <div className="space-y-3 flex-1">
        {insights.map((insight, index) => {
          const style = TYPE_STYLES[insight.type] || TYPE_STYLES.neutral;

          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -5 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 + index * 0.1 }}
              className={`flex items-start gap-4 p-4 border transition-colors hover:bg-neutral-950 ${style.bg} ${style.border}`}
            >
              <div className={`p-1.5 ${style.iconColor} flex items-center justify-center shrink-0 mt-0.5`}>
                {ICON_MAP[insight.icon] || <Info className="w-4 h-4" />}
              </div>
              <div>
                <p className="text-[10px] font-mono uppercase tracking-widest text-neutral-300 mb-1.5">
                  {insight.title}
                </p>
                <p className="text-xs font-mono text-neutral-500 leading-relaxed uppercase">
                  {insight.description}
                </p>
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}
