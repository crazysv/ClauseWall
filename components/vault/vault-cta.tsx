"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { ShieldCheck, AlertTriangle, ArrowRight, FileStack } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface LatestVaultData {
  analysis: {
    risk_score: number;
    risk_summary: string;
    conflicts: unknown[];
    coverage_gaps: unknown[];
    cascading_failures: unknown[];
  } | null;
  is_stale: boolean;
  has_enough_contracts: boolean;
  contract_count: number;
}

export function VaultCTA() {
  const [data, setData] = useState<LatestVaultData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLatest = async () => {
      try {
        const res = await fetch("/api/vault/latest");
        if (res.ok) {
          setData(await res.json());
        }
      } catch {
        // Silent fail
      } finally {
        setLoading(false);
      }
    };
    fetchLatest();
  }, []);

  if (loading || !data) return null;

  if (!data.has_enough_contracts) {
    return (
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="block w-full mt-4">
        <div className="p-4 rounded-xl bg-white dark:bg-card border border-slate-200 dark:border-slate-700 border-l-4 border-l-indigo-400 shadow-sm dark:shadow-slate-900/20 transition-all group">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-indigo-50 flex-shrink-0">
                <FileStack className="w-6 h-6 text-indigo-500" />
              </div>
              <div>
                <p className="font-extrabold text-sm text-slate-900 dark:text-slate-100">
                  Contract Vault Cross-Analysis
                </p>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-0.5 max-w-lg line-clamp-1">
                  Upload {2 - data.contract_count} more contract(s) to map cascading logic failures across agreements.
                </p>
              </div>
            </div>
            <div className="w-full sm:w-auto flex-shrink-0">
               <Link href="/upload" className="w-full">
                 <button className="w-full sm:w-auto px-4 py-2 sm:py-1.5 rounded-full border-2 border-teal-200 text-teal-700 bg-white dark:bg-card hover:bg-teal-50 hover:border-teal-300 text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-sm dark:shadow-slate-900/20">
                    Upload Documents <ArrowRight className="h-3.5 w-3.5 text-teal-600 transition-transform" />
                 </button>
               </Link>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  const isHighRisk = data.analysis ? data.analysis.risk_score > 50 : false;

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="block w-full mt-4">
      <Link href="/vault" className="block w-full">
        <div className={`p-4 rounded-xl bg-white dark:bg-card border border-slate-200 dark:border-slate-700 border-l-4 shadow-sm dark:shadow-slate-900/20 hover:shadow-md transition-all cursor-pointer group ${isHighRisk ? 'border-l-rose-500' : 'border-l-indigo-500'}`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className={`p-2.5 rounded-xl flex-shrink-0 transition-colors ${isHighRisk ? 'bg-rose-50 group-hover:bg-rose-100' : 'bg-indigo-50 group-hover:bg-indigo-100'}`}>
                {isHighRisk ? (
                  <AlertTriangle className="w-6 h-6 text-rose-500" />
                ) : (
                  <ShieldCheck className="w-6 h-6 text-indigo-500" />
                )}
              </div>
              <div>
                <p className="font-extrabold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  Vault Sub-Net
                  {data.is_stale && (
                     <span className="text-[9px] uppercase tracking-widest font-black px-1.5 py-0.5 rounded shadow-sm dark:shadow-slate-900/20 border border-amber-200 bg-amber-50 text-amber-600">STALE</span>
                  )}
                </p>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-0.5 max-w-lg line-clamp-1">
                  {data.analysis ? (
                    <>
                      {data.analysis.conflicts?.length || 0} logic conflicts · {data.analysis.coverage_gaps?.length || 0} gaps · {data.analysis.cascading_failures?.length || 0} cascade threats
                    </>
                  ) : "Run cross-contract analysis to map network exposure."}
                </p>
              </div>
            </div>
            <div className="w-full sm:w-auto flex-shrink-0">
               <button className="w-full sm:w-auto px-4 py-2 sm:py-1.5 rounded-full border-2 border-teal-200 text-teal-700 bg-white dark:bg-card group-hover:bg-teal-50 group-hover:border-teal-300 text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-sm dark:shadow-slate-900/20">
                  {data.analysis ? "View Network Map" : "Map Network"} <ArrowRight className="h-3.5 w-3.5 text-teal-600 group-hover:translate-x-1 transition-transform" />
               </button>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
