"use client";

import Link from "next/link";
import { Gamepad2, ArrowRight } from "lucide-react";

interface SimulatorCTAProps {
  documentId: string;
  overallRiskScore: number;
}

export function SimulatorCTA({ documentId, overallRiskScore }: SimulatorCTAProps) {
  if (overallRiskScore < 30) return null;

  return (
    <Link href={`/simulate/${documentId}`} className="block w-full">
      <div className="p-6 rounded-xl bg-white dark:bg-card border border-slate-200 dark:border-slate-700 border-l-4 border-l-indigo-500 shadow-sm dark:shadow-slate-900/20 hover:shadow-md transition-all cursor-pointer group">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-50 flex-shrink-0">
              <Gamepad2 className="h-6 w-6 text-indigo-500" />
            </div>
            <div>
              <p className="font-extrabold text-sm text-slate-900 dark:text-slate-100">
                See What This Contract Really Costs You
              </p>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-0.5 max-w-lg line-clamp-1">
                Interactive month-by-month financial simulator projecting penalty loops over time.
              </p>
            </div>
          </div>
          <div className="w-full sm:w-auto flex-shrink-0">
             <button className="w-full sm:w-auto px-4 py-2 sm:py-1.5 rounded-full border-2 border-teal-200 text-teal-700 bg-white dark:bg-card group-hover:bg-teal-50 group-hover:border-teal-300 text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-sm dark:shadow-slate-900/20">
                Simulate Costs <ArrowRight className="h-3.5 w-3.5 text-teal-600 group-hover:translate-x-1 transition-transform" />
             </button>
          </div>
        </div>
      </div>
    </Link>
  );
}