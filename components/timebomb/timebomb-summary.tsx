"use client";

// ============================================
// TIMEBOMB SUMMARY
// Stats card showing deadline overview
// ============================================

import { motion } from "framer-motion";
import {
  AlertTriangle,
  ShieldCheck,
  IndianRupee,
  Timer,
  Target,
} from "lucide-react";
import type { DeadlineStats, ContractDeadline } from "@/types";
import {
  calculateDaysUntil,
  formatIndianCurrency,
} from "@/lib/timebomb/date-calculator";

interface TimebombSummaryProps {
  stats: DeadlineStats;
  temporalRisk?: "low" | "medium" | "high" | "extreme";
  compact?: boolean;
}

export function TimebombSummary({
  stats,
  temporalRisk,
  compact = false,
}: TimebombSummaryProps) {
  const nextCriticalDays = stats.next_critical
    ? calculateDaysUntil(stats.next_critical.deadline_date)
    : null;

  if (compact) {
    return (
      <div className="flex items-center gap-3 text-xs text-white/50 flex-wrap">
        <span className="flex items-center gap-1">
          <Timer className="w-3 h-3" />
          {stats.total} deadlines
        </span>
        {stats.critical > 0 && (
          <span className="flex items-center gap-1 text-red-400">
            <AlertTriangle className="w-3 h-3" />
            {stats.critical} critical
          </span>
        )}
        {stats.total_financial_exposure > 0 && (
          <span className="flex items-center gap-1 text-yellow-400">
            <IndianRupee className="w-3 h-3" />
            {formatIndianCurrency(stats.total_financial_exposure)} at risk
          </span>
        )}
        {stats.next_critical && nextCriticalDays !== null && (
          <span className="flex items-center gap-1 text-orange-400">
            Next: {nextCriticalDays}d
          </span>
        )}
      </div>
    );
  }

  const riskColors = {
    low: "text-blue-400 bg-blue-500/10 border-blue-500/20",
    medium: "text-yellow-400 bg-yellow-500/10 border-yellow-500/20",
    high: "text-orange-400 bg-orange-500/10 border-orange-500/20",
    extreme: "text-red-400 bg-red-500/10 border-red-500/20",
  };

  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.02] p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-white flex items-center gap-2">
          <Target className="w-4 h-4 text-orange-400" />
          Deadline Summary
        </h3>
        {temporalRisk && (
          <span
            className={`text-xs px-2.5 py-1 rounded-full border font-medium ${riskColors[temporalRisk]}`}
          >
            {temporalRisk.toUpperCase()} RISK
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Total */}
        <StatBox label="Total" value={stats.total} color="text-white/70" />

        {/* Critical */}
        <StatBox
          label="Critical"
          value={stats.critical}
          color="text-red-400"
          pulse={stats.critical > 0}
        />

        {/* Financial Exposure */}
        <StatBox
          label="At Risk"
          value={
            stats.total_financial_exposure > 0
              ? formatIndianCurrency(stats.total_financial_exposure)
              : "—"
          }
          color={
            stats.total_financial_exposure > 100000
              ? "text-red-400"
              : "text-yellow-400"
          }
        />

        {/* Defused Progress */}
        <div className="rounded-lg bg-white/[0.03] p-3">
          <span className="text-[10px] uppercase tracking-wider text-white/30 block mb-1">
            Defused
          </span>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-green-400" />
            <span className="text-lg font-bold text-green-400">
              {stats.defused}
              <span className="text-xs text-white/30 font-normal">
                /{stats.total}
              </span>
            </span>
          </div>
          {/* Progress bar */}
          <div className="mt-2 h-1 bg-white/5 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{
                width:
                  stats.total > 0
                    ? `${(stats.defused / stats.total) * 100}%`
                    : "0%",
              }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="h-full bg-green-500 rounded-full"
            />
          </div>
        </div>
      </div>

      {/* Next critical deadline */}
      {stats.next_critical && nextCriticalDays !== null && (
        <div className="mt-4 rounded-lg bg-gradient-to-r from-red-500/5 to-orange-500/5 border border-red-500/10 p-3">
          <span className="text-[10px] uppercase tracking-wider text-white/30">
            Next Critical
          </span>
          <div className="flex items-center justify-between mt-1">
            <span className="text-sm text-white/70 truncate flex-1 mr-2">
              {stats.next_critical.title}
            </span>
            <span
              className={`text-sm font-bold ${
                nextCriticalDays <= 7
                  ? "text-red-400"
                  : nextCriticalDays <= 30
                    ? "text-orange-400"
                    : "text-yellow-400"
              }`}
            >
              {nextCriticalDays <= 0
                ? "OVERDUE"
                : `${nextCriticalDays} day${nextCriticalDays !== 1 ? "s" : ""}`}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

function StatBox({
  label,
  value,
  color,
  pulse = false,
}: {
  label: string;
  value: string | number;
  color: string;
  pulse?: boolean;
}) {
  return (
    <motion.div
      className="rounded-lg bg-white/[0.03] p-3"
      animate={pulse ? { opacity: [1, 0.7, 1] } : {}}
      transition={pulse ? { repeat: Infinity, duration: 2 } : {}}
    >
      <span className="text-[10px] uppercase tracking-wider text-white/30 block mb-1">
        {label}
      </span>
      <span className={`text-lg font-bold ${color}`}>{value}</span>
    </motion.div>
  );
}
