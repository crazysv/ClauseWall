"use client";

import { motion } from "framer-motion";
import { ArrowRight, Swords, Loader2 } from "lucide-react";
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

const agentLabels: Record<string, { icon: string; name: string; action: string }> = {
  predator: { icon: "🔴", name: "Defense Counsel", action: "arguing" },
  guardian: { icon: "🟢", name: "Consumer Advocate", action: "arguing" },
  arbiter: { icon: "⚖️", name: "Judicial Arbiter", action: "deliberating" },
};

export function DeliberationCTA({
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
        className="mt-4 p-4 rounded-xl bg-white dark:bg-card border border-slate-200 dark:border-slate-700 border-l-4 border-l-amber-500 shadow-sm dark:shadow-slate-900/20"
      >
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-50 flex-shrink-0 animate-pulse">
              <Loader2 className="h-6 w-6 text-amber-500 animate-spin" />
            </div>
            <div>
              <p className="font-extrabold text-sm text-slate-900 dark:text-slate-100">
                Deliberation in Progress...
              </p>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-0.5">
                {progress?.message || "Agents are debating terms..."}
                {agent && <span className="font-bold text-amber-600 block sm:inline sm:ml-2">{agent.icon} {agent.name} is {agent.action}</span>}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 mt-1 sm:ml-12">
            <div className="flex-1 h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden border border-slate-200 dark:border-slate-700">
              <motion.div
                className="h-full bg-amber-500 rounded-full"
                animate={{ width: `${percent}%` }}
                transition={{ duration: 0.4 }}
              />
            </div>
            <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest whitespace-nowrap">
               {progress?.currentClause || 0} / {progress?.totalClauses || "?"}
            </span>
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
        transition={{ duration: 0.3, delay: 0.1 }}
        className="mt-4 p-4 rounded-xl bg-white dark:bg-card border border-slate-200 dark:border-slate-700 border-l-4 border-l-amber-500 shadow-sm dark:shadow-slate-900/20 hover:shadow-md transition-all cursor-pointer group"
        onClick={onView}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-50 flex-shrink-0 group-hover:bg-amber-100 transition-colors">
              <Swords className="h-6 w-6 text-amber-600" />
            </div>
            <div>
              <p className="font-extrabold text-sm text-slate-900 dark:text-slate-100">
                ⚔️ AI Debate Complete
              </p>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-0.5 max-w-lg line-clamp-1">
                3 agents debated {summary.totalClauses} clauses —{" "}
                {summary.fairCount > 0 && `${summary.fairCount}✅ `}
                {summary.partiallyFairCount > 0 && `${summary.partiallyFairCount}⚠️ `}
                {summary.unfairCount > 0 && `${summary.unfairCount}❌ `}
                {summary.illegalCount > 0 && `${summary.illegalCount}⛔`}
              </p>
            </div>
          </div>
          <div className="w-full sm:w-auto flex-shrink-0">
             <button className="w-full sm:w-auto px-4 py-2 sm:py-1.5 rounded-full border-2 border-teal-200 text-teal-700 bg-white dark:bg-card group-hover:bg-teal-50 group-hover:border-teal-300 text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-sm dark:shadow-slate-900/20">
                View Transcripts <ArrowRight className="h-3.5 w-3.5 text-teal-600 group-hover:translate-x-1 transition-transform" />
             </button>
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
      transition={{ duration: 0.3, delay: 0.1 }}
      className="mt-4 p-4 rounded-xl bg-white dark:bg-card border border-slate-200 dark:border-slate-700 border-l-4 border-l-amber-500 shadow-sm dark:shadow-slate-900/20 hover:shadow-md transition-all cursor-pointer group"
      onClick={onRun}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-amber-50 flex-shrink-0 group-hover:bg-amber-100 transition-colors">
            <Swords className="h-6 w-6 text-amber-600" />
          </div>
          <div>
            <p className="font-extrabold text-sm text-slate-900 dark:text-slate-100">
              ⚔️ Run AI Debate Simulation
            </p>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-0.5 max-w-lg line-clamp-1">
              Three AI agents (Defense Counsel, Advocate, Arbiter) will intensely debate every clause in this contract.
            </p>
          </div>
        </div>
        <div className="w-full sm:w-auto flex-shrink-0">
           <button className="w-full sm:w-auto px-4 py-2 sm:py-1.5 rounded-full border-2 border-teal-200 text-teal-700 bg-white dark:bg-card group-hover:bg-teal-50 group-hover:border-teal-300 text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-sm dark:shadow-slate-900/20">
              Start Debate <ArrowRight className="h-3.5 w-3.5 text-teal-600 group-hover:translate-x-1 transition-transform" />
           </button>
        </div>
      </div>
    </motion.div>
  );
}
