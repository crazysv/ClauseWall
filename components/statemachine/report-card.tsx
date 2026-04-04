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
  safe: { border: "border-green-600", bg: "bg-green-100", icon: Shield, color: "text-green-700" },
  moderate: { border: "border-amber-600", bg: "bg-amber-100", icon: AlertTriangle, color: "text-amber-700" },
  dangerous: { border: "border-red-600", bg: "bg-red-100", icon: Skull, color: "text-red-700" },
  critical: { border: "border-red-900", bg: "bg-red-200", icon: Skull, color: "text-red-900" },
};

export default function ReportCard({ report, onExplore, documentId }: ReportCardProps) {
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
      className={`border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] ${style.bg} p-6`}
    >
      <div className="flex items-center gap-3 mb-6 border-b-4 border-black pb-3">
        <span className="text-2xl">🔄</span>
        <h3 className="font-black text-lg uppercase tracking-widest text-black">Trap Detector Analysis</h3>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <div className="p-3 bg-white border-4 border-black text-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <p className="text-2xl font-black text-black">{sm.metadata.totalStates}</p>
          <p className="text-[10px] font-bold uppercase tracking-widest text-black mt-1">States</p>
        </div>
        <div className="p-3 bg-white border-4 border-black text-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <p className="text-2xl font-black text-black">{sm.metadata.totalTransitions}</p>
          <p className="text-[10px] font-bold uppercase tracking-widest text-black mt-1">Transitions</p>
        </div>
        <div className={`p-3 border-4 border-black text-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] ${report.trapAnalysis.length > 0 ? "bg-red-100" : "bg-green-100"}`}>
          <p className={`text-2xl font-black text-black`}>
            {report.trapAnalysis.length}
          </p>
          <p className="text-[10px] font-bold uppercase tracking-widest text-black mt-1">Traps {report.trapAnalysis.length > 0 && "💀"}</p>
        </div>
        <div className={`p-3 border-4 border-black text-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] bg-white`}>
          <div className="flex items-center justify-center gap-1.5 h-8">
            <SafetyIcon className={`h-5 w-5 ${style.color}`} />
            <p className={`text-sm font-black uppercase ${style.color}`}>
              {report.overallSafety}
            </p>
          </div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-black mt-1">Safety</p>
        </div>
      </div>

      <p className="text-sm font-bold text-black mb-6 flex items-start gap-2 bg-white/60 p-4 border-l-4 border-black">
        {report.trapAnalysis.length > 0 && <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />}
        {summaryShort}
      </p>

      <button
        onClick={onExplore}
        className="flex items-center justify-center gap-2 text-sm font-black uppercase tracking-widest text-black hover:bg-black hover:text-white transition-colors group border-4 border-black p-3 w-full sm:w-auto shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-y-1 hover:shadow-[0px_0px_0px_0px_rgba(0,0,0,1)] bg-white"
      >
        <Activity className="h-5 w-5 group-hover:animate-pulse" />
        Explore State Machine
        <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
      </button>

      {/* Cross-link to escape when traps exist */}
      {documentId && report.trapAnalysis && report.trapAnalysis.length > 0 && (
        <Link
          href={`/escape/${documentId}`}
          className="text-xs font-black uppercase tracking-widest text-red-700 hover:text-red-900 hover:underline transition-colors mt-4 inline-flex items-center gap-2 bg-white/50 px-2 py-1 border-2 border-red-700"
        >
          <DoorOpen className="w-4 h-4" />
          {report.trapAnalysis.length} trap{report.trapAnalysis.length !== 1 ? 's' : ''} found — Get escape plan →
        </Link>
      )}
    </motion.div>
  );
}
