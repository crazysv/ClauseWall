"use client";

import { motion } from "framer-motion";
import { Gavel, ArrowRight } from "lucide-react";
import Link from "next/link";

interface ComplaintCTAProps {
  documentId: string;
  dangerousCount: number;
  illegalCount: number;
  entityName?: string | null;
}

export function ComplaintCTA({
  documentId,
  dangerousCount,
  illegalCount,
  entityName,
}: ComplaintCTAProps) {
  const hasIssues = dangerousCount > 0 || illegalCount > 0;

  if (!hasIssues) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="mt-4"
    >
      <Link href={`/complaint/${documentId}`} className="block w-full">
        <div className="p-4 rounded-xl bg-white dark:bg-card border border-slate-200 dark:border-slate-700 border-l-4 border-l-orange-500 shadow-sm dark:shadow-slate-900/20 hover:shadow-md transition-all cursor-pointer group">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-orange-50 group-hover:bg-orange-100 flex-shrink-0 transition-colors">
                <Gavel className="h-6 w-6 text-orange-500" />
              </div>
              <div>
                <p className="font-extrabold text-sm text-slate-900 dark:text-slate-100">
                  File Regulatory Complaint
                </p>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-0.5 max-w-2xl leading-relaxed">
                  {illegalCount > 0
                    ? `${illegalCount} illegal clause${illegalCount > 1 ? "s" : ""} found`
                    : `${dangerousCount} dangerous clause${dangerousCount > 1 ? "s" : ""} found`}
                  {entityName ? ` in ${entityName}'s contract` : ""}.
                  Initiate formal regulatory action instantly.
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-[9px] uppercase font-black px-1.5 py-0.5 rounded shadow-sm dark:shadow-slate-900/20 tracking-widest bg-emerald-50 text-emerald-600 border border-emerald-200">
                    Claims ≤ ₹5 lakh Free
                  </span>
                  <span className="text-[9px] uppercase font-black px-1.5 py-0.5 rounded shadow-sm dark:shadow-slate-900/20 tracking-widest bg-indigo-50 text-indigo-600 border border-indigo-200">
                    Guided Process
                  </span>
                </div>
              </div>
            </div>
            <div className="w-full sm:w-auto flex-shrink-0 mt-2 sm:mt-0">
               <button className="w-full sm:w-auto h-full px-4 py-2 sm:py-1.5 rounded-full border-2 border-teal-200 text-teal-700 bg-white dark:bg-card group-hover:bg-teal-50 group-hover:border-teal-300 text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-sm dark:shadow-slate-900/20">
                  Format Complaint <ArrowRight className="h-3.5 w-3.5 text-teal-600 group-hover:translate-x-1 transition-transform" />
               </button>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
