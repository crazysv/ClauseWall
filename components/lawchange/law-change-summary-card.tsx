"use client";

import { motion } from "framer-motion";
import { Scale, AlertCircle, Bell, TrendingUp } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { LawChangeSummary } from "@/types";

interface Props {
  summary: LawChangeSummary;
}

export default function LawChangeSummaryCard({ summary }: Props) {
  const hasImpacts = summary.affected_contracts > 0;

  return (
    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
      <Card
        className={`relative overflow-hidden border-0 ${hasImpacts ? "bg-background " : "bg-background "}`}
      >
        {/* Background glow */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-background to-transparent rounded-full blur-3xl" />
          <div className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-background to-transparent rounded-full blur-3xl" />
        </div>

        <CardContent className="relative p-5 sm:p-6">
          {/* Alert Banner */}
          {hasImpacts && (
            <div className="flex items-center gap-2 mb-4 px-3 py-2 rounded-none bg-red-500/10 border border-red-500/20">
              <AlertCircle className="h-4 w-4 text-red-400 flex-shrink-0" />
              <span className="text-sm text-red-300">
                ⚖️ {summary.affected_contracts} of your contracts{" "}
                {summary.affected_contracts === 1 ? "has" : "have"} been
                affected by recent law changes
              </span>
            </div>
          )}

          {/* Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <StatItem
              icon={<TrendingUp className="h-4 w-4 text-indigo-400" />}
              label="Changes This Week"
              value={summary.changes_this_week}
              color="text-indigo-300"
            />
            <StatItem
              icon={
                <AlertCircle
                  className={`h-4 w-4 ${hasImpacts ? "text-red-400" : "text-green-400"}`}
                />
              }
              label="Contracts Affected"
              value={summary.affected_contracts}
              color={hasImpacts ? "text-red-300" : "text-green-300"}
            />
            <StatItem
              icon={
                <Bell
                  className={`h-4 w-4 ${summary.unacknowledged_impacts > 0 ? "text-orange-400" : "text-foreground"}`}
                />
              }
              label="Unacknowledged"
              value={summary.unacknowledged_impacts}
              color={
                summary.unacknowledged_impacts > 0
                  ? "text-orange-300"
                  : "text-white/40"
              }
            />
            <StatItem
              icon={<Scale className="h-4 w-4 text-blue-400" />}
              label="Total Monitored"
              value={summary.total_changes_monitored}
              color="text-blue-300"
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
    <div className="text-center">
      <div className="flex items-center justify-center mb-1.5">{icon}</div>
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
      <p className="text-[10px] text-foreground mt-0.5">{label}</p>
    </div>
  );
}
