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
    color: "text-red-400",
    bg: "bg-red-500/10",
    border: "border-red-500/20",
    label: "Essential",
  },
  recommended: {
    color: "text-yellow-400",
    bg: "bg-yellow-500/10",
    border: "border-yellow-500/20",
    label: "Recommended",
  },
  optional: {
    color: "text-blue-400",
    bg: "bg-blue-500/10",
    border: "border-blue-500/20",
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

export default function GapsList({ gaps }: GapsListProps) {
  if (gaps.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <CheckCircle2 className="w-12 h-12 text-green-400/50 mb-4" />
        <h3 className="text-lg font-semibold text-green-400 mb-2">
          Full Coverage
        </h3>
        <p className="text-sm text-white/40 max-w-md">
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
        <div className="rounded-lg bg-red-500/5 border border-red-500/10 p-4 flex items-start gap-3">
          <ShieldOff className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-red-400">
              {essentialCount} Essential Protection{essentialCount > 1 ? "s" : ""} Missing
            </p>
            <p className="text-xs text-white/40 mt-1">
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
              <Card className={`${config.bg} ${config.border}`}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <span className="text-xl">{emoji}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge className={`${config.bg} ${config.color} text-[10px] border-0`}>
                          {config.label}
                        </Badge>
                        <span className="text-[10px] text-white/30">
                          {gap.category.replace(/_/g, " ")}
                        </span>
                      </div>
                      <h4 className="text-sm font-semibold text-white mb-1">
                        {gap.title}
                      </h4>
                      <p className="text-xs text-white/50">{gap.description}</p>

                      {/* Risk estimate */}
                      {gap.estimated_annual_risk != null && gap.estimated_annual_risk > 0 && (
                        <p className="text-xs text-red-300 mt-2">
                          💰 Estimated annual risk: ₹{gap.estimated_annual_risk.toLocaleString("en-IN")}
                        </p>
                      )}

                      {/* Suggestion */}
                      {gap.suggestion && (
                        <div className="mt-3 rounded-lg bg-green-500/5 border border-green-500/10 p-3">
                          <p className="text-[10px] text-green-400 font-medium mb-1">
                            💡 Suggestion
                          </p>
                          <p className="text-xs text-white/60">{gap.suggestion}</p>
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
