"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Shield,
  AlertTriangle,
  Skull,
  Activity,
  DoorOpen,
} from "lucide-react";
import type { StateMachineReport, SafetyLevel } from "@/lib/statemachine/types";

interface ReportCardProps {
  report: StateMachineReport;
  onExplore: () => void;
  documentId?: string;
}

const SAFETY_STYLES: Record<
  SafetyLevel,
  { border: string; bg: string; icon: typeof Shield; color: string }
> = {
  safe: {
    border: "border-emerald-900/50",
    bg: "bg-emerald-950/20",
    icon: Shield,
    color: "text-emerald-400",
  },
  moderate: {
    border: "border-amber-900/50",
    bg: "bg-amber-950/20",
    icon: AlertTriangle,
    color: "text-amber-400",
  },
  dangerous: {
    border: "border-red-900/50",
    bg: "bg-red-950/20",
    icon: Skull,
    color: "text-red-400",
  },
  critical: {
    border: "border-red-500/50",
    bg: "bg-red-950/30",
    icon: Skull,
    color: "text-red-400",
  },
};

export default function ReportCard({
  report,
  onExplore,
  documentId,
}: ReportCardProps) {
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
      className={`border ${style.border} ${style.bg} p-5`}
    >
      <div className="flex items-center gap-2.5 mb-5 border-b border-neutral-800 pb-3">
        <span className="text-lg">🔄</span>
        <h3 className="text-[9px] font-mono uppercase tracking-widest text-neutral-300">
          Trap Detector Analysis
        </h3>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        <div className="p-3 bg-[#050505] border border-neutral-800 text-center">
          <p className="text-lg font-mono tabular-nums text-neutral-200">
            {sm.metadata.totalStates}
          </p>
          <p className="text-[7px] font-mono uppercase tracking-widest text-neutral-500 mt-1">
            States
          </p>
        </div>
        <div className="p-3 bg-[#050505] border border-neutral-800 text-center">
          <p className="text-lg font-mono tabular-nums text-neutral-200">
            {sm.metadata.totalTransitions}
          </p>
          <p className="text-[7px] font-mono uppercase tracking-widest text-neutral-500 mt-1">
            Transitions
          </p>
        </div>
        <div
          className={`p-3 border text-center ${report.trapAnalysis.length > 0 ? "border-red-900/50 bg-red-950/20" : "border-emerald-900/50 bg-emerald-950/20"}`}
        >
          <p className={`text-lg font-mono tabular-nums ${report.trapAnalysis.length > 0 ? "text-red-400" : "text-emerald-400"}`}>
            {report.trapAnalysis.length}
          </p>
          <p className="text-[7px] font-mono uppercase tracking-widest text-neutral-500 mt-1">
            Traps {report.trapAnalysis.length > 0 && "💀"}
          </p>
        </div>
        <div className="p-3 bg-[#050505] border border-neutral-800 text-center">
          <div className="flex items-center justify-center gap-1.5">
            <SafetyIcon className={`h-4 w-4 ${style.color}`} />
            <p className={`text-xs font-mono uppercase ${style.color}`}>
              {report.overallSafety}
            </p>
          </div>
          <p className="text-[7px] font-mono uppercase tracking-widest text-neutral-500 mt-1">
            Safety
          </p>
        </div>
      </div>

      <p className="text-[9px] font-mono text-neutral-400 mb-5 flex items-start gap-2 bg-[#050505] p-3 border-l-2 border-neutral-700 leading-relaxed">
        {report.trapAnalysis.length > 0 && (
          <AlertTriangle className="h-3.5 w-3.5 text-red-400 flex-shrink-0 mt-0.5" />
        )}
        {summaryShort}
      </p>

      <button
        onClick={onExplore}
        className="flex items-center justify-center gap-2 text-[8px] font-mono uppercase tracking-widest text-neutral-400 hover:text-neutral-200 border border-neutral-800 bg-[#050505] hover:border-neutral-600 p-2.5 w-full sm:w-auto transition-colors group"
      >
        <Activity className="h-3.5 w-3.5 group-hover:animate-pulse" />
        Explore State Machine
        <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
      </button>

      {/* Cross-link to escape when traps exist */}
      {documentId && report.trapAnalysis && report.trapAnalysis.length > 0 && (
        <Link
          href={`/escape/${documentId}`}
          className="text-[8px] font-mono uppercase tracking-widest text-red-400 hover:text-red-300 transition-colors mt-3 inline-flex items-center gap-1.5 border border-red-900/50 bg-red-950/10 px-2 py-1"
        >
          <DoorOpen className="w-3 h-3" />
          {report.trapAnalysis.length} trap
          {report.trapAnalysis.length !== 1 ? "s" : ""} found — Get escape plan
          →
        </Link>
      )}
    </motion.div>
  );
}
