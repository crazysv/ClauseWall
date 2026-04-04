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
    color: "text-red-600 dark:text-red-500",
    bg: "bg-red-100 dark:bg-red-950",
    border: "border-red-500",
    label: "ESSENTIAL",
  },
  recommended: {
    color: "text-yellow-600 dark:text-yellow-500",
    bg: "bg-yellow-100 dark:bg-yellow-950",
    border: "border-yellow-500",
    label: "RECOMMENDED",
  },
  optional: {
    color: "text-blue-600 dark:text-blue-500",
    bg: "bg-blue-100 dark:bg-blue-950",
    border: "border-blue-500",
    label: "OPTIONAL",
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

export default function GapsList({ gaps }: GapsListProps) {
  if (gaps.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center border-4 border-black bg-green-50 dark:bg-green-950 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
        <CheckCircle2 className="w-16 h-16 text-green-600 dark:text-green-500 mb-6 stroke-[3px]" />
        <h3 className="text-2xl font-black uppercase tracking-widest text-green-700 dark:text-green-400 mb-4">
          FULL COVERAGE
        </h3>
        <p className="text-sm font-bold uppercase tracking-widest text-green-900/60 dark:text-green-200/60 max-w-md leading-relaxed">
          NO SIGNIFICANT COVERAGE GAPS WERE IDENTIFIED ACROSS YOUR CONTRACTS.
          YOUR PROTECTIONS APPEAR COMPREHENSIVE.
        </p>
      </div>
    );
  }

  const essentialCount = gaps.filter((g) => g.importance === "essential").length;

  return (
    <div className="space-y-4">
      {/* Essential gaps banner */}
      {essentialCount > 0 && (
        <div className="border-4 border-black bg-red-50 dark:bg-red-950 p-6 flex flex-col sm:flex-row items-center sm:items-start gap-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-center sm:text-left">
          <div className="p-3 border-4 border-black bg-white dark:bg-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex-shrink-0">
            <ShieldOff className="w-6 h-6 text-red-600 dark:text-red-500 stroke-[3px]" />
          </div>
          <div>
            <p className="text-base font-black uppercase tracking-widest text-red-600 dark:text-red-400 mb-2">
              {essentialCount} ESSENTIAL PROTECTION{essentialCount > 1 ? "S" : ""} MISSING
            </p>
            <p className="text-xs font-bold uppercase tracking-widest text-red-900/60 dark:text-red-200/60">
              THESE GAPS EXPOSE YOU TO SIGNIFICANT FINANCIAL OR LEGAL RISK. ADDRESS THEM AS A PRIORITY.
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
              <Card className={`border-4 border-black rounded-none shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] ${config.bg} hover:-translate-y-1 hover:shadow-none transition-all`}>
                <CardContent className="p-6">
                  <div className="flex items-start gap-4 flex-col sm:flex-row">
                    <div className="p-4 border-4 border-black bg-white dark:bg-black text-3xl shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] sm:mb-0 mb-2">
                      {emoji}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2 flex-wrap">
                        <Badge className={`px-2 py-0.5 border-2 border-black rounded-none shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] ${config.bg} ${config.color} font-black uppercase tracking-widest text-[10px]`}>
                          {config.label}
                        </Badge>
                        <span className="text-xs font-black uppercase tracking-widest text-muted-foreground bg-white dark:bg-black px-2 py-0.5 border-2 border-black">
                          {gap.category.replace(/_/g, " ")}
                        </span>
                      </div>
                      <h4 className="text-lg font-black uppercase tracking-widest text-foreground mb-3 border-b-2 border-black pb-2">
                        {gap.title}
                      </h4>
                      <p className="text-sm font-bold uppercase tracking-widest text-foreground leading-relaxed">
                        {gap.description}
                      </p>

                      {/* Risk estimate */}
                      {gap.estimated_annual_risk != null && gap.estimated_annual_risk > 0 && (
                        <p className="mt-4 text-sm font-black uppercase tracking-widest text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-950 px-3 py-2 border-4 border-red-500 shadow-[2px_2px_0px_0px_rgba(239,68,68,1)] inline-block">
                          💰 ESTIMATED ANNUAL RISK: ₹{gap.estimated_annual_risk.toLocaleString("en-IN")}
                        </p>
                      )}

                      {/* Suggestion */}
                      {gap.suggestion && (
                        <div className="mt-6 border-4 border-black bg-green-50 dark:bg-green-950/20 p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                          <p className="text-[10px] font-black uppercase tracking-widest text-green-600 dark:text-green-500 mb-2 border-b-2 border-green-500 pb-2">
                            💡 SUGGESTION
                          </p>
                          <p className="text-xs font-bold uppercase tracking-widest text-green-900/80 dark:text-green-200/80 leading-relaxed">
                            {gap.suggestion}
                          </p>
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
