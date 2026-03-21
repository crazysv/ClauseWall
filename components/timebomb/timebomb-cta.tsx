"use client";

// ============================================
// TIMEBOMB CTA
// Call-to-action for the results page
// ============================================

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

  // Don't render if no temporal data
  if (!temporalData && !activated) return null;

  // Already activated — show compact summary
  if (activated && localStats) {
    return (
      <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-green-400" />
            <span className="text-sm font-semibold text-white">
              Time Bomb Defuser Active
            </span>
          </div>
          <Link
            href={`/timebomb/${documentId}`}
            className="text-xs text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-1"
          >
            View timeline
            <ChevronRight className="w-3 h-3" />
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
    low: "from-blue-500/20 to-cyan-500/20 border-blue-500/20",
    medium: "from-yellow-500/20 to-orange-500/20 border-yellow-500/20",
    high: "from-orange-500/20 to-red-500/20 border-orange-500/20",
    extreme: "from-red-500/20 to-purple-500/20 border-red-500/20",
  };

  const risk = temporalData?.overall_temporal_risk || "medium";

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 5 }}
        animate={{ opacity: 1, y: 0 }}
        className={`relative overflow-hidden rounded-xl border bg-gradient-to-br ${riskColors[risk]} p-4 cursor-pointer group`}
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
          className="absolute right-3 top-3 opacity-10"
          animate={{ rotate: [0, 360] }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        >
          <Timer className="w-16 h-16" />
        </motion.div>

        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-4 h-4 text-orange-400" />
            <h3 className="text-sm font-bold text-white">
              🕐 {deadlineCount} Time Bomb{deadlineCount !== 1 ? "s" : ""} Found
            </h3>
          </div>

          <p className="text-xs text-white/50 mb-3 pr-16">
            We detected {deadlineCount} critical deadline
            {deadlineCount !== 1 ? "s" : ""} in your contract. Activate the
            Time Bomb Defuser to track them and never miss one.
          </p>

          <div className="flex items-center justify-between">
            <span
              className={`text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full ${
                risk === "extreme" || risk === "high"
                  ? "bg-red-500/20 text-red-400"
                  : risk === "medium"
                    ? "bg-yellow-500/20 text-yellow-400"
                    : "bg-blue-500/20 text-blue-400"
              }`}
            >
              {risk} temporal risk
            </span>
            <span className="text-xs text-white/40 flex items-center gap-1 group-hover:text-white/60 transition-colors">
              Activate
              <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
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
