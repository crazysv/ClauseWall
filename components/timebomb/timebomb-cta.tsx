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
      <div className="card-results p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-green-500" />
            <span className="results-section-label" style={{ color: '#22c55e' }}>
              Defuser Active
            </span>
          </div>
          <Link
            href={`/timebomb/${documentId}`}
            className="text-[11px] font-semibold text-[#a3a3a3] flex items-center gap-1 hover:text-[#fafafa] transition-colors"
          >
            View Timeline
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
        className="px-3 py-2.5 bg-[#dc2626]/10 rounded-lg border border-[#dc2626]/20 cursor-pointer hover:bg-[#dc2626]/15 transition-colors flex items-center gap-3"
        onClick={() => setShowModal(true)}
        role="button"
        tabIndex={0}
        aria-label="Activate Time Bomb Defuser"
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") setShowModal(true);
        }}
      >
        <Timer className="w-4 h-4 text-[#dc2626] flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-[12px] font-semibold text-[#dc2626]">
            {deadlineCount} Timebomb{deadlineCount !== 1 ? "s" : ""} Detected
          </p>
          <p className="text-[10px] text-[#a3a3a3] mt-0.5">
            Activate defuser to track deadlines
          </p>
        </div>
        <ArrowRight className="w-3.5 h-3.5 text-[#dc2626] flex-shrink-0" />
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
