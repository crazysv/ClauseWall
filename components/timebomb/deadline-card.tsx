"use client";

// ============================================
// DEADLINE CARD
// Expandable card for individual deadline
// ============================================

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertTriangle,
  Clock,
  Info,
  CheckCircle,
  ChevronDown,
  Download,
  CalendarCheck,
  ShieldCheck,
  Loader2,
  FileText,
  IndianRupee,
} from "lucide-react";
import { toast } from "sonner";
import type { ContractDeadline } from "@/types";
import {
  calculateDaysUntil,
  getUrgencyColor,
  formatIndianCurrency,
} from "@/lib/timebomb/date-calculator";

interface DeadlineCardProps {
  deadline: ContractDeadline;
  onDefuse: (id: string) => void;
  documentId: string;
}

export function DeadlineCard({
  deadline,
  onDefuse,
  documentId,
}: DeadlineCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [letterLoading, setLetterLoading] = useState(false);
  const [defuseLoading, setDefuseLoading] = useState(false);

  const daysUntil = calculateDaysUntil(deadline.deadline_date);
  const isDefused =
    deadline.status === "defused" || deadline.status === "action_taken";
  const isMissed = deadline.status === "missed";
  const urgencyColor = getUrgencyColor(deadline.urgency);

  const UrgencyIcon =
    deadline.urgency === "critical"
      ? AlertTriangle
      : deadline.urgency === "high"
        ? Clock
        : deadline.urgency === "medium"
          ? Info
          : CheckCircle;

  const handleDownloadLetter = async () => {
    try {
      setLetterLoading(true);
      const res = await fetch(
        `/api/timebomb/action-letter/${deadline.id}`
      );
      if (!res.ok) throw new Error("Failed to generate letter");
      const data = await res.json();

      // Create downloadable text file
      const blob = new Blob([data.letter], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `action-letter-${deadline.title.slice(0, 30).replace(/\s+/g, "-").toLowerCase()}.txt`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Action letter downloaded!");
    } catch (error) {
      console.error("[TimeBomb] Letter download error:", error);
      toast.error("Failed to generate action letter");
    } finally {
      setLetterLoading(false);
    }
  };

  const handleDefuse = async () => {
    try {
      setDefuseLoading(true);
      const res = await fetch("/api/timebomb/defuse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          deadline_id: deadline.id,
          action: "defused",
        }),
      });
      if (!res.ok) throw new Error("Failed to defuse");
      onDefuse(deadline.id);
      toast.success("Deadline defused! 🛡️");
    } catch (error) {
      console.error("[TimeBomb] Defuse error:", error);
      toast.error("Failed to defuse deadline");
    } finally {
      setDefuseLoading(false);
    }
  };

  const handleAddToCalendar = () => {
    window.open(`/api/timebomb/calendar/${documentId}`, "_blank");
  };

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });

  const getDaysLabel = () => {
    if (daysUntil < 0) return `${Math.abs(daysUntil)}d overdue`;
    if (daysUntil === 0) return "TODAY";
    if (daysUntil === 1) return "Tomorrow";
    return `${daysUntil} days`;
  };

  return (
    <motion.div
      layout
      className={`relative border-4 border-black transition-all ${
        isDefused
          ? "bg-green-100 border-green-500 opacity-80 shadow-none hover:shadow-[4px_4px_0px_0px_rgba(34,197,94,1)]"
          : isMissed
            ? "bg-gray-100 border-gray-500 opacity-60"
            : "bg-white dark:bg-zinc-900 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 hover:shadow-none"
      }`}
    >
      {/* Left urgency bar */}
      <div
        className="absolute left-0 top-0 bottom-0 w-3 border-r-4 border-black"
        style={{
          backgroundColor: isDefused
            ? "#22c55e"
            : isMissed
              ? "#6b7280"
              : urgencyColor,
        }}
      />

      {/* Collapsed header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full pl-8 pr-4 py-4 flex items-center gap-4 text-left"
        aria-label={`${expanded ? "Collapse" : "Expand"} ${deadline.title}`}
      >
        <UrgencyIcon
          className="w-6 h-6 flex-shrink-0 stroke-[3px]"
          style={{ color: isDefused ? "#22c55e" : urgencyColor }}
        />

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className={`text-sm font-black uppercase tracking-widest truncate ${isDefused ? "line-through text-muted-foreground" : "text-foreground"}`}
            >
              {deadline.title}
            </span>
            {isDefused && (
              <span className="text-xs font-bold uppercase tracking-widest px-2 py-1 bg-green-200 dark:bg-green-900 border-2 border-green-500 text-green-900 dark:text-green-300">
                DEFUSED ✓
              </span>
            )}
            {isMissed && (
              <span className="text-xs font-bold uppercase tracking-widest px-2 py-1 bg-red-200 dark:bg-red-900 border-2 border-red-500 text-red-900 dark:text-red-300">
                MISSED
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 mt-1">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-widest">
              {formatDate(deadline.deadline_date)}
            </span>
            <span
              className={`text-xs font-black uppercase tracking-widest ${
                daysUntil <= 3
                  ? "text-red-600 dark:text-red-400"
                  : daysUntil <= 7
                    ? "text-orange-600 dark:text-orange-400"
                    : daysUntil <= 30
                      ? "text-amber-600 dark:text-amber-400"
                      : "text-blue-600 dark:text-blue-400"
              }`}
            >
              {getDaysLabel()} {daysUntil <= 3 && daysUntil >= 0 ? "⚡" : ""}
            </span>
          </div>
        </div>

        {deadline.financial_impact && deadline.financial_impact > 0 && !isDefused && (
          <span className="flex items-center gap-1 text-xs font-black uppercase tracking-widest px-2 py-1 border-2 border-red-500 bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-400 flex-shrink-0 shadow-[2px_2px_0px_0px_rgba(239,68,68,1)]">
            <IndianRupee className="w-3 h-3 stroke-[3px]" />
            {formatIndianCurrency(deadline.financial_impact)}
          </span>
        )}

        <ChevronDown
          className={`w-4 h-4 text-white/30 transition-transform flex-shrink-0 ${
            expanded ? "rotate-180" : ""
          }`}
        />
      </button>

      {/* Expanded content */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-4 space-y-4 border-t-4 border-black pt-4 ml-3">
              {/* Description */}
              <p className="text-sm font-medium text-muted-foreground leading-relaxed">{deadline.description}</p>

              {/* Consequence warning */}
              {deadline.consequence_if_missed && (
                <div className="border-4 border-red-500 bg-red-50 dark:bg-red-950 p-4 shadow-[4px_4px_0px_0px_rgba(239,68,68,1)]">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400 flex-shrink-0 stroke-[3px]" />
                    <div>
                      <span className="text-xs font-black uppercase tracking-widest text-red-800 dark:text-red-400">
                        IF MISSED:
                      </span>
                      <p className="text-sm font-bold text-red-900 dark:text-red-300 mt-1">
                        {deadline.consequence_if_missed}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Action required */}
              {deadline.action_required && (
                <div className="border-4 border-blue-500 bg-blue-50 dark:bg-blue-950 p-4 shadow-[4px_4px_0px_0px_rgba(59,130,246,1)]">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-6 h-6 text-blue-600 dark:text-blue-400 flex-shrink-0 stroke-[3px]" />
                    <div>
                      <span className="text-xs font-black uppercase tracking-widest text-blue-800 dark:text-blue-400">
                        ACTION REQUIRED:
                      </span>
                      <p className="text-sm font-bold text-blue-900 dark:text-blue-300 mt-1">
                        {deadline.action_required}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Financial details */}
              {deadline.financial_description && (
                <div className="border-4 border-yellow-500 bg-yellow-50 dark:bg-yellow-900/30 p-4 shadow-[4px_4px_0px_0px_rgba(234,179,8,1)]">
                  <div className="flex items-start gap-3">
                    <IndianRupee className="w-6 h-6 text-yellow-600 dark:text-yellow-400 flex-shrink-0 stroke-[3px]" />
                    <p className="text-sm font-bold text-yellow-900 dark:text-yellow-300 mt-1">
                      {deadline.financial_description}
                    </p>
                  </div>
                </div>
              )}

              {/* Action buttons */}
              {!isDefused && !isMissed && (
                <div className="flex flex-wrap gap-3 pt-4 border-t-4 border-black">
                  <button
                    onClick={handleDownloadLetter}
                    disabled={letterLoading}
                    className="flex items-center gap-2 px-4 py-2 border-4 border-black bg-white dark:bg-black font-black uppercase tracking-widest text-xs text-foreground shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 hover:shadow-none transition-all disabled:opacity-50"
                    aria-label="Download action letter"
                  >
                    {letterLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin stroke-[3px]" />
                    ) : (
                      <FileText className="w-4 h-4 stroke-[3px]" />
                    )}
                    ACTION LETTER
                  </button>

                  <button
                    onClick={handleDefuse}
                    disabled={defuseLoading}
                    className="flex items-center gap-2 px-4 py-2 border-4 border-black bg-green-500 hover:bg-green-600 font-black uppercase tracking-widest text-xs text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 hover:shadow-none transition-all disabled:opacity-50"
                    aria-label="Mark deadline as defused"
                  >
                    {defuseLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin stroke-[3px]" />
                    ) : (
                      <ShieldCheck className="w-4 h-4 stroke-[3px]" />
                    )}
                    MARK DEFUSED
                  </button>

                  <button
                    onClick={handleAddToCalendar}
                    className="flex items-center gap-2 px-4 py-2 border-4 border-black bg-blue-100 dark:bg-blue-900/30 font-black uppercase tracking-widest text-xs text-foreground shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 hover:shadow-none transition-all"
                    aria-label="Add to calendar"
                  >
                    <CalendarCheck className="w-4 h-4 stroke-[3px]" />
                    CALENDAR
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Defused overlay */}
      {isDefused && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute right-3 top-3"
        >
          <ShieldCheck className="w-5 h-5 text-green-400" />
        </motion.div>
      )}
    </motion.div>
  );
}
