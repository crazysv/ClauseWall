"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Scale,
} from "lucide-react";
import type { LawChangeSummary } from "@/types";

export default function LawChangeDashboardWidget() {
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
      <div
        className={`relative overflow-hidden border p-5 sm:p-6 bg-[#0a0a0a] ${
          hasImpacts ? "border-red-900/40" : "border-indigo-900/40"
        }`}
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative z-10">
          <div className="flex items-center gap-4">
            <div
              className={`h-10 w-10 flex items-center justify-center border ${
                hasImpacts 
                ? "bg-red-950/20 border-red-900/50 text-red-500" 
                : "bg-indigo-950/20 border-indigo-900/50 text-indigo-500"
              }`}
            >
              <Scale className="h-4 w-4" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h3 className={`text-[10px] font-mono tracking-widest uppercase ${hasImpacts ? 'text-red-500' : 'text-indigo-400'}`}>
                  [ STATUTORY_MONITOR ]
                </h3>
                {summary.unacknowledged_impacts > 0 && (
                  <span className="bg-red-500/10 text-red-500 border border-red-500/50 text-[8px] font-mono tracking-widest px-1.5 py-0.5 animate-pulse">
                    {summary.unacknowledged_impacts} NEW
                  </span>
                )}
              </div>
              <p className="text-xs font-mono uppercase tracking-widest text-neutral-400">
                {hasImpacts
                  ? `${summary.affected_contracts} PAYLOAD${
                      summary.affected_contracts !== 1 ? "S" : ""
                    } AFFECTED BY SHIFTS`
                  : summary.changes_this_week > 0
                    ? `${summary.changes_this_week} UPDATE${
                        summary.changes_this_week !== 1 ? "S" : ""
                      } DETECTED (T-7D)`
                    : `${summary.total_changes_monitored} STATUTES MONITORED`}
              </p>
            </div>
          </div>
          <Link href="/lawchange">
            <button className="inline-flex items-center justify-center px-4 py-2 bg-neutral-950 border border-neutral-800 text-neutral-400 hover:text-white hover:border-neutral-600 transition-colors font-mono text-[9px] tracking-widest uppercase w-full sm:w-auto">
              ACCESS_LOGS
            </button>
          </Link>
        </div>
      </div>
    </motion.div>
  );
}
