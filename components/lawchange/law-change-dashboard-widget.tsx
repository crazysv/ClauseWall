"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Scale,
  AlertCircle,
  Bell,
  TrendingUp,
  ChevronRight,
  Loader2,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { LawChangeSummary } from "@/types";

export function LawChangeDashboardWidget() {
  const [summary, setSummary] = useState<LawChangeSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const res = await fetch("/api/lawchange/summary");
        if (res.ok) {
          const data = await res.json();
          setSummary(data);
        }
      } catch {
        // Silently fail
      } finally {
        setLoading(false);
      }
    };
    fetchSummary();
  }, []);

  if (loading) return null;
  if (!summary) return null;

  const hasChanges =
    summary.changes_this_week > 0 || summary.total_changes_monitored > 0;
  const hasImpacts = summary.affected_contracts > 0;

  // Don't show if nothing is monitored yet
  if (!hasChanges && !hasImpacts) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.36 }}
    >
      <Card
        className={`relative overflow-hidden border ${ hasImpacts ? "bg-gradient-to-br from-red-50 via-rose-50 to-indigo-50 border-red-200 shadow-sm dark:shadow-slate-900/20" : "bg-gradient-to-br from-indigo-50 via-blue-50 to-purple-50 border-indigo-200 shadow-sm dark:shadow-slate-900/20" }`}
      >
        {/* Background glow shadow */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-slate-50 dark:bg-slate-800/50 rounded-full blur-3xl" />
        </div>

        <CardContent className="relative p-5 sm:p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div
                className={`h-16 w-16 rounded-2xl flex items-center justify-center shrink-0 shadow-md ${
                  hasImpacts
                    ? "bg-gradient-to-br from-red-500 to-indigo-600 shadow-red-500/20"
                    : "bg-gradient-to-br from-indigo-500 to-blue-600 shadow-indigo-500/20"
                }`}
              >
                <Scale className="h-8 w-8 text-white drop-shadow-sm dark:shadow-slate-900/20" />
              </div>
              <div>
                <div className="flex items-center gap-3 mb-1.5">
                  <h3 className="text-xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
                    Law Monitor
                  </h3>
                  {summary.unacknowledged_impacts > 0 && (
                    <Badge className="bg-red-50 text-red-700 border-red-200 shadow-sm dark:shadow-slate-900/20 font-bold uppercase tracking-widest text-[10px] px-2 py-0.5 rounded-full animate-pulse">
                      {summary.unacknowledged_impacts} NEW
                    </Badge>
                  )}
                </div>
                <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">
                  {hasImpacts
                    ? `${summary.affected_contracts} contract${
                        summary.affected_contracts !== 1 ? "s" : ""
                      } affected`
                    : summary.changes_this_week > 0
                      ? `${summary.changes_this_week} change${
                          summary.changes_this_week !== 1 ? "s" : ""
                        } this week`
                      : `${summary.total_changes_monitored} changes monitored`}
                </p>
              </div>
            </div>
            <Link href="/lawchange">
              <button className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white text-sm font-medium shadow-lg shadow-indigo-500/20 transition-all w-full sm:w-auto justify-center">
                <Scale className="h-4 w-4" />
                View Details
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
