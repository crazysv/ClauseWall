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
      const res = await fetch(`/api/timebomb/action-letter/${deadline.id}`);
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
      className={`relative border transition-colors ${
        isDefused
          ? "bg-emerald-950/10 border-emerald-900/50 opacity-80"
          : isMissed
            ? "bg-neutral-950 border-neutral-800 opacity-60"
            : "bg-[#0a0a0a] border-neutral-900 hover:border-neutral-700"
      }`}
    >
      {/* Left urgency bar */}
      <div
        className="absolute left-0 top-0 bottom-0 w-0.5"
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
        className="w-full pl-4 pr-4 py-3 flex items-center gap-3 text-left"
        aria-label={`${expanded ? "Collapse" : "Expand"} ${deadline.title}`}
      >
        <UrgencyIcon
          className="w-3.5 h-3.5 flex-shrink-0"
          style={{ color: isDefused ? "#22c55e" : urgencyColor }}
        />

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className={`text-[9px] font-mono uppercase tracking-widest truncate ${isDefused ? "line-through text-neutral-600" : "text-neutral-200"}`}
            >
              {deadline.title}
            </span>
            {isDefused && (
              <span className="text-[7px] font-mono uppercase tracking-widest px-1.5 py-0.5 bg-emerald-950/20 border border-emerald-900/50 text-emerald-400">
                DEFUSED ✓
              </span>
            )}
            {isMissed && (
              <span className="text-[7px] font-mono uppercase tracking-widest px-1.5 py-0.5 bg-red-950/20 border border-red-900/50 text-red-400">
                MISSED
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 mt-1">
            <span className="text-[8px] font-mono text-neutral-600 uppercase tracking-widest">
              {formatDate(deadline.deadline_date)}
            </span>
            <span
              className={`text-[8px] font-mono uppercase tracking-widest ${
                daysUntil <= 3
                  ? "text-red-500"
                  : daysUntil <= 7
                    ? "text-amber-500"
                    : daysUntil <= 30
                      ? "text-amber-400"
                      : "text-cyan-400"
              }`}
            >
              {getDaysLabel()} {daysUntil <= 3 && daysUntil >= 0 ? "⚡" : ""}
            </span>
          </div>
        </div>

        {deadline.financial_impact &&
          deadline.financial_impact > 0 &&
          !isDefused && (
            <span className="flex items-center gap-1 text-[7px] font-mono uppercase tracking-widest px-1.5 py-0.5 border border-red-900/50 bg-red-950/20 text-red-400 flex-shrink-0">
              <IndianRupee className="w-2.5 h-2.5" />
              {formatIndianCurrency(deadline.financial_impact)}
            </span>
          )}

        <ChevronDown
          className={`w-3 h-3 text-neutral-700 transition-transform flex-shrink-0 ${
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
            <div className="px-4 pb-4 space-y-3 border-t border-neutral-900 pt-3 ml-1">
              {/* Description */}
              <p className="text-[9px] font-mono text-neutral-500 leading-relaxed">
                {deadline.description}
              </p>

              {/* Consequence warning */}
              {deadline.consequence_if_missed && (
                <div className="border-l-2 border-red-500 bg-red-950/20 p-3">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-3.5 h-3.5 text-red-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="text-[8px] font-mono uppercase tracking-widest text-red-400">
                        IF MISSED:
                      </span>
                      <p className="text-[9px] font-mono text-red-300/70 mt-1 leading-relaxed">
                        {deadline.consequence_if_missed}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Action required */}
              {deadline.action_required && (
                <div className="border-l-2 border-cyan-500 bg-cyan-950/20 p-3">
                  <div className="flex items-start gap-2">
                    <CheckCircle className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="text-[8px] font-mono uppercase tracking-widest text-cyan-400">
                        ACTION REQUIRED:
                      </span>
                      <p className="text-[9px] font-mono text-cyan-300/70 mt-1 leading-relaxed">
                        {deadline.action_required}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Financial details */}
              {deadline.financial_description && (
                <div className="border-l-2 border-amber-500 bg-amber-950/20 p-3">
                  <div className="flex items-start gap-2">
                    <IndianRupee className="w-3.5 h-3.5 text-amber-400 flex-shrink-0 mt-0.5" />
                    <p className="text-[9px] font-mono text-amber-300/70 leading-relaxed">
                      {deadline.financial_description}
                    </p>
                  </div>
                </div>
              )}

              {/* Action buttons */}
              {!isDefused && !isMissed && (
                <div className="flex flex-wrap gap-2 pt-3 border-t border-neutral-900">
                  <button
                    onClick={handleDownloadLetter}
                    disabled={letterLoading}
                    className="flex items-center gap-2 px-3 py-1.5 border border-neutral-800 bg-[#050505] font-mono uppercase tracking-widest text-[7px] text-neutral-400 hover:text-neutral-200 hover:border-neutral-600 transition-colors disabled:opacity-40"
                    aria-label="Download action letter"
                  >
                    {letterLoading ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <FileText className="w-3 h-3" />
                    )}
                    ACTION LETTER
                  </button>

                  <button
                    onClick={handleDefuse}
                    disabled={defuseLoading}
                    className="flex items-center gap-2 px-3 py-1.5 border border-emerald-900/50 bg-emerald-950/10 font-mono uppercase tracking-widest text-[7px] text-emerald-400 hover:text-emerald-300 hover:border-emerald-800 transition-colors disabled:opacity-40"
                    aria-label="Mark deadline as defused"
                  >
                    {defuseLoading ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <ShieldCheck className="w-3 h-3" />
                    )}
                    MARK DEFUSED
                  </button>

                  <button
                    onClick={handleAddToCalendar}
                    className="flex items-center gap-2 px-3 py-1.5 border border-cyan-900/50 bg-cyan-950/10 font-mono uppercase tracking-widest text-[7px] text-cyan-400 hover:text-cyan-300 hover:border-cyan-800 transition-colors"
                    aria-label="Add to calendar"
                  >
                    <CalendarCheck className="w-3 h-3" />
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
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
        </motion.div>
      )}
    </motion.div>
  );
}
