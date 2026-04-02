"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Network,
  ShieldAlert,
  Shield,
  ArrowRight,
  Loader2,
} from "lucide-react";
import type { PoisonPillAnalysisResult } from "@/types";

interface Props {
  documentId: string;
  poisonPillData: PoisonPillAnalysisResult | null;
  totalClauses: number;
}

export function PoisonPillCTA({ documentId, poisonPillData, totalClauses }: Props) {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<PoisonPillAnalysisResult | null>(poisonPillData);

  const runScan = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/poisonpill/${documentId}`);
      if (res.ok) {
        const result = await res.json();
        setData(result);
      }
    } catch {
      // Silent
    } finally {
      setLoading(false);
    }
  };

  if (totalClauses < 3) return null;

  if (loading) {
    return (
      <div className="mt-4 p-6 rounded-xl bg-white dark:bg-card border border-slate-200 dark:border-slate-700 border-l-4 border-l-purple-500 shadow-sm dark:shadow-slate-900/20 block w-full">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-purple-50 flex-shrink-0 animate-pulse">
              <Loader2 className="w-6 h-6 text-purple-500 animate-spin" />
            </div>
            <div>
              <p className="font-extrabold text-sm text-slate-900 dark:text-slate-100">
                AI Cross-scanning Network
              </p>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-0.5 max-w-lg line-clamp-1">
                Detecting interdependent clause combinations and structural traps...
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="block w-full mt-4">
        <div className="p-6 rounded-xl bg-white dark:bg-card border border-slate-200 dark:border-slate-700 border-l-4 border-l-purple-500 shadow-sm dark:shadow-slate-900/20 hover:shadow-md transition-all cursor-pointer group" onClick={runScan}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-purple-50 group-hover:bg-purple-100 flex-shrink-0 transition-colors">
                <Network className="w-6 h-6 text-purple-500" />
              </div>
              <div>
                <p className="font-extrabold text-sm text-slate-900 dark:text-slate-100">
                  Poison Pill Scanner
                </p>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-0.5 max-w-lg line-clamp-1">
                  Detect modular combinations that independently seem secure, but together create a fatal trap.
                </p>
              </div>
            </div>
            <div className="w-full sm:w-auto flex-shrink-0">
               <button className="w-full sm:w-auto px-4 py-2 sm:py-1.5 rounded-full border-2 border-teal-200 text-teal-700 bg-white dark:bg-card group-hover:bg-teal-50 group-hover:border-teal-300 text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-sm dark:shadow-slate-900/20">
                  Run Network Scan <ArrowRight className="h-3.5 w-3.5 text-teal-600 group-hover:translate-x-1 transition-transform" />
               </button>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  if (data.traps.length > 0) {
    const scrollToSection = () => {
      const el = document.getElementById("poison-pill-section");
      if (el) el.scrollIntoView({ behavior: "smooth" });
    };

    return (
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="block w-full mt-4">
        <div onClick={scrollToSection} className="p-6 rounded-xl bg-white dark:bg-card border border-slate-200 dark:border-slate-700 border-l-4 border-l-rose-500 shadow-sm dark:shadow-slate-900/20 hover:shadow-md transition-all cursor-pointer group">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-rose-50 group-hover:bg-rose-100 flex-shrink-0 transition-colors">
                <ShieldAlert className="w-6 h-6 text-rose-500" />
              </div>
              <div>
                <p className="font-extrabold text-sm text-slate-900 dark:text-slate-100">
                  {data.traps.length} Poison Pill Trap{data.traps.length > 1 ? "s" : ""} Found
                </p>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-0.5 max-w-lg line-clamp-1">
                  Cascade Severity: <span className="text-rose-600 font-black">{data.combined_trap_score}/100</span> — {data.most_dangerous_trap?.trap_name}
                </p>
              </div>
            </div>
            <div className="w-full sm:w-auto flex-shrink-0">
               <button className="w-full sm:w-auto px-4 py-2 sm:py-1.5 rounded-full border-2 border-teal-200 text-teal-700 bg-white dark:bg-card group-hover:bg-teal-50 group-hover:border-teal-300 text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-sm dark:shadow-slate-900/20">
                  Inspect Vector <ArrowRight className="h-3.5 w-3.5 text-teal-600 group-hover:translate-x-1 transition-transform" />
               </button>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  // Has data, no traps
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="block w-full mt-4">
      <div className="p-6 rounded-xl bg-white dark:bg-card border border-slate-200 dark:border-slate-700 border-l-4 border-l-emerald-500 shadow-sm dark:shadow-slate-900/20">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-50 flex-shrink-0">
              <Shield className="w-6 h-6 text-emerald-500" />
            </div>
            <div>
              <p className="font-extrabold text-sm text-slate-900 dark:text-slate-100">
                Network Secure — No Poison Pills
              </p>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-0.5 max-w-lg line-clamp-1">
                Cross-layer clause analysis complete. No dangerous combinatorial traps detected.
              </p>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
