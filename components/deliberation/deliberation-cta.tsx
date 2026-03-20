"use client";

import { motion } from "framer-motion";
import { ArrowRight, Swords, Loader2 } from "lucide-react";
import type {
  DeliberationResult,
  DeliberationProgress,
} from "@/lib/deliberation/types";

// ============================================
// PROPS
// ============================================

interface DeliberationCTAProps {
  result: DeliberationResult | null;
  isLoading: boolean;
  progress?: DeliberationProgress | null;
  onRun: () => void;
  onView: () => void;
}

// ============================================
// AGENT INFO
// ============================================

const agentLabels: Record<string, { icon: string; name: string; action: string }> = {
  predator: { icon: "🔴", name: "Defense Counsel", action: "arguing" },
  guardian: { icon: "🟢", name: "Consumer Advocate", action: "arguing" },
  arbiter: { icon: "⚖️", name: "Judicial Arbiter", action: "deliberating" },
};

// ============================================
// COMPONENT
// ============================================

export default function DeliberationCTA({
  result,
  isLoading,
  progress,
  onRun,
  onView,
}: DeliberationCTAProps) {
  // ── STATE 3: Loading / In Progress ──
  if (isLoading) {
    const agent = progress?.currentAgent
      ? agentLabels[progress.currentAgent]
      : null;
    const percent = progress
      ? Math.round((progress.currentClause / progress.totalClauses) * 100)
      : 0;

    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mt-4 p-4 rounded-xl bg-gradient-to-r from-amber-500/10 via-orange-500/8 to-amber-500/10 border border-amber-500/20"
      >
        <div className="flex items-center gap-3 mb-3">
          <div className="p-2 rounded-lg bg-amber-500/15">
            <Loader2 className="h-5 w-5 text-amber-400 animate-spin" />
          </div>
          <div>
            <p className="text-sm font-semibold text-amber-300">
              Deliberation in Progress...
            </p>
            <p className="text-xs text-gray-400 mt-0.5">
              {progress?.message || "Agents are deliberating..."}
            </p>
          </div>
        </div>

        {agent && (
          <p className="text-xs text-white/50 mb-2 ml-[52px]">
            {agent.icon} {agent.name} is {agent.action}...
          </p>
        )}

        {/* Progress Bar */}
        <div className="ml-[52px]">
          <div className="h-1.5 rounded-full bg-white/10 overflow-hidden mb-1">
            <motion.div
              className="h-full bg-amber-500 rounded-full"
              animate={{ width: `${percent}%` }}
              transition={{ duration: 0.4 }}
            />
          </div>
          <div className="flex justify-between text-[10px] text-white/30">
            <span>
              Clause {progress?.currentClause || 0} of{" "}
              {progress?.totalClauses || "?"}
            </span>
            {progress?.estimatedTimeRemaining !== undefined && (
              <span>~{progress.estimatedTimeRemaining}s remaining</span>
            )}
          </div>
        </div>
      </motion.div>
    );
  }

  // ── STATE 1: Result Exists (Completed) ──
  if (result) {
    const { summary } = result;

    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.15 }}
        className="mt-4 p-4 rounded-xl border border-amber-500/20 bg-amber-500/[0.03] hover:bg-amber-500/[0.06] transition-all cursor-pointer group"
        onClick={onView}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-500/10 group-hover:bg-amber-500/20 transition-colors">
              <Swords className="h-5 w-5 text-amber-400" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-amber-300">
                ⚔️ Adversarial Deliberation Complete
              </h4>
              <p className="text-xs text-gray-400 mt-0.5">
                3 agents debated {summary.totalClauses} clauses —{" "}
                {summary.fairCount > 0 && `${summary.fairCount}✅ `}
                {summary.partiallyFairCount > 0 && `${summary.partiallyFairCount}⚠️ `}
                {summary.unfairCount > 0 && `${summary.unfairCount}❌ `}
                {summary.illegalCount > 0 && `${summary.illegalCount}⛔`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0 ml-4">
            <span className="text-sm font-medium text-amber-400 hidden sm:inline">
              View All
            </span>
            <ArrowRight className="h-5 w-5 text-amber-400 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>
      </motion.div>
    );
  }

  // ── STATE 2: No Result (CTA Trigger) ──
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.15 }}
      className="mt-4 p-4 rounded-xl bg-gradient-to-r from-amber-500/8 via-orange-500/5 to-amber-500/8 border border-amber-500/15 hover:border-amber-500/30 hover:from-amber-500/12 hover:to-amber-500/12 transition-all cursor-pointer group"
      onClick={onRun}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-amber-500/10 group-hover:bg-amber-500/20 transition-colors">
            <Swords className="h-6 w-6 text-amber-400" />
          </div>
          <div>
            <p className="font-semibold text-amber-300">
              ⚔️ Run Adversarial Deliberation
            </p>
            <p className="text-sm text-gray-400 mt-0.5">
              Three AI agents — a corporate lawyer, a consumer rights advocate,
              and a retired judge — will debate every clause in this contract.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0 ml-4">
          <span className="text-sm font-medium text-amber-400 hidden sm:inline">
            Start
          </span>
          <ArrowRight className="h-5 w-5 text-amber-400 group-hover:translate-x-1 transition-transform" />
        </div>
      </div>
    </motion.div>
  );
}
