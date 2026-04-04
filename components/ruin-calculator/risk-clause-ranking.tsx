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

const RISK_COLORS: Record<
  string,
  { text: string; bg: string; border: string }
> = {
  illegal: {
    text: "text-purple-900",
    bg: "bg-purple-200",
    border: "border-purple-600",
  },
  dangerous: {
    text: "text-red-900",
    bg: "bg-red-200",
    border: "border-red-600",
  },
  warning: {
    text: "text-yellow-900",
    bg: "bg-yellow-200",
    border: "border-yellow-600",
  },
  safe: {
    text: "text-green-900",
    bg: "bg-green-200",
    border: "border-green-600",
  },
};

export default function RiskClauseRanking({ rankings, documentId }: Props) {
  if (rankings.length === 0) {
    return (
      <p className="text-sm font-bold uppercase tracking-widest text-black/50 text-center py-6 border-2 border-black mt-4">
        No clauses with measurable financial risk found.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {rankings.slice(0, 5).map((clause, i) => {
        const colors = RISK_COLORS[clause.riskLevel] || RISK_COLORS.warning;

        return (
          <motion.div
            key={clause.clauseId}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.08 }}
            className={`p-4 border-4 border-black ${colors.bg} shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-y-1 hover:shadow-[0px_0px_0px_0px_rgba(0,0,0,1)] transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4`}
          >
            <div className="flex-1 min-w-0 w-full">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-xl font-black text-black bg-white px-2 py-1 border-2 border-black">
                  #{i + 1}
                </span>
                <span className="text-base font-black uppercase tracking-widest text-black">
                  {clause.clauseType.replace(/_/g, " ")}
                </span>
                <span
                  className={`text-xs font-black uppercase tracking-widest px-2 py-1 border-2 border-black ${colors.text} bg-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]`}
                >
                  {clause.riskLevel}
                </span>
              </div>
              <p className="text-xs font-bold uppercase tracking-widest text-black/60 line-clamp-1 mb-3 bg-white/50 p-2 border-2 border-black border-dashed">
                {clause.originalText}
              </p>
              <div className="flex flex-wrap items-center gap-4 text-xs font-bold uppercase tracking-widest text-black/70">
                <span>
                  Expected:{" "}
                  <strong className={`font-black text-sm`}>
                    {formatINRCompact(clause.expectedCost)}
                  </strong>
                </span>
                <span>
                  Worst:{" "}
                  <strong className="font-black text-sm text-black">
                    {formatINRCompact(clause.worstCaseCost)}
                  </strong>
                </span>
                <span className="bg-black text-white px-2 py-1">
                  P(trigger): {Math.round(clause.triggerProbability)}%
                </span>
              </div>
            </div>
            <div className="flex-shrink-0 w-full sm:w-auto mt-2 sm:mt-0">
              <Link
                href={`/negotiate/${documentId}`}
                className="block text-center text-xs font-black uppercase tracking-widest text-white bg-black hover:bg-blue-600 px-4 py-3 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-y-0.5 hover:shadow-[0px_0px_0px_0px_rgba(0,0,0,1)] transition-all w-full sm:w-auto min-w-[120px]"
              >
                Negotiate
              </Link>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
