"use client";

import { motion } from "framer-motion";
import { GitBranch, ChevronRight } from "lucide-react";
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
  const hasTraps = trapCount > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.15 }}
    >
      <button
        onClick={onExplore}
        className={`w-full text-left px-3 py-2.5 rounded-lg border cursor-pointer transition-colors flex items-center gap-3 ${
          hasTraps
            ? "bg-[#dc2626]/10 border-[#dc2626]/20 hover:bg-[#dc2626]/15"
            : "bg-green-500/10 border-green-500/20 hover:bg-green-500/15"
        }`}
      >
        <GitBranch
          className={`w-4 h-4 flex-shrink-0 ${hasTraps ? "text-[#dc2626]" : "text-green-500"}`}
        />
        <div className="flex-1 min-w-0">
          <p
            className={`text-[12px] font-semibold ${hasTraps ? "text-[#dc2626]" : "text-green-500"}`}
          >
            {sm.metadata.totalStates} States
            {hasTraps && ` • ${trapCount} Trap${trapCount > 1 ? "s" : ""}`}
          </p>
          <p className="text-[10px] text-[#a3a3a3] mt-0.5">
            Find hidden trap paths in your contract
          </p>
        </div>
        <ChevronRight
          className={`w-3.5 h-3.5 flex-shrink-0 ${hasTraps ? "text-[#dc2626]" : "text-green-500"}`}
        />
      </button>
    </motion.div>
  );
}
