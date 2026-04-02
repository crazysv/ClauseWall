"use client";

import { motion } from "framer-motion";
import { ShieldOff, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import type { CoverageGap } from "@/types";

interface GapsListProps {
  gaps: CoverageGap[];
}

const IMPORTANCE_CONFIG = {
  essential: {
    color: "text-red-700",
    bg: "bg-red-50",
    border: "border-red-200",
    label: "Essential",
  },
  recommended: {
    color: "text-amber-700",
    bg: "bg-amber-50",
    border: "border-amber-200",
    label: "Recommended",
  },
  optional: {
    color: "text-blue-700",
    bg: "bg-blue-50",
    border: "border-blue-200",
    label: "Optional",
  },
};

const CATEGORY_EMOJIS: Record<string, string> = {
  health_insurance: "🏥",
  life_insurance: "💀",
  disability: "♿",
  dental: "🦷",
  vision: "👁️",
  accident: "🚑",
  liability: "⚖️",
  legal_protection: "📜",
  ip_protection: "🔐",
  termination_protection: "🚪",
  notice_period: "📢",
  severance: "💼",
  gratuity: "🎁",
  retirement: "🏖️",
  maternity: "👶",
  data_privacy: "🛡️",
  dispute_resolution: "⚔️",
  other: "📋",
};

export function GapsList({ gaps }: GapsListProps) {
  if (gaps.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 md:py-6 md:py-8 lg:py-12 lg:py-16 text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 border-dashed rounded-3xl">
        <CheckCircle2 className="w-12 h-12 text-emerald-400 mb-4" />
        <h3 className="text-lg font-black text-slate-800 dark:text-slate-200 mb-2 tracking-tight">
          Full Coverage
        </h3>
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400 max-w-md">
          No significant coverage gaps were identified across your contracts.
          Your protections appear comprehensive.
        </p>
      </div>
    );
  }

  const essentialCount = gaps.filter((g) => g.importance === "essential").length;

  return (
    <div className="space-y-4">
      {/* Essential gaps banner */}
      {essentialCount > 0 && (
        <div className="rounded-xl bg-red-50 border border-red-200 p-4 flex items-start gap-4 shadow-sm dark:shadow-slate-900/20">
          <ShieldOff className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-black text-red-800 tracking-tight">
              {essentialCount} Essential Protection{essentialCount > 1 ? "s" : ""} Missing
            </p>
            <p className="text-xs font-medium text-red-950/70 mt-1 leading-relaxed">
              These gaps expose you to significant financial or legal risk. Address them as a priority.
            </p>
          </div>
        </div>
      )}

      {/* Gap Cards */}
      <div className="space-y-3">
        {gaps.map((gap, index) => {
          const config = IMPORTANCE_CONFIG[gap.importance];
          const emoji = CATEGORY_EMOJIS[gap.category] || "📋";

          return (
            <motion.div
              key={gap.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card className={`rounded-2xl border-slate-200 dark:border-slate-700 shadow-sm dark:shadow-slate-900/20 transition-all hover:border-indigo-300 ${config.bg}`}>
                <CardContent className="p-5">
                  <div className="flex items-start gap-4">
                    <span className="text-lg md:text-xl lg:text-2xl mt-0.5">{emoji}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge className={`${config.bg} ${config.color} text-[10px] font-black uppercase tracking-widest border-0 px-2 rounded-full`}>
                          {config.label}
                        </Badge>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                          {gap.category.replace(/_/g, " ")}
                        </span>
                      </div>
                      <h4 className="text-base font-black text-slate-900 dark:text-slate-100 mb-1 leading-tight">
                        {gap.title}
                      </h4>
                      <p className="text-sm font-medium text-slate-600 dark:text-slate-400 leading-relaxed">{gap.description}</p>

                      {/* Risk estimate */}
                      {gap.estimated_annual_risk != null && gap.estimated_annual_risk > 0 && (
                        <p className="text-sm font-black text-red-700 tracking-tight mt-3">
                          💰 Estimated annual risk: ₹{gap.estimated_annual_risk.toLocaleString("en-IN")}
                        </p>
                      )}

                      {/* Suggestion */}
                      {gap.suggestion && (
                        <div className="mt-4 rounded-xl bg-emerald-50 border border-emerald-100 p-4">
                          <p className="text-[10px] text-emerald-800 font-black uppercase tracking-widest mb-1.5">
                            💡 Suggestion
                          </p>
                          <p className="text-sm font-medium text-emerald-950/80 leading-relaxed">{gap.suggestion}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
