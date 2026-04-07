"use client";

import { motion } from "framer-motion";
import { Swords, Loader2, ChevronRight } from "lucide-react";
import type {
  DeliberationResult,
  DeliberationProgress,
} from "@/lib/deliberation/types";

interface DeliberationCTAProps {
  result: DeliberationResult | null;
  isLoading: boolean;
  progress?: DeliberationProgress | null;
  onRun: () => void;
  onView: () => void;
}

const agentLabels: Record<
  string,
  { icon: string; name: string; action: string }
> = {
  predator: { icon: "🔴", name: "Defense Counsel", action: "arguing" },
  guardian: { icon: "🟢", name: "Consumer Advocate", action: "arguing" },
  arbiter: { icon: "⚖️", name: "Judicial Arbiter", action: "deliberating" },
};

export default function DeliberationCTA({
  result,
  isLoading,
  progress,
  onRun,
  onView,
}: DeliberationCTAProps) {
  // ── Loading / In Progress ──
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
        className="px-3 py-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20"
      >
        <div className="flex items-center gap-3 mb-2">
          <Loader2 className="w-4 h-4 text-amber-400 animate-spin flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-[12px] font-semibold text-amber-400">
              Deliberation in Progress...
            </p>
            <p className="text-[10px] text-[#a3a3a3] mt-0.5">
              {progress?.message || "Agents are deliberating..."}
            </p>
          </div>
        </div>

        {agent && (
          <p className="text-[10px] text-[#a3a3a3] ml-7 mb-1.5">
            {agent.icon} {agent.name} is {agent.action}...
          </p>
        )}

        {/* Progress Bar */}
        <div className="ml-7">
          <div className="h-1 rounded-full bg-[#262626] overflow-hidden mb-1">
            <motion.div
              className="h-full bg-amber-500 rounded-full"
              animate={{ width: `${percent}%` }}
              transition={{ duration: 0.4 }}
            />
          </div>
          <div className="flex justify-between text-[9px] text-[#a3a3a3]">
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

  // ── Result Exists (Completed) ──
  if (result) {
    const { summary } = result;

    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.15 }}
      >
        <button
          onClick={onView}
          className="w-full text-left px-3 py-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 hover:bg-amber-500/15 transition-colors cursor-pointer flex items-center gap-3"
        >
          <Swords className="w-4 h-4 text-amber-400 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-[12px] font-semibold text-amber-400">
              AI Debate Complete
            </p>
            <p className="text-[10px] text-[#a3a3a3] mt-0.5">
              {summary.totalClauses} clauses —{" "}
              {summary.fairCount > 0 && `${summary.fairCount}✅ `}
              {summary.partiallyFairCount > 0 &&
                `${summary.partiallyFairCount}⚠️ `}
              {summary.unfairCount > 0 && `${summary.unfairCount}❌ `}
              {summary.illegalCount > 0 && `${summary.illegalCount}⛔`}
            </p>
          </div>
          <ChevronRight className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
        </button>
      </motion.div>
    );
  }

  // ── No Result (CTA Trigger) ──
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.15 }}
    >
      <button
        onClick={onRun}
        className="w-full text-left px-3 py-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 hover:bg-amber-500/15 transition-colors cursor-pointer flex items-center gap-3"
      >
        <Swords className="w-4 h-4 text-amber-400 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-[12px] font-semibold text-amber-400">
            Run AI Debate
          </p>
          <p className="text-[10px] text-[#a3a3a3] mt-0.5">
            3 AI agents debate whether each clause is fair
          </p>
        </div>
        <ChevronRight className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
      </button>
    </motion.div>
  );
}
