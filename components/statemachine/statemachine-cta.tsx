"use client";

import { motion } from "framer-motion";
import { ArrowRight, GitBranch } from "lucide-react";
import type { StateMachineReport } from "@/lib/statemachine/types";

interface StateMachineCTAProps {
  report: StateMachineReport | null;
  onExplore: () => void;
}

export default function StateMachineCTA({
  report,
  onExplore,
}: StateMachineCTAProps) {
  if (!report) return null;

  const sm = report.stateMachine;
  const trapCount = report.trapAnalysis.length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.15 }}
      className={`border-4 p-5 cursor-pointer transition-all hover:translate-y-1 hover:shadow-none ${
        trapCount > 0
          ? "border-red-900 bg-red-100 shadow-[6px_6px_0_0_rgba(127,29,29,1)]"
          : "border-green-800 bg-green-100 shadow-[6px_6px_0_0_rgba(22,101,52,1)]"
      }`}
      onClick={onExplore}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div
            className={`p-3 border-2 border-black bg-white shadow-[2px_2px_0_0_rgba(0,0,0,1)]`}
          >
            <GitBranch className={`h-6 w-6 text-black`} />
          </div>
          <div>
            <h4 className="text-sm font-black uppercase tracking-widest text-black mb-1">
              🔄 Your Contract Has {sm.metadata.totalStates} States{" "}
              {trapCount > 0 && (
                <span className="text-red-900">
                  and {trapCount} Trap{trapCount > 1 ? "s" : ""}
                </span>
              )}
            </h4>
            <p className="text-xs font-bold text-black/70">
              See how your contract executes over time and where you could get
              trapped.
            </p>
            <p className="text-[10px] font-black uppercase tracking-widest text-black/40 mt-1">
              Find hidden trap paths in your contract&apos;s timeline
            </p>
          </div>
        </div>
        <div className="bg-white border-2 border-black p-2 shadow-[2px_2px_0_0_rgba(0,0,0,1)]">
          <ArrowRight className="h-5 w-5 text-black flex-shrink-0" />
        </div>
      </div>
    </motion.div>
  );
}
