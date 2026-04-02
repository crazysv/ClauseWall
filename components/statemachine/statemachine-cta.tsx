"use client";

import { motion } from "framer-motion";
import { ArrowRight, GitBranch } from "lucide-react";
import type { StateMachineReport } from "@/lib/statemachine/types";

interface StateMachineCTAProps {
  report: StateMachineReport | null;
  onExplore: () => void;
}

export function StateMachineCTA({ report, onExplore }: StateMachineCTAProps) {
  if (!report) return null;

  const sm = report.stateMachine;
  const trapCount = report.trapAnalysis.length;
  
  const isDanger = trapCount > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.1 }}
      className={`mt-4 p-6 rounded-xl bg-white dark:bg-card border border-slate-200 dark:border-slate-700 border-l-4 shadow-sm dark:shadow-slate-900/20 hover:shadow-md transition-all cursor-pointer group ${isDanger ? 'border-l-rose-500' : 'border-l-emerald-500'}`}
      onClick={onExplore}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="flex items-center gap-3">
          <div className={`p-2.5 rounded-xl flex-shrink-0 group-hover:bg-opacity-80 transition-colors ${isDanger ? 'bg-rose-50' : 'bg-emerald-50'}`}>
            <GitBranch className={`h-6 w-6 ${isDanger ? 'text-rose-500' : 'text-emerald-500'}`} />
          </div>
          <div>
            <p className="font-extrabold text-sm text-slate-900 dark:text-slate-100">
               State Machine Analyzer
            </p>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-0.5 max-w-lg line-clamp-1">
               {sm.metadata.totalStates} execution paths mapped. {trapCount > 0 ? <span className="text-rose-600 font-bold">{trapCount} dead-end traps isolated.</span> : <span className="text-emerald-600 font-bold">No structural traps found.</span>}
            </p>
          </div>
        </div>
        <div className="w-full sm:w-auto flex-shrink-0">
           <button className="w-full sm:w-auto px-4 py-2 sm:py-1.5 rounded-full border-2 border-teal-200 text-teal-700 bg-white dark:bg-card group-hover:bg-teal-50 group-hover:border-teal-300 text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-sm dark:shadow-slate-900/20">
              Explore Branches <ArrowRight className="h-3.5 w-3.5 text-teal-600 group-hover:translate-x-1 transition-transform" />
           </button>
        </div>
      </div>
    </motion.div>
  );
}
