"use client";

import { motion } from "framer-motion";
import { ShieldOff, CheckCircle2 } from "lucide-react";
import type { CoverageGap } from "@/types";

interface GapsListProps {
  gaps: CoverageGap[];
}

const IMPORTANCE_CONFIG = {
  essential: {
    color: "text-red-500",
    bg: "bg-red-950/20",
    border: "border-red-900/50",
    label: "ESSENTIAL",
  },
  recommended: {
    color: "text-amber-500",
    bg: "bg-amber-950/20",
    border: "border-amber-900/50",
    label: "RECOMMENDED",
  },
  optional: {
    color: "text-cyan-500",
    bg: "bg-cyan-950/20",
    border: "border-cyan-900/50",
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
      <div className="flex flex-col items-center justify-center py-16 text-center border border-emerald-900/40 bg-emerald-950/10">
        <CheckCircle2 className="w-8 h-8 text-emerald-500 mb-4" />
        <h3 className="text-[10px] font-mono uppercase tracking-widest text-emerald-500 mb-2">
          [ FULL_COVERAGE ]
        </h3>
        <p className="text-[9px] font-mono uppercase tracking-widest text-neutral-600 max-w-md leading-relaxed">
          NO SIGNIFICANT COVERAGE GAPS WERE IDENTIFIED ACROSS YOUR CONTRACTS.
          YOUR PROTECTIONS APPEAR COMPREHENSIVE.
        </p>
      </div>
    );
  }

  const essentialCount = gaps.filter(
    (g) => g.importance === "essential",
  ).length;

  return (
    <div className="space-y-4">
      {/* Essential gaps banner */}
      {essentialCount > 0 && (
        <div className="border border-red-900/50 bg-red-950/20 p-5 flex flex-col sm:flex-row items-center sm:items-start gap-4 text-center sm:text-left">
          <div className="p-2 border border-red-900/50 bg-[#050505] flex-shrink-0">
            <ShieldOff className="w-5 h-5 text-red-500" />
          </div>
          <div>
            <p className="text-[10px] font-mono uppercase tracking-widest text-red-500 mb-2">
              {essentialCount} ESSENTIAL PROTECTION
              {essentialCount > 1 ? "S" : ""} MISSING
            </p>
            <p className="text-[9px] font-mono uppercase tracking-widest text-red-400/60">
              THESE GAPS EXPOSE YOU TO SIGNIFICANT FINANCIAL OR LEGAL RISK.
              ADDRESS THEM AS A PRIORITY.
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
              <div
                className={`border ${config.border} ${config.bg} hover:border-neutral-600 transition-colors`}
              >
                <div className="p-5">
                  <div className="flex items-start gap-4 flex-col sm:flex-row">
                    <div className="p-3 border border-neutral-800 bg-[#050505] text-2xl flex-shrink-0">
                      {emoji}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <span
                          className={`text-[8px] font-mono uppercase tracking-widest px-1.5 py-0.5 border ${config.border} ${config.color}`}
                        >
                          {config.label}
                        </span>
                        <span className="text-[8px] font-mono uppercase tracking-widest text-neutral-600 bg-neutral-900 px-1.5 py-0.5 border border-neutral-800">
                          {gap.category.replace(/_/g, " ")}
                        </span>
                      </div>
                      <h4 className="text-xs font-mono uppercase tracking-widest text-neutral-200 mb-3 border-b border-neutral-900 pb-2">
                        {gap.title}
                      </h4>
                      <p className="text-[10px] font-mono text-neutral-400 leading-relaxed">
                        {gap.description}
                      </p>

                      {/* Risk estimate */}
                      {gap.estimated_annual_risk != null &&
                        gap.estimated_annual_risk > 0 && (
                          <span className="mt-4 text-[10px] font-mono text-red-500 border border-red-900/50 bg-red-950/20 px-2 py-1 inline-block">
                            EST_ANNUAL_RISK: ₹
                            {gap.estimated_annual_risk.toLocaleString("en-IN")}
                          </span>
                        )}

                      {/* Suggestion */}
                      {gap.suggestion && (
                        <div className="mt-5 border-l-2 border-emerald-900/50 bg-emerald-950/10 p-4">
                          <p className="text-[8px] font-mono uppercase tracking-widest text-emerald-500 mb-2 border-b border-emerald-900/30 pb-2">
                            SUGGESTION
                          </p>
                          <p className="text-[9px] font-mono text-emerald-400/80 leading-relaxed">
                            {gap.suggestion}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
