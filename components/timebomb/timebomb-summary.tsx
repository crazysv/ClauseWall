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
      <div className="flex items-center gap-4 text-xs font-bold text-slate-500 dark:text-slate-400 flex-wrap">
        <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
          <Timer className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
          {stats.total} deadlines
        </span>
        {stats.critical > 0 && (
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-50 text-rose-700">
            <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
            {stats.critical} critical
          </span>
        )}
        {stats.total_financial_exposure > 0 && (
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 text-amber-700">
            <IndianRupee className="w-3.5 h-3.5 text-amber-500" />
            {formatIndianCurrency(stats.total_financial_exposure)} at risk
          </span>
        )}
        {stats.next_critical && nextCriticalDays !== null && (
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-orange-50 text-orange-700">
            Next: {nextCriticalDays}d
          </span>
        )}
      </div>
    );
  }

  const riskColors = {
    low: "text-blue-700 bg-blue-50 border-blue-200",
    medium: "text-amber-700 bg-amber-50 border-amber-200",
    high: "text-orange-700 bg-orange-50 border-orange-200",
    extreme: "text-rose-700 bg-rose-50 border-rose-200",
  };

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-card p-6 shadow-sm dark:shadow-slate-900/20">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-sm font-black text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2">
          <Target className="w-5 h-5 text-indigo-500" />
          Deadline Summary
        </h3>
        {temporalRisk && (
          <span
            className={`text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full border ${riskColors[temporalRisk]}`}
          >
            {temporalRisk} RISK
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total */}
        <StatBox label="Total" value={stats.total} color="text-slate-800" />

        {/* Critical */}
        <StatBox
          label="Critical"
          value={stats.critical}
          color="text-rose-600"
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
              ? "text-rose-600"
              : "text-amber-600"
          }
        />

        {/* Defused Progress */}
        <div className="rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100 p-4 shadow-inner flex flex-col justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 block mb-1">
              Defused
            </span>
            <div className="flex items-center gap-2 mt-1">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              <span className="text-xl font-black text-emerald-600">
                {stats.defused}
                <span className="text-sm text-slate-400 font-bold ml-1">
                  /{stats.total}
                </span>
              </span>
            </div>
          </div>
          {/* Progress bar */}
          <div className="mt-4 h-1.5 bg-slate-200 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{
                width:
                  stats.total > 0
                    ? `${(stats.defused / stats.total) * 100}%`
                    : "0%",
              }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="h-full bg-emerald-500 rounded-full"
            />
          </div>
        </div>
      </div>

      {/* Next critical deadline */}
      {stats.next_critical && nextCriticalDays !== null && (
        <div className="mt-5 rounded-xl bg-gradient-to-r from-rose-50 to-orange-50 border border-rose-200/50 p-4 shadow-sm dark:shadow-slate-900/20 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-rose-600/80 block mb-1">
              Next Critical Deadline
            </span>
            <span className="text-sm font-black text-slate-800 dark:text-slate-200 line-clamp-1 mr-4">
              {stats.next_critical.title}
            </span>
          </div>
          <div
            className={`flex-shrink-0 px-3 py-1.5 rounded-lg border ${
              nextCriticalDays <= 7
                ? "bg-rose-100 border-rose-200 text-rose-700"
                : nextCriticalDays <= 30
                  ? "bg-orange-100 border-orange-200 text-orange-700"
                  : "bg-amber-100 border-amber-200 text-amber-700"
            }`}
          >
            <span className="text-sm font-black">
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
      className="rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100 p-4 shadow-inner flex flex-col justify-between"
      animate={pulse ? { scale: [1, 1.02, 1], boxShadow: ["inset 0 2px 4px 0 rgb(0 0 0 / 0.05)", "inset 0 0px 0px 0 rgb(0 0 0 / 0)", "inset 0 2px 4px 0 rgb(0 0 0 / 0.05)"] } : {}}
      transition={pulse ? { repeat: Infinity, duration: 2 } : {}}
    >
      <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 block mb-1">
        {label}
      </span>
      <span className={`text-xl font-black ${color} truncate`}>{value}</span>
    </motion.div>
  );
}
