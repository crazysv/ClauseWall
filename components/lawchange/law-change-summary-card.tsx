"use client";

import { motion } from "framer-motion";
import { Scale, AlertCircle, Bell, TrendingUp } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { LawChangeSummary } from "@/types";

interface Props {
  summary: LawChangeSummary;
}

export function LawChangeSummaryCard({ summary }: Props) {
  const hasImpacts = summary.affected_contracts > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <Card
        className={`relative overflow-hidden border ${ hasImpacts ? "bg-gradient-to-br from-red-50 via-rose-50 to-indigo-50 border-red-200 shadow-sm dark:shadow-slate-900/20" : "bg-gradient-to-br from-indigo-50 via-blue-50 to-purple-50 border-indigo-200 shadow-sm dark:shadow-slate-900/20" }`}
      >
        {/* Background glow shadow */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-slate-50 dark:bg-slate-800/50 rounded-full blur-3xl" />
        </div>

        <CardContent className="relative p-5 sm:p-6">
          {/* Alert Banner */}
          {hasImpacts && (
            <div className="flex items-center gap-3 mb-6 px-4 py-3 rounded-lg bg-red-100/50 border border-red-200 shadow-sm dark:shadow-slate-900/20">
              <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0" />
              <span className="text-sm font-bold text-red-800 tracking-tight">
                ⚖️ {summary.affected_contracts} of your contracts{" "}
                {summary.affected_contracts === 1 ? "has" : "have"} been
                affected by recent law changes
              </span>
            </div>
          )}

          {/* Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <StatItem
              icon={<TrendingUp className="h-4 w-4 text-indigo-500" />}
              label="Changes This Week"
              value={summary.changes_this_week}
              color="text-indigo-700"
            />
            <StatItem
              icon={
                <AlertCircle
                  className={`h-4 w-4 ${
                    hasImpacts ? "text-red-500" : "text-emerald-500"
                  }`}
                />
              }
              label="Contracts Affected"
              value={summary.affected_contracts}
              color={hasImpacts ? "text-red-700" : "text-emerald-700"}
            />
            <StatItem
              icon={
                <Bell
                  className={`h-4 w-4 ${
                    summary.unacknowledged_impacts > 0
                      ? "text-amber-500"
                      : "text-slate-300"
                  }`}
                />
              }
              label="Unacknowledged"
              value={summary.unacknowledged_impacts}
              color={
                summary.unacknowledged_impacts > 0
                  ? "text-amber-700"
                  : "text-slate-400"
              }
            />
            <StatItem
              icon={<Scale className="h-4 w-4 text-blue-500" />}
              label="Total Monitored"
              value={summary.total_changes_monitored}
              color="text-blue-700"
            />
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function StatItem({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div className="text-center bg-white dark:bg-card/40 p-3 rounded-xl border border-white/60 shadow-sm dark:shadow-slate-900/20 backdrop-blur-sm">
      <div className="flex items-center justify-center mb-2">{icon}</div>
      <p className={`text-lg md:text-xl lg:text-2xl font-black ${color}`}>{value}</p>
      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mt-1">{label}</p>
    </div>
  );
}
