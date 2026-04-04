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
        title: "You're Getting Smarter!",
        description: `Your recent contracts are ${stats.riskTrendPercentage}% safer than your earlier ones. You're learning to spot better deals.`,
        type: "positive",
      });
    } else if (stats.riskTrend === "worsening") {
      insights.push({
        icon: "trending_up",
        title: "Be More Careful",
        description: `Your recent contracts are ${stats.riskTrendPercentage}% riskier than before. Take extra time reviewing before signing.`,
        type: "warning",
      });
    } else {
      insights.push({
        icon: "stable",
        title: "Consistent Risk Level",
        description: `Your average risk score is ${stats.averageRiskScore}/100. ${
          stats.averageRiskScore < 40
            ? "That's pretty good!"
            : "Try negotiating tougher clauses."
        }`,
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
      rental: "Rental",
      employment: "Employment",
      loan: "Loan",
      tos: "Terms of Service",
      freelance: "Freelance",
      nda: "NDA",
      sale: "Sale",
      partnership: "Partnership",
      other: "Other",
    };

    if (typeBreakdown.length >= 2 && riskiest.avgRisk > 40) {
      insights.push({
        icon: "alert",
        title: `${typeLabels[riskiest.type] || riskiest.type} Contracts Are Riskiest`,
        description: `Your ${(typeLabels[riskiest.type] || riskiest.type).toLowerCase()} contracts have an average risk of ${riskiest.avgRisk}/100. Pay extra attention to these.`,
        type: "warning",
      });
    } else {
      insights.push({
        icon: "chart",
        title: `Mostly ${typeLabels[mostCommon.type] || mostCommon.type} Contracts`,
        description: `${mostCommon.count} out of ${stats.totalContracts} contracts are ${(typeLabels[mostCommon.type] || mostCommon.type).toLowerCase()} agreements.`,
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
        title: `${riskyPercent}% of Clauses Are Risky`,
        description: `That's higher than usual. Consider using ClauseWall's Contract Builder to generate fairer alternatives.`,
        type: "warning",
      });
    } else if (riskyPercent < 10) {
      insights.push({
        icon: "check",
        title: "Your Contracts Are Mostly Clean",
        description: `Only ${riskyPercent}% of clauses are dangerous or illegal. You're dealing with relatively fair agreements.`,
        type: "positive",
      });
    } else {
      insights.push({
        icon: "info",
        title: `${stats.dangerousClausesCount + stats.illegalClausesCount} Risky Clauses Found`,
        description: `Out of ${stats.totalClauses} total clauses, ${riskyPercent}% need attention. Always negotiate before signing.`,
        type: "neutral",
      });
    }
  }

  // 4. Actionable Tip
  if (stats.illegalClausesCount > 0) {
    insights.push({
      icon: "tip",
      title: "💡 Pro Tip",
      description: `You've found ${stats.illegalClausesCount} illegal clauses. Use the Legal Notice Generator to formally challenge them — most parties back down when served a notice.`,
      type: "tip",
    });
  } else if (stats.contractsBuilt === 0 && stats.totalContracts >= 1) {
    insights.push({
      icon: "tip",
      title: "💡 Pro Tip",
      description: `Try the Contract Builder to generate a fair agreement yourself. Don't just spot bad contracts — create good ones.`,
      type: "tip",
    });
  } else {
    insights.push({
      icon: "tip",
      title: "💡 Pro Tip",
      description: `Always ask for the contract 48 hours before signing. Rushed signatures are how predatory clauses slip through.`,
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
    bg: "bg-green-100",
    border: "border-green-600 shadow-[4px_4px_0px_0px_rgba(22,163,74,1)]",
    iconColor: "text-green-800 bg-green-200 border-2 border-green-600",
  },
  warning: {
    bg: "bg-amber-100",
    border: "border-yellow-500 shadow-[4px_4px_0px_0px_rgba(234,179,8,1)]",
    iconColor: "text-amber-800 bg-amber-200 border-2 border-yellow-500",
  },
  neutral: {
    bg: "bg-blue-100",
    border: "border-blue-600 shadow-[4px_4px_0px_0px_rgba(37,99,235,1)]",
    iconColor: "text-blue-800 bg-blue-200 border-2 border-blue-600",
  },
  tip: {
    bg: "bg-purple-100",
    border: "border-purple-600 shadow-[4px_4px_0px_0px_rgba(147,51,234,1)]",
    iconColor: "text-purple-800 bg-purple-200 border-2 border-purple-600",
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
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.25 }}
      className="card-impact border-2 border-foreground shadow-[8px_8px_0px_0px_rgba(10,10,10,1)] bg-background p-6 h-full flex flex-col"
    >
      <div className="flex items-center gap-2 mb-5 pb-4 border-b-2 border-foreground">
        <Lightbulb className="w-6 h-6 text-purple-600 fill-purple-100" />
        <h3 className="text-xl font-black uppercase tracking-wider text-foreground">
          Smart Insights
        </h3>
      </div>

      <div className="space-y-4 flex-1">
        {insights.map((insight, index) => {
          const style = TYPE_STYLES[insight.type] || TYPE_STYLES.neutral;

          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 + index * 0.1 }}
              className={`flex items-start gap-4 p-4 border-2 transition-transform hover:-translate-y-1 ${style.bg} ${style.border}`}
            >
              <div className={`mt-0.5 p-2 ${style.iconColor}`}>
                {ICON_MAP[insight.icon] || <Info className="w-5 h-5" />}
              </div>
              <div>
                <p className="text-sm font-black uppercase tracking-wider text-foreground mb-1">
                  {insight.title}
                </p>
                <p className="text-xs font-bold text-foreground/80 leading-relaxed">
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
