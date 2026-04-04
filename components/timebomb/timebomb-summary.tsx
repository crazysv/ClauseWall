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
    low: "text-blue-900 bg-blue-100 border-4 border-blue-500",
    medium: "text-yellow-900 bg-yellow-100 border-4 border-yellow-500",
    high: "text-orange-900 bg-orange-100 border-4 border-orange-500",
    extreme: "text-red-900 bg-red-100 border-4 border-red-500",
  };

  return (
    <div className="border-4 border-black bg-white dark:bg-zinc-900 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-6">
      <div className="flex items-center justify-between mb-6 pb-4 border-b-4 border-black">
        <h3 className="text-sm font-black uppercase tracking-widest text-foreground flex items-center gap-2">
          <Target className="w-6 h-6 text-orange-500 stroke-[3px]" />
          DEADLINE SUMMARY
        </h3>
        {temporalRisk && (
          <span
            className={`text-xs px-3 py-1 font-black uppercase tracking-widest shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] ${riskColors[temporalRisk]}`}
          >
            {temporalRisk.toUpperCase()} RISK
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {/* Total */}
        <StatBox label="TOTAL" value={stats.total} color="text-foreground" />

        {/* Critical */}
        <StatBox
          label="CRITICAL"
          value={stats.critical}
          color="text-red-600 dark:text-red-500"
          pulse={stats.critical > 0}
        />

        {/* Financial Exposure */}
        <StatBox
          label="AT RISK"
          value={
            stats.total_financial_exposure > 0
              ? formatIndianCurrency(stats.total_financial_exposure)
              : "—"
          }
          color={
            stats.total_financial_exposure > 100000
              ? "text-red-600 dark:text-red-500"
              : "text-amber-600 dark:text-amber-500"
          }
        />

        {/* Defused Progress */}
        <div className="border-4 border-black bg-gray-50 dark:bg-black p-4 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
          <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground block mb-2">
            DEFUSED
          </span>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-green-600 dark:text-green-500 stroke-[3px]" />
            <span className="text-2xl font-black text-green-600 dark:text-green-500">
              {stats.defused}
              <span className="text-sm text-muted-foreground ml-1">
                /{stats.total}
              </span>
            </span>
          </div>
          {/* Progress bar */}
          <div className="mt-3 h-3 border-2 border-black bg-white dark:bg-black overflow-hidden flex">
            <motion.div
              initial={{ width: 0 }}
              animate={{
                width:
                  stats.total > 0
                    ? `${(stats.defused / stats.total) * 100}%`
                    : "0%",
              }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="h-full bg-green-500 border-r-2 border-black"
            />
          </div>
        </div>
      </div>

      {/* Next critical deadline */}
      {stats.next_critical && nextCriticalDays !== null && (
        <div className="mt-6 border-4 border-red-500 bg-red-100 dark:bg-red-950 p-4 shadow-[4px_4px_0px_0px_rgba(239,68,68,1)]">
          <span className="text-xs font-bold uppercase tracking-widest text-red-800 dark:text-red-400">
            NEXT CRITICAL
          </span>
          <div className="flex items-center justify-between mt-2">
            <span className="text-sm font-black uppercase tracking-wide text-red-950 dark:text-red-300 truncate flex-1 mr-4">
              {stats.next_critical.title}
            </span>
            <span
              className={`text-lg font-black uppercase tracking-widest px-3 py-1 border-2 ${
                nextCriticalDays <= 7
                  ? "text-red-700 dark:text-red-400 border-red-500 bg-red-200 dark:bg-red-900/50"
                  : nextCriticalDays <= 30
                    ? "text-orange-700 dark:text-orange-400 border-orange-500 bg-orange-200 dark:bg-orange-900/50"
                    : "text-amber-700 dark:text-amber-400 border-amber-500 bg-amber-200 dark:bg-amber-900/50"
              }`}
            >
              {nextCriticalDays <= 0
                ? "OVERDUE"
                : `${nextCriticalDays} DAY${nextCriticalDays !== 1 ? "S" : ""}`}
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
      className="border-4 border-black bg-gray-50 dark:bg-black p-4 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex flex-col justify-between h-full"
      animate={pulse ? { scale: [1, 1.02, 1] } : {}}
      transition={pulse ? { repeat: Infinity, duration: 2 } : {}}
    >
      <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground block mb-2">
        {label}
      </span>
      <span className={`text-2xl font-black ${color}`}>{value}</span>
    </motion.div>
  );
}
