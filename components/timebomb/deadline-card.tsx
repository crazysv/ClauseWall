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
      className={`relative rounded-xl border overflow-hidden transition-all ${
        isDefused
          ? "border-green-500/20 bg-green-500/5 opacity-70"
          : isMissed
            ? "border-gray-500/20 bg-gray-500/5 opacity-60"
            : "border-white/10 bg-white/[0.02] hover:bg-white/[0.04]"
      }`}
    >
      {/* Left urgency bar */}
      <div
        className="absolute left-0 top-0 bottom-0 w-1"
        style={{
          backgroundColor: isDefused
            ? "#10b981"
            : isMissed
              ? "#6b7280"
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

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className={`text-sm font-medium truncate ${isDefused ? "line-through text-white/40" : "text-white"}`}
            >
              {deadline.title}
            </span>
            {isDefused && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/20 text-green-400">
                Defused ✓
              </span>
            )}
            {isMissed && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-red-500/20 text-red-400">
                Missed
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 mt-0.5">
            <span className="text-xs text-white/40">
              {formatDate(deadline.deadline_date)}
            </span>
            <span
              className={`text-xs font-medium ${
                daysUntil <= 3
                  ? "text-red-400"
                  : daysUntil <= 7
                    ? "text-orange-400"
                    : daysUntil <= 30
                      ? "text-yellow-400"
                      : "text-blue-400"
              }`}
            >
              {getDaysLabel()} {daysUntil <= 3 && daysUntil >= 0 ? "⚡" : ""}
            </span>
          </div>
        </div>

        {deadline.financial_impact && deadline.financial_impact > 0 && !isDefused && (
          <span className="flex items-center gap-1 text-xs px-2 py-1 rounded-lg bg-red-500/10 text-red-400 flex-shrink-0">
            <IndianRupee className="w-3 h-3" />
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
            <div className="px-5 pb-4 space-y-3 border-t border-white/5 pt-3">
              {/* Description */}
              <p className="text-sm text-white/60">{deadline.description}</p>

              {/* Consequence warning */}
              {deadline.consequence_if_missed && (
                <div className="rounded-lg bg-red-500/5 border border-red-500/10 p-3">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <span className="text-xs font-medium text-red-400">
                        If missed:
                      </span>
                      <p className="text-sm text-white/50 mt-0.5">
                        {deadline.consequence_if_missed}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Action required */}
              {deadline.action_required && (
                <div className="rounded-lg bg-blue-500/5 border border-blue-500/10 p-3">
                  <div className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <span className="text-xs font-medium text-blue-400">
                        Action required:
                      </span>
                      <p className="text-sm text-white/50 mt-0.5">
                        {deadline.action_required}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Financial details */}
              {deadline.financial_description && (
                <div className="rounded-lg bg-yellow-500/5 border border-yellow-500/10 p-3">
                  <div className="flex items-start gap-2">
                    <IndianRupee className="w-4 h-4 text-yellow-400 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-white/50">
                      {deadline.financial_description}
                    </p>
                  </div>
                </div>
              )}

              {/* Action buttons */}
              {!isDefused && !isMissed && (
                <div className="flex flex-wrap gap-2 pt-2">
                  <button
                    onClick={handleDownloadLetter}
                    disabled={letterLoading}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-white/5 border border-white/10 text-white/60 hover:text-white hover:bg-white/10 transition-all disabled:opacity-50"
                    aria-label="Download action letter"
                  >
                    {letterLoading ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <FileText className="w-3 h-3" />
                    )}
                    Action Letter
                  </button>

                  <button
                    onClick={handleDefuse}
                    disabled={defuseLoading}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-green-500/10 border border-green-500/20 text-green-400 hover:bg-green-500/20 transition-all disabled:opacity-50"
                    aria-label="Mark deadline as defused"
                  >
                    {defuseLoading ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <ShieldCheck className="w-3 h-3" />
                    )}
                    Mark Defused
                  </button>

                  <button
                    onClick={handleAddToCalendar}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-white/5 border border-white/10 text-white/60 hover:text-white hover:bg-white/10 transition-all"
                    aria-label="Add to calendar"
                  >
                    <CalendarCheck className="w-3 h-3" />
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
          <ShieldCheck className="w-5 h-5 text-green-400" />
        </motion.div>
      )}
    </motion.div>
  );
}
