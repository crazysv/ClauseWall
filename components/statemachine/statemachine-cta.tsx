"use client";

import { motion } from "framer-motion";
import { ArrowRight, GitBranch } from "lucide-react";
import type { StateMachineReport } from "@/lib/statemachine/types";

interface StateMachineCTAProps {
  report: StateMachineReport | null;
  onExplore: () => void;
}

export default function StateMachineCTA({ report, onExplore }: StateMachineCTAProps) {
  if (!report) return null;

  const sm = report.stateMachine;
  const trapCount = report.trapAnalysis.length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.15 }}
      className={`rounded-xl border p-4 cursor-pointer transition-all hover:scale-[1.01] ${
        trapCount > 0
          ? "border-red-500/20 bg-red-500/[0.03] hover:bg-red-500/[0.06]"
          : "border-emerald-500/20 bg-emerald-500/[0.03] hover:bg-emerald-500/[0.06]"
      }`}
      onClick={onExplore}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${
            trapCount > 0 ? "bg-red-500/10" : "bg-emerald-500/10"
          }`}>
            <GitBranch className={`h-4 w-4 ${
              trapCount > 0 ? "text-red-400" : "text-emerald-400"
            }`} />
          </div>
          <div>
            <h4 className="text-sm font-semibold">
              🔄 Your Contract Has {sm.metadata.totalStates} States{" "}
              {trapCount > 0 && (
                <span className="text-red-400">and {trapCount} Trap{trapCount > 1 ? "s" : ""}</span>
              )}
            </h4>
            <p className="text-xs text-gray-400 mt-0.5">
              See how your contract executes over time and where you could get trapped.
            </p>
            <p className="text-[10px] text-white/30 mt-0.5">Find hidden trap paths in your contract&apos;s timeline</p>
          </div>
        </div>
        <ArrowRight className="h-4 w-4 text-gray-500 flex-shrink-0" />
      </div>
    </motion.div>
  );
}
