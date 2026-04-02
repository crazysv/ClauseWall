"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Shield, AlertTriangle, Skull, Activity, DoorOpen } from "lucide-react";
import type { StateMachineReport, SafetyLevel } from "@/lib/statemachine/types";

interface ReportCardProps {
  report: StateMachineReport;
  onExplore: () => void;
  documentId?: string;
}

const SAFETY_STYLES: Record<SafetyLevel, { border: string; bg: string; icon: typeof Shield; color: string }> = {
  safe: { border: "border-emerald-500/30", bg: "bg-emerald-500/5", icon: Shield, color: "text-emerald-400" },
  moderate: { border: "border-amber-500/30", bg: "bg-amber-500/5", icon: AlertTriangle, color: "text-amber-400" },
  dangerous: { border: "border-red-500/30", bg: "bg-red-500/5", icon: Skull, color: "text-red-400" },
  critical: { border: "border-red-600/50", bg: "bg-red-500/5", icon: Skull, color: "text-red-500" },
};

export function ReportCard({ report, onExplore, documentId }: ReportCardProps) {
  const sm = report.stateMachine;
  const style = SAFETY_STYLES[report.overallSafety];
  const SafetyIcon = style.icon;

  // First sentence only
  const summaryShort = report.summary.split(".")[0] + ".";

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.1 }}
      className={`rounded-xl border ${style.border} ${style.bg} p-6`}
    >
      <div className="flex items-center gap-2 mb-4">
        <span className="text-lg">🔄</span>
        <h3 className="font-semibold text-sm">Trap Detector Analysis</h3>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
        <div className="p-2.5 rounded-xl bg-white dark:bg-card/[0.03] border border-white/5 text-center">
          <p className="text-lg font-bold text-indigo-400">{sm.metadata.totalStates}</p>
          <p className="text-[10px] text-slate-500 dark:text-slate-400">States</p>
        </div>
        <div className="p-2.5 rounded-xl bg-white dark:bg-card/[0.03] border border-white/5 text-center">
          <p className="text-lg font-bold text-teal-400">{sm.metadata.totalTransitions}</p>
          <p className="text-[10px] text-slate-500 dark:text-slate-400">Transitions</p>
        </div>
        <div className="p-2.5 rounded-xl bg-white dark:bg-card/[0.03] border border-white/5 text-center">
          <p className={`text-lg font-bold ${report.trapAnalysis.length > 0 ? "text-red-400" : "text-green-400"}`}>
            {report.trapAnalysis.length}
          </p>
          <p className="text-[10px] text-slate-500 dark:text-slate-400">Traps {report.trapAnalysis.length > 0 && "💀"}</p>
        </div>
        <div className="p-2.5 rounded-xl bg-white dark:bg-card/[0.03] border border-white/5 text-center">
          <div className="flex items-center justify-center gap-1">
            <SafetyIcon className={`h-4 w-4 ${style.color}`} />
            <p className={`text-xs font-bold uppercase ${style.color}`}>
              {report.overallSafety}
            </p>
          </div>
          <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">Safety</p>
        </div>
      </div>

      <p className="text-xs text-slate-400 mb-4 flex items-start gap-1.5">
        {report.trapAnalysis.length > 0 && <AlertTriangle className="h-3.5 w-3.5 text-amber-400 flex-shrink-0 mt-0.5" />}
        {summaryShort}
      </p>

      <button
        onClick={onExplore}
        className="flex items-center gap-2 text-sm font-medium text-indigo-400 hover:text-indigo-300 transition-colors group"
      >
        <Activity className="h-4 w-4" />
        Explore State Machine
        <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
      </button>

      {/* Cross-link to escape when traps exist */}
      {documentId && report.trapAnalysis && report.trapAnalysis.length > 0 && (
        <Link
          href={`/escape/${documentId}`}
          className="text-[11px] text-emerald-400/50 hover:text-emerald-400 transition-colors mt-2 inline-flex items-center gap-1"
        >
          <DoorOpen className="w-3 h-3" />
          {report.trapAnalysis.length} trap{report.trapAnalysis.length !== 1 ? 's' : ''} found — Get escape plan →
        </Link>
      )}
    </motion.div>
  );
}
