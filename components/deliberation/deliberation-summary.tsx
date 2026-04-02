"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Swords, ArrowRight, Loader2 } from "lucide-react";
import type {
  ClauseDeliberation,
  AgentRole,
} from "@/lib/deliberation/types";

// ============================================
// PROPS
// ============================================

interface DeliberationSummaryProps {
  deliberation: ClauseDeliberation | null;
  onViewDebate: () => void;
  onTriggerDeliberation?: () => void;
  isLoading?: boolean;
  currentAgent?: AgentRole | null;
  documentId?: string;
}

// ============================================
// VERDICT CONFIG
// ============================================

const verdictConfig: Record<string, { color: string; emoji: string; label: string }> = {
  fair: { color: "text-emerald-400", emoji: "✅", label: "FAIR" },
  partially_fair: { color: "text-amber-400", emoji: "⚠️", label: "PARTIALLY FAIR" },
  unfair: { color: "text-red-400", emoji: "❌", label: "UNFAIR" },
  illegal: { color: "text-purple-400", emoji: "⛔", label: "ILLEGAL" },
};

const agentInfo: Record<string, { icon: string; name: string }> = {
  predator: { icon: "🔴", name: "Defense Counsel" },
  guardian: { icon: "🟢", name: "Consumer Advocate" },
  arbiter: { icon: "⚖️", name: "Judicial Arbiter" },
};

// ============================================
// COMPONENT
// ============================================

export function DeliberationSummary({
  deliberation,
  onViewDebate,
  onTriggerDeliberation,
  isLoading = false,
  currentAgent = null,
  documentId,
}: DeliberationSummaryProps) {
  // ── STATE 3: Loading ──
  if (isLoading) {
    const agent = currentAgent ? agentInfo[currentAgent] : null;
    const step = currentAgent === "predator" ? 1 : currentAgent === "guardian" ? 2 : currentAgent === "arbiter" ? 3 : 1;
    const percent = Math.round((step / 3) * 100);

    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="p-3 rounded-xl bg-amber-500/[0.04] border border-amber-500/15"
      >
        <div className="flex items-center gap-2 mb-2">
          <Loader2 className="h-3.5 w-3.5 text-amber-400 animate-spin" />
          <span className="text-xs font-medium text-amber-300">
            Agents deliberating...
          </span>
        </div>
        {agent && (
          <p className="text-xs text-slate-900 dark:text-slate-100 mb-2">
            {agent.icon} {agent.name} is{" "}
            {currentAgent === "arbiter" ? "deliberating" : "arguing"}...
          </p>
        )}
        <div className="h-1.5 rounded-full bg-white dark:bg-slate-900/10 overflow-hidden">
          <motion.div
            className="h-full bg-amber-500 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${percent}%` }}
            transition={{ duration: 0.4 }}
          />
        </div>
        <p className="text-[10px] text-slate-900 dark:text-slate-100 mt-1">
          Step {step} of 3
        </p>
      </motion.div>
    );
  }

  // ── STATE 1: Has deliberation data ──
  if (deliberation) {
    const v = verdictConfig[deliberation.arbiterVerdict.verdict] || verdictConfig.partially_fair;
    const predConf = Math.round(deliberation.predatorArgument.confidence * 100);
    const guardConf = Math.round(deliberation.guardianArgument.confidence * 100);
    const arbConf = Math.round(deliberation.arbiterVerdict.confidence * 100);

    return (
      <motion.div
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-3 rounded-xl bg-white dark:bg-card/[0.03] border border-white/10 hover:border-white/20 transition-colors cursor-pointer group"
        onClick={onViewDebate}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex items-center gap-1.5">
              <span className={`text-xs font-bold ${v.color}`}>
                {v.emoji} {v.label}
              </span>
              <span className="text-[10px] text-slate-900 dark:text-slate-100">
                ({arbConf}%)
              </span>
            </div>
            <span className="text-slate-900 dark:text-slate-100">|</span>
            <div className="flex items-center gap-2 text-[10px] text-slate-900 dark:text-slate-100">
              <span>🔴 {predConf}%</span>
              <span className="text-slate-900 dark:text-slate-100">vs</span>
              <span>🟢 {guardConf}%</span>
            </div>
          </div>
          <div className="flex items-center gap-1 text-xs text-blue-400 group-hover:text-blue-300 shrink-0 ml-2">
            <span className="hidden sm:inline">View Debate</span>
            <ArrowRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
          </div>
        </div>

        {/* Cross-links for unfavorable verdicts */}
        {documentId && deliberation && (
          deliberation.arbiterVerdict.verdict === 'illegal' ||
          deliberation.arbiterVerdict.verdict === 'unfair'
        ) && (
          <div className="flex flex-wrap items-center gap-2 mt-2 pt-2 border-t border-white/5">
            <span className="text-[10px] text-slate-900 dark:text-slate-100">Next:</span>
            {deliberation.arbiterVerdict.verdict === 'illegal' ? (
              <>
                <Link
                  href={`/letter/${documentId}`}
                  className="text-[10px] text-amber-400/60 hover:text-amber-400 transition-colors"
                >
                  Agents agree — Generate legal notice →
                </Link>
                <span className="text-slate-900 dark:text-slate-100">·</span>
                <Link
                  href={`/negotiate/${documentId}`}
                  className="text-[10px] text-emerald-400/60 hover:text-emerald-400 transition-colors"
                >
                  Negotiate →
                </Link>
              </>
            ) : (
              <>
                <Link
                  href={`/negotiate/${documentId}`}
                  className="text-[10px] text-emerald-400/60 hover:text-emerald-400 transition-colors"
                >
                  Flagged unfair — Get negotiation script →
                </Link>
                <span className="text-slate-900 dark:text-slate-100">·</span>
                <Link
                  href={`/letter/${documentId}`}
                  className="text-[10px] text-amber-400/60 hover:text-amber-400 transition-colors"
                >
                  Legal notice →
                </Link>
              </>
            )}
          </div>
        )}
      </motion.div>
    );
  }

  // ── STATE 2: No deliberation, not loading ──
  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-3 rounded-xl bg-white dark:bg-card shadow-sm dark:shadow-slate-900/20 border-l-4 border-indigo-500 border border-white/8 hover:border-white/15 transition-colors cursor-pointer group"
      onClick={onTriggerDeliberation}
    >
      <div className="flex items-center justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <Swords className="h-3.5 w-3.5 text-amber-400/70" />
            <span className="text-xs font-medium text-slate-900 dark:text-slate-100">
              Three AI agents can debate this clause
            </span>
          </div>
          <p className="text-[10px] text-slate-900 dark:text-slate-100 ml-[22px]">
            A corporate lawyer, a rights advocate, and a judge
          </p>
        </div>
        <div className="flex items-center gap-1 text-xs text-amber-400/70 group-hover:text-amber-300 shrink-0 ml-2">
          <span className="hidden sm:inline">Debate</span>
          <ArrowRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
        </div>
      </div>
    </motion.div>
  );
}
