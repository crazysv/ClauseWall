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
    low: "text-cyan-400 bg-cyan-950/20 border border-cyan-900/50",
    medium: "text-amber-400 bg-amber-950/20 border border-amber-900/50",
    high: "text-amber-500 bg-amber-950/20 border border-amber-900/50",
    extreme: "text-red-500 bg-red-950/20 border border-red-900/50",
  };

  return (
    <div className="border border-neutral-900 bg-[#0a0a0a] p-5">
      <div className="flex items-center justify-between mb-5 pb-3 border-b border-neutral-900">
        <h3 className="text-[9px] font-mono uppercase tracking-widest text-neutral-400 flex items-center gap-2">
          <Target className="w-3.5 h-3.5 text-amber-500" />
          DEADLINE_SUMMARY
        </h3>
        {temporalRisk && (
          <span
            className={`text-[8px] px-2 py-0.5 font-mono uppercase tracking-widest ${riskColors[temporalRisk]}`}
          >
            {temporalRisk.toUpperCase()} RISK
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Total */}
        <StatBox label="TOTAL" value={stats.total} color="text-neutral-200" />

        {/* Critical */}
        <StatBox
          label="CRITICAL"
          value={stats.critical}
          color="text-red-500"
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
              ? "text-red-500"
              : "text-amber-400"
          }
        />

        {/* Defused Progress */}
        <div className="border border-neutral-800 bg-[#050505] p-3 flex flex-col justify-between h-full">
          <span className="text-[8px] font-mono uppercase tracking-widest text-neutral-600 block mb-2">
            DEFUSED
          </span>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span className="text-lg font-mono tabular-nums text-emerald-400">
              {stats.defused}
              <span className="text-[9px] text-neutral-600 ml-1">
                /{stats.total}
              </span>
            </span>
          </div>
          {/* Progress bar */}
          <div className="mt-2 h-1 border border-neutral-800 bg-[#050505] overflow-hidden flex">
            <motion.div
              initial={{ width: 0 }}
              animate={{
                width:
                  stats.total > 0
                    ? `${(stats.defused / stats.total) * 100}%`
                    : "0%",
              }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="h-full bg-emerald-500"
            />
          </div>
        </div>
      </div>

      {/* Next critical deadline */}
      {stats.next_critical && nextCriticalDays !== null && (
        <div className="mt-4 border-l-2 border-red-500 bg-red-950/20 p-4">
          <span className="text-[8px] font-mono uppercase tracking-widest text-red-400">
            NEXT_CRITICAL
          </span>
          <div className="flex items-center justify-between mt-2">
            <span className="text-[10px] font-mono uppercase tracking-widest text-neutral-300 truncate flex-1 mr-4">
              {stats.next_critical.title}
            </span>
            <span
              className={`text-sm font-mono tabular-nums uppercase tracking-widest px-2 py-0.5 border ${
                nextCriticalDays <= 7
                  ? "text-red-500 border-red-900/50 bg-red-950/20"
                  : nextCriticalDays <= 30
                    ? "text-amber-400 border-amber-900/50 bg-amber-950/20"
                    : "text-neutral-400 border-neutral-800 bg-[#050505]"
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
      className="border border-neutral-800 bg-[#050505] p-3 flex flex-col justify-between h-full"
      animate={pulse ? { scale: [1, 1.02, 1] } : {}}
      transition={pulse ? { repeat: Infinity, duration: 2 } : {}}
    >
      <span className="text-[8px] font-mono uppercase tracking-widest text-neutral-600 block mb-2">
        {label}
      </span>
      <span className={`text-lg font-mono tabular-nums ${color}`}>{value}</span>
    </motion.div>
  );
}
