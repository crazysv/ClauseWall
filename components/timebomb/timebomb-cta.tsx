"use client";

// ============================================
// TIMEBOMB CTA
// Call-to-action for the results page
// ============================================

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Timer,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  ChevronRight,
} from "lucide-react";
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
  const [localStats, setLocalStats] = useState<DeadlineStats | null>(
    stats || null,
  );

  // Don't render if no temporal data
  if (!temporalData && !activated) return null;

  // Already activated — show compact summary
  if (activated && localStats) {
    return (
      <div className="border-4 border-black bg-white dark:bg-zinc-900 p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
        <div className="flex items-center justify-between mb-4 border-b-4 border-black pb-4">
          <div className="flex items-center gap-3">
            <ShieldCheck className="w-6 h-6 text-green-600 dark:text-green-500 stroke-[3px]" />
            <span className="text-lg font-black uppercase tracking-widest text-foreground">
              DEFUSER ACTIVE
            </span>
          </div>
          <Link
            href={`/timebomb/${documentId}`}
            className="text-xs font-black uppercase tracking-widest text-blue-600 dark:text-blue-400 flex items-center gap-1 hover:-translate-y-0.5 transition-transform"
          >
            VIEW TIMELINE
            <ChevronRight className="w-4 h-4 stroke-[3px]" />
          </Link>
        </div>
        <TimebombSummary stats={localStats} compact />
      </div>
    );
  }

  // Not activated but temporal data exists
  const deadlineCount = temporalData?.deadlines?.length || 0;
  if (deadlineCount === 0) return null;

  const riskColors = {
    low: "bg-blue-100 border-blue-500 text-blue-900",
    medium: "bg-yellow-100 border-yellow-500 text-yellow-900",
    high: "bg-orange-100 border-orange-500 text-orange-900",
    extreme: "bg-red-100 border-red-500 text-red-900",
  };

  const risk = temporalData?.overall_temporal_risk || "medium";

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 5 }}
        animate={{ opacity: 1, y: 0 }}
        className={`relative overflow-hidden border-8 border-black ${riskColors[risk]} p-6 cursor-pointer group shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-2 hover:translate-x-2 hover:shadow-[0px_0px_0px_0px_rgba(0,0,0,1)] transition-all ease-in-out duration-300`}
        onClick={() => setShowModal(true)}
        role="button"
        tabIndex={0}
        aria-label="Activate Time Bomb Defuser"
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") setShowModal(true);
        }}
      >
        {/* Animated timer icon */}
        <motion.div
          className="absolute -right-4 -top-8 opacity-20 pointer-events-none"
          animate={{ rotate: [0, 360] }}
          transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
        >
          <Timer className="w-48 h-48 stroke-[1px] text-black" />
        </motion.div>

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4 border-b-4 border-black/20 pb-4">
            <AlertTriangle className="w-8 h-8 text-black stroke-[3px]" />
            <h3 className="text-xl font-black uppercase tracking-widest text-black">
              🕐 {deadlineCount} TIME BOMB{deadlineCount !== 1 ? "S" : ""}{" "}
              DETECTED
            </h3>
          </div>

          <p className="text-sm font-bold uppercase tracking-widest text-black/70 mb-6 pr-12 leading-relaxed">
            WE FOUND {deadlineCount} CRITICAL DEADLINE
            {deadlineCount !== 1 ? "S" : ""} IN THIS CONTRACT. ACTIVATE THE
            DEFUSER TO TRACK THEM.
          </p>

          <div className="flex items-center justify-between mt-auto">
            <span
              className={`text-xs uppercase tracking-widest font-black px-4 py-2 border-4 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] ${
                risk === "extreme" || risk === "high"
                  ? "bg-red-500 text-white"
                  : risk === "medium"
                    ? "bg-yellow-400 text-black"
                    : "bg-blue-400 text-white"
              }`}
            >
              {risk} RISK
            </span>
            <span className="text-sm font-black uppercase tracking-widest text-black flex items-center gap-2 group-hover:underline">
              ACTIVATE NOW
              <ArrowRight className="w-5 h-5 stroke-[3px] group-hover:translate-x-2 transition-transform" />
            </span>
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
