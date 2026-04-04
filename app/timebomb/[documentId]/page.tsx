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
        d.id === deadlineId ? { ...d, status: "defused" as const } : d
      )
    );
    // Recalculate stats
    setTimeout(fetchDeadlines, 500);
  };

  const activeDeadlines = deadlines.filter(
    (d) =>
      d.status !== "defused" &&
      d.status !== "action_taken" &&
      d.status !== "expired"
  );

  const nextCritical = stats?.next_critical || null;

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center gap-4"
        >
          <Loader2 className="w-10 h-10 text-orange-500 animate-spin" />
          <p className="text-muted-foreground font-black uppercase tracking-widest">LOADING DEFUSER...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Top bar */}
      <div className="sticky top-0 z-30 bg-background border-b-4 border-foreground shadow-[0px_4px_0px_0px_rgba(0,0,0,1)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href={`/results/${documentId}`}
              className="p-3 border-4 border-black bg-white dark:bg-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 hover:shadow-none transition-all"
              aria-label="Back to results"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-xl font-black uppercase tracking-widest flex items-center gap-2">
                <Clock className="w-6 h-6 text-orange-500 stroke-[3px]" />
                TIME BOMB DEFUSER
              </h1>
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mt-1">
                {deadlines.length} DEADLINE{deadlines.length !== 1 ? "S" : ""} TRACKED
              </p>
            </div>
          </div>

          {activeDeadlines.length > 0 && (
            <Link
              href={`/api/timebomb/calendar/${documentId}`}
              target="_blank"
              className="flex items-center gap-2 px-4 py-2 border-4 border-black bg-blue-100 hover:bg-blue-200 dark:bg-blue-900/30 font-black uppercase tracking-widest text-sm shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 hover:shadow-none transition-all"
            >
              <Download className="w-4 h-4 stroke-[3px]" />
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
              data.temporal_risk as "low" | "medium" | "high" | "extreme"
            );
          }
        }}
      />
    </div>
  );
}
