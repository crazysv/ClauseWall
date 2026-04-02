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
      className={`relative rounded-xl border overflow-hidden transition-all shadow-sm dark:shadow-slate-900/20 ${ isDefused ? "border-emerald-200 bg-emerald-50 opacity-90" : isMissed ? "border-slate-300 bg-slate-50 opacity-80" : "border-slate-200 dark:border-slate-700 bg-white dark:bg-card hover:border-slate-300 hover:shadow-md" }`}
    >
      {/* Left urgency bar */}
      <div
        className="absolute left-0 top-0 bottom-0 w-1.5 rounded-l-xl"
        style={{
          backgroundColor: isDefused
            ? "#10b981"
            : isMissed
              ? "#94a3b8"
              : urgencyColor,
        }}
      />

      {/* Collapsed header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full pl-5 pr-4 py-3 flex items-center gap-3 text-left"
        aria-label={`${expanded ? "Collapse" : "Expand"} ${deadline.title}`}
      >
        <UrgencyIcon
          className="w-4 h-4 flex-shrink-0"
          style={{ color: isDefused ? "#10b981" : urgencyColor }}
        />

        <div className="flex-1 min-w-0 ml-1">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span
              className={`text-sm font-black tracking-tight truncate ${isDefused ? "line-through text-slate-400" : "text-slate-900 dark:text-slate-100"}`}
            >
              {deadline.title}
            </span>
            {isDefused && (
              <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-md border border-emerald-200 bg-emerald-100 text-emerald-700 shadow-sm dark:shadow-slate-900/20">
                Defused ✓
              </span>
            )}
            {isMissed && (
              <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-md border border-red-200 bg-red-100 text-red-700 shadow-sm dark:shadow-slate-900/20">
                Missed
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 mt-0.5">
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-2 py-0.5 rounded text-center shadow-sm dark:shadow-slate-900/20">
              {formatDate(deadline.deadline_date)}
            </span>
            <span
              className={`text-[10px] font-black uppercase tracking-widest ${
                daysUntil <= 3
                  ? "text-red-600"
                  : daysUntil <= 7
                    ? "text-orange-600"
                    : daysUntil <= 30
                      ? "text-amber-600"
                      : "text-indigo-600"
              }`}
            >
              {getDaysLabel()} {daysUntil <= 3 && daysUntil >= 0 ? "⚡" : ""}
            </span>
          </div>
        </div>

        {deadline.financial_impact && deadline.financial_impact > 0 && !isDefused && (
          <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 flex-shrink-0 shadow-sm dark:shadow-slate-900/20">
            <IndianRupee className="w-3 h-3" />
            {formatIndianCurrency(deadline.financial_impact)}
          </span>
        )}

        <ChevronDown
          className={`w-5 h-5 text-slate-400 transition-transform flex-shrink-0 ml-1 ${
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
            <div className="px-5 pb-5 space-y-4 border-t border-slate-100 pt-4 bg-slate-50 dark:bg-slate-800/50">
              {/* Description */}
              <p className="text-sm text-slate-600 dark:text-slate-400 font-medium leading-relaxed">{deadline.description}</p>

              {/* Consequence warning */}
              {deadline.consequence_if_missed && (
                <div className="rounded-xl bg-red-50 border border-red-200 p-4 shadow-sm dark:shadow-slate-900/20">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-widest text-red-700">
                        If missed:
                      </span>
                      <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 mt-1 leading-relaxed">
                        {deadline.consequence_if_missed}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Action required */}
              {deadline.action_required && (
                <div className="rounded-xl bg-indigo-50 border border-indigo-200 p-4 shadow-sm dark:shadow-slate-900/20">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-indigo-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-700">
                        Action required:
                      </span>
                      <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 mt-1 leading-relaxed">
                        {deadline.action_required}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Financial details */}
              {deadline.financial_description && (
                <div className="rounded-xl bg-amber-50 border border-amber-200 p-4 shadow-sm dark:shadow-slate-900/20">
                  <div className="flex items-start gap-3">
                    <IndianRupee className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" />
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 leading-relaxed">
                      {deadline.financial_description}
                    </p>
                  </div>
                </div>
              )}

              {/* Action buttons */}
              {!isDefused && !isMissed && (
                <div className="flex flex-wrap gap-3 pt-3">
                  <button
                    onClick={handleDownloadLetter}
                    disabled={letterLoading}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest bg-white dark:bg-card border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:text-indigo-600 hover:border-indigo-200 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 shadow-sm dark:shadow-slate-900/20 transition-all disabled:opacity-50"
                    aria-label="Download action letter"
                  >
                    {letterLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <FileText className="w-4 h-4" />
                    )}
                    Action Letter
                  </button>

                  <button
                    onClick={handleDefuse}
                    disabled={defuseLoading}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest bg-emerald-50 border border-emerald-200 text-emerald-700 hover:bg-emerald-100 shadow-sm dark:shadow-slate-900/20 transition-all disabled:opacity-50"
                    aria-label="Mark deadline as defused"
                  >
                    {defuseLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <ShieldCheck className="w-4 h-4" />
                    )}
                    Mark Defused
                  </button>

                  <button
                    onClick={handleAddToCalendar}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest bg-white dark:bg-card border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:text-indigo-600 hover:border-indigo-200 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 shadow-sm dark:shadow-slate-900/20 transition-all"
                    aria-label="Add to calendar"
                  >
                    <CalendarCheck className="w-4 h-4" />
                    Calendar
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
          <ShieldCheck className="w-6 h-6 text-emerald-500 drop-shadow-sm dark:shadow-slate-900/20" />
        </motion.div>
      )}
    </motion.div>
  );
}
