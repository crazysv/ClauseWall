"use client";

// ============================================
// TIME BOMB DEFUSER — FULL PAGE
// /timebomb/[documentId]
// ============================================

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, Download, Clock, Loader2 } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import type { ContractDeadline, DeadlineStats, TimelineEvent } from "@/types";
import { DeadlineTimeline } from "@/components/timebomb/deadline-timeline";
import { TimebombSummary } from "@/components/timebomb/timebomb-summary";
import { CalendarExport } from "@/components/timebomb/calendar-export";
import { ReminderSettings } from "@/components/timebomb/reminder-settings";
import { CountdownWidget } from "@/components/timebomb/countdown-widget";
import { SigningDateModal } from "@/components/timebomb/signing-date-modal";

export default function TimebombPage() {
  const params = useParams();
  const router = useRouter();
  const documentId = params?.documentId as string;

  const [deadlines, setDeadlines] = useState<ContractDeadline[]>([]);
  const [stats, setStats] = useState<DeadlineStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [activated, setActivated] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [temporalRisk, setTemporalRisk] = useState<
    "low" | "medium" | "high" | "extreme"
  >("low");

  const fetchDeadlines = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/timebomb/${documentId}`);
      if (!res.ok) {
        if (res.status === 401) {
          router.push("/");
          return;
        }
        throw new Error("Failed to fetch deadlines");
      }
      const data = await res.json();
      setDeadlines(data.deadlines || []);
      setStats(data.stats || null);
      setActivated(data.activated || false);

      // If not activated, show modal automatically
      if (!data.activated) {
        setShowModal(true);
      }
    } catch (error) {
      console.error("[TimeBomb Page] Fetch error:", error);
      toast.error("Failed to load deadlines");
    } finally {
      setLoading(false);
    }
  }, [documentId, router]);

  useEffect(() => {
    if (documentId) {
      fetchDeadlines();
    }
  }, [documentId, fetchDeadlines]);

  const handleDefuse = (deadlineId: string) => {
    setDeadlines((prev) =>
      prev.map((d) =>
        d.id === deadlineId ? { ...d, status: "defused" as const } : d,
      ),
    );
    // Recalculate stats
    setTimeout(fetchDeadlines, 500);
  };

  const activeDeadlines = deadlines.filter(
    (d) =>
      d.status !== "defused" &&
      d.status !== "action_taken" &&
      d.status !== "expired",
  );

  const nextCritical = stats?.next_critical || null;

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center gap-4"
        >
          <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
          <p className="text-[9px] font-mono uppercase tracking-widest text-neutral-600">
            LOADING DEFUSER...
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-neutral-200">
      {/* Top bar */}
      <div className="sticky top-0 z-30 bg-[#0a0a0a] border-b border-neutral-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href={`/results/${documentId}`}
              className="p-2 border border-neutral-800 bg-[#050505] text-neutral-600 hover:text-neutral-300 hover:border-neutral-600 transition-colors"
              aria-label="Back to results"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
            </Link>
            <div className="flex items-center gap-3">
              <div className="p-2 border border-neutral-800 bg-[#050505]">
                <Clock className="w-4 h-4 text-amber-500" />
              </div>
              <div>
                <h1 className="text-xs font-mono uppercase tracking-widest text-neutral-200">
                  TIME_BOMB_DEFUSER
                </h1>
                <p className="text-[8px] font-mono uppercase tracking-widest text-neutral-600 mt-0.5">
                  {deadlines.length} DEADLINE{deadlines.length !== 1 ? "S" : ""}{" "}
                  TRACKED
                </p>
              </div>
            </div>
          </div>

          {activeDeadlines.length > 0 && (
            <Link
              href={`/api/timebomb/calendar/${documentId}`}
              target="_blank"
              className="flex items-center gap-2 px-3 py-1.5 border border-cyan-900/50 bg-cyan-950/10 font-mono uppercase tracking-widest text-[8px] text-cyan-400 hover:text-cyan-300 hover:border-cyan-800 transition-colors"
            >
              <Download className="w-3 h-3" />
              EXPORT CALENDAR
            </Link>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Main content */}
          <div className="lg:col-span-8 space-y-6">
            {/* Summary */}
            {stats && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <TimebombSummary stats={stats} temporalRisk={temporalRisk} />
              </motion.div>
            )}

            {/* Timeline */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <DeadlineTimeline
                deadlines={deadlines}
                onDefuse={handleDefuse}
                documentId={documentId}
              />
            </motion.div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-4 space-y-4">
            {/* Countdown */}
            {nextCritical && (
              <motion.div
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
              >
                <CountdownWidget deadline={nextCritical} />
              </motion.div>
            )}

            {/* Calendar export */}
            <motion.div
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
            >
              <CalendarExport
                documentId={documentId}
                deadlineCount={activeDeadlines.length}
              />
            </motion.div>

            {/* Reminder settings */}
            <motion.div
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <ReminderSettings />
            </motion.div>
          </div>
        </div>
      </div>

      {/* Signing date modal (auto-shows if not activated) */}
      <SigningDateModal
        documentId={documentId}
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          if (!activated) {
            router.back();
          }
        }}
        onActivated={(data) => {
          setActivated(true);
          setDeadlines(data.deadlines as ContractDeadline[]);
          setStats(data.stats as DeadlineStats);
          if (data.temporal_risk) {
            setTemporalRisk(
              data.temporal_risk as "low" | "medium" | "high" | "extreme",
            );
          }
        }}
      />
    </div>
  );
}
