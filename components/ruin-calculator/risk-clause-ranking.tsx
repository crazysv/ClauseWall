"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import type { ClauseRiskRanking } from "@/lib/simulation/types";
import { formatINR, formatINRCompact } from "@/lib/simulation/formatters";

interface Props {
  rankings: ClauseRiskRanking[];
  documentId: string;
}

const RISK_COLORS: Record<string, { text: string; bg: string; border: string }> = {
  illegal: { text: "text-purple-400", bg: "bg-purple-500/10", border: "border-purple-500/20" },
  dangerous: { text: "text-red-400", bg: "bg-red-500/10", border: "border-red-500/20" },
  warning: { text: "text-yellow-400", bg: "bg-yellow-500/10", border: "border-yellow-500/20" },
  safe: { text: "text-green-400", bg: "bg-green-500/10", border: "border-green-500/20" },
};

export default function RiskClauseRanking({ rankings, documentId }: Props) {
  if (rankings.length === 0) {
    return (
      <p className="text-sm text-white/30 text-center py-4">
        No clauses with measurable financial risk found.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {rankings.slice(0, 5).map((clause, i) => {
        const colors = RISK_COLORS[clause.riskLevel] || RISK_COLORS.warning;

        return (
          <motion.div
            key={clause.clauseId}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.08 }}
            className={`p-4 rounded-xl ${colors.bg} border ${colors.border}`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-lg font-bold text-white/30">
                    #{i + 1}
                  </span>
                  <span className="text-sm font-semibold text-white/80">
                    {clause.clauseType.replace(/_/g, " ")}
                  </span>
                  <Badge
                    variant="outline"
                    className={`text-[10px] ${colors.border} ${colors.text}`}
                  >
                    {clause.riskLevel}
                  </Badge>
                </div>
                <p className="text-xs text-white/30 line-clamp-1">
                  {clause.originalText}
                </p>
                <div className="flex items-center gap-4 mt-2 text-xs">
                  <span className="text-white/50">
                    Expected:{" "}
                    <strong className={colors.text}>
                      {formatINRCompact(clause.expectedCost)}
                    </strong>
                  </span>
                  <span className="text-white/30">
                    Worst:{" "}
                    <strong>{formatINRCompact(clause.worstCaseCost)}</strong>
                  </span>
                  <span className="text-white/20">
                    P(trigger): {Math.round(clause.triggerProbability)}%
                  </span>
                </div>
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <Link
                  href={`/negotiate/${documentId}`}
                  className="text-[10px] px-2 py-1 rounded-md bg-white/5 text-blue-400 hover:bg-white/10 transition-colors"
                >
                  Negotiate
                </Link>
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
