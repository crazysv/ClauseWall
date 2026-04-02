"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Timer, AlertTriangle, ArrowRight, ShieldCheck, ChevronRight } from "lucide-react";
import Link from "next/link";
import type { TemporalExtractionResult, DeadlineStats } from "@/types";
import { SigningDateModal } from "./signing-date-modal";
import { TimebombSummary } from "./timebomb-summary";

interface TimebombCTAProps {
  documentId: string;
  temporalData: TemporalExtractionResult | null;
  hasActivated: boolean;
  stats?: DeadlineStats | null;
}

export function TimebombCTA({
  documentId,
  temporalData,
  hasActivated,
  stats,
}: TimebombCTAProps) {
  const [showModal, setShowModal] = useState(false);
  const [activated, setActivated] = useState(hasActivated);
  const [localStats, setLocalStats] = useState<DeadlineStats | null>(stats || null);

  if (!temporalData && !activated) return null;

  if (activated && localStats) {
    return (
      <div className="mt-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-card p-5 shadow-sm dark:shadow-slate-900/20">
        <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-5 h-5 text-emerald-500" />
            <span className="text-sm font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
              Time Bomb Tracking Active
            </span>
          </div>
          <Link
            href={`/timebomb/${documentId}`}
            className="text-xs font-bold text-teal-600 hover:text-teal-700 transition-colors flex items-center gap-1 bg-teal-50 px-2 py-1 rounded"
          >
            Dashboard
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>
        <TimebombSummary stats={localStats} compact />
      </div>
    );
  }

  const deadlineCount = temporalData?.deadlines?.length || 0;
  if (deadlineCount === 0) return null;

  const risk = temporalData?.overall_temporal_risk || "medium";
  
  const isExtreme = risk === "extreme" || risk === "high";
  const isMed = risk === "medium";
  
  const bgColors = isExtreme ? "bg-rose-50 border-rose-200 text-rose-500" : isMed ? "bg-amber-50 border-amber-200 text-amber-500" : "bg-blue-50 border-blue-200 text-blue-500";
  const borderLink = isExtreme ? "border-l-rose-500" : isMed ? "border-l-amber-500" : "border-l-blue-500";

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 5 }}
        animate={{ opacity: 1, y: 0 }}
        className={`mt-4 relative overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700 border-l-4 ${borderLink} bg-white dark:bg-card shadow-sm dark:shadow-slate-900/20 hover:shadow-md transition-all cursor-pointer group`}
        onClick={() => setShowModal(true)}
        role="button"
        tabIndex={0}
      >
        <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl flex-shrink-0 group-hover:bg-opacity-80 transition-colors ${bgColors}`}>
              <Timer className="w-6 h-6" />
            </div>
            <div>
              <p className="font-extrabold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
                {deadlineCount} Silent Time Bomb{deadlineCount !== 1 ? "s" : ""} Found <span className={`text-[9px] uppercase tracking-widest font-black px-1.5 py-0.5 rounded shadow-sm dark:shadow-slate-900/20 border bg-white dark:bg-card ${isExtreme ? "text-rose-600 border-rose-200" : isMed ? "text-amber-600 border-amber-200" : "text-blue-600 border-blue-200"}`}>{risk} RISK</span>
              </p>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-0.5 max-w-lg line-clamp-1">
                Activate the Defuser algorithm to monitor critical structural deadlines globally.
              </p>
            </div>
          </div>
          <div className="w-full sm:w-auto flex-shrink-0">
             <button className="w-full sm:w-auto px-4 py-2 sm:py-1.5 rounded-full border-2 border-teal-200 text-teal-700 bg-white dark:bg-card group-hover:bg-teal-50 group-hover:border-teal-300 text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-sm dark:shadow-slate-900/20">
                Activate Defuser <ArrowRight className="h-3.5 w-3.5 text-teal-600 group-hover:translate-x-1 transition-transform" />
             </button>
          </div>
        </div>
      </motion.div>

      <SigningDateModal
        documentId={documentId}
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onActivated={(data) => {
          setActivated(true);
          if (data.stats) {
            setLocalStats(data.stats as DeadlineStats);
          }
        }}
      />
    </>
  );
}
