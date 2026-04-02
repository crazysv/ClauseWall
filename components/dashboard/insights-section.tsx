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
  ChevronRight,
} from "lucide-react";
import type { Document, PortfolioStats, InsightItem } from "@/types";
import { getDocTypeBreakdown, getJurisdictionBreakdown } from "@/lib/stats/portfolio-stats";

interface InsightsSectionProps {
  stats: PortfolioStats;
  documents: Document[];
}

function generateInsights(stats: PortfolioStats, documents: Document[]): InsightItem[] {
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
    const riskiest = [...typeBreakdown].sort((a, b) => b.avgRisk - a.avgRisk)[0];

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
      ((stats.dangerousClausesCount + stats.illegalClausesCount) / stats.totalClauses) *
        100
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
      action: { label: "Generate Notice", link: "/notice" }
    });
  } else if (stats.contractsBuilt === 0 && stats.totalContracts >= 1) {
    insights.push({
      icon: "tip",
      title: "💡 Pro Tip",
      description: `Try the Contract Builder to generate a fair agreement yourself. Don't just spot bad contracts — create good ones.`,
      type: "tip",
      action: { label: "Launch Builder", link: "/builder" }
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
  trending_down: <TrendingDown className="w-5 h-5" />,
  trending_up: <TrendingUp className="w-5 h-5" />,
  stable: <BarChart3 className="w-5 h-5" />,
  chart: <BarChart3 className="w-5 h-5" />,
  alert: <AlertCircle className="w-5 h-5" />,
  check: <CheckCircle2 className="w-5 h-5" />,
  info: <Info className="w-5 h-5" />,
  tip: <Lightbulb className="w-5 h-5" />,
  map: <MapPin className="w-5 h-5" />,
};

const TYPE_STYLES: Record<string, { container: string; iconBg: string; iconColor: string; titleColor: string }> = {
  positive: {
    container: "bg-emerald-50 border border-emerald-100 border-l-4 border-l-emerald-500 shadow-sm",
    iconBg: "bg-emerald-100",
    iconColor: "text-emerald-600",
    titleColor: "text-emerald-900"
  },
  warning: {
    container: "bg-rose-50 border border-rose-100 border-l-4 border-l-rose-500 shadow-sm",
    iconBg: "bg-rose-100",
    iconColor: "text-rose-600",
    titleColor: "text-rose-900"
  },
  neutral: {
    container: "bg-slate-50 border border-slate-200 border-l-4 border-l-slate-400 shadow-sm",
    iconBg: "bg-white border border-slate-200",
    iconColor: "text-slate-600",
    titleColor: "text-slate-900"
  },
  tip: {
    container: "bg-indigo-50 border border-indigo-100 border-l-4 border-l-indigo-500 shadow-sm",
    iconBg: "bg-indigo-100",
    iconColor: "text-indigo-600",
    titleColor: "text-indigo-900"
  },
};

export function InsightsSection({ stats, documents }: InsightsSectionProps) {
  const insights = generateInsights(stats, documents);

  if (insights.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.25 }}
      className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-card shadow-sm dark:shadow-slate-900/20 p-6"
    >
      <div className="flex items-center gap-2 mb-6">
        <Lightbulb className="w-5 h-5 text-indigo-500" />
        <h3 className="font-extrabold text-slate-900 dark:text-slate-100 text-lg">Smart Insights</h3>
      </div>

      <div className="space-y-4">
        {insights.map((insight, index) => {
          const style = TYPE_STYLES[insight.type] || TYPE_STYLES.neutral;
          const action = insight.action;

          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 + index * 0.1 }}
              className={`flex flex-col sm:flex-row sm:items-start justify-between gap-4 p-4 rounded-xl transition-all hover:shadow-md ${style.container}`}
            >
              <div className="flex items-start gap-3">
                <div className={`mt-0.5 p-2 rounded-xl flex-shrink-0 ${style.iconBg} ${style.iconColor}`}>
                  {ICON_MAP[insight.icon] || <Info className="w-5 h-5" />}
                </div>
                <div>
                  <p className={`text-sm font-extrabold mb-1 tracking-wide ${style.titleColor}`}>
                    {insight.title}
                  </p>
                  <p className="text-xs font-medium text-slate-600 dark:text-slate-400 leading-relaxed max-w-md">
                    {insight.description}
                  </p>
                </div>
              </div>
              
              {action && (
                <div className="flex-shrink-0 w-full sm:w-auto mt-2 sm:mt-1">
                   {/* Normally this would wrap a <Link href={action.link}> */}
                   <button className="w-full sm:w-auto px-4 py-2 sm:py-1.5 rounded-full border-2 border-indigo-200 text-indigo-700 bg-white dark:bg-card hover:bg-indigo-50 dark:hover:bg-indigo-950/30 hover:border-indigo-300 text-[11px] font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 shadow-sm dark:shadow-slate-900/20 group">
                      {action.label} <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform text-indigo-400" />
                   </button>
                </div>
              )}
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}