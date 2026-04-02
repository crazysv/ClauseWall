"use client";

import Link from "next/link";
import { DoorOpen, ArrowRight } from "lucide-react";

interface EscapeCTAProps {
  documentId: string;
  dangerousCount: number;
  illegalCount: number;
}

export function EscapeCTA({ documentId, dangerousCount, illegalCount }: EscapeCTAProps) {
  const totalRisky = dangerousCount + illegalCount;

  if (totalRisky === 0) return null;

  return (
    <Link href={`/escape/${documentId}`} className="block w-full">
      <div className="p-6 rounded-xl bg-white dark:bg-card border border-slate-200 dark:border-slate-700 border-l-4 border-l-orange-500 shadow-sm dark:shadow-slate-900/20 hover:shadow-md transition-all cursor-pointer group">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-orange-50 flex-shrink-0">
              <DoorOpen className="h-6 w-6 text-orange-500" />
            </div>
            <div>
              <p className="font-extrabold text-sm text-slate-900 dark:text-slate-100">
                Already Signed This Contract?
              </p>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-0.5 max-w-lg">
                {totalRisky} clause{totalRisky !== 1 ? "s" : ""} may be void under Indian law. Get your personalized extraction and recovery plan.
              </p>
            </div>
          </div>
          <div className="w-full sm:w-auto flex-shrink-0">
             <button className="w-full sm:w-auto px-4 py-2 sm:py-1.5 rounded-full border-2 border-teal-200 text-teal-700 bg-white dark:bg-card group-hover:bg-teal-50 group-hover:border-teal-300 text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-sm dark:shadow-slate-900/20">
                Get Escape Plan <ArrowRight className="h-3.5 w-3.5 text-teal-600 group-hover:translate-x-1 transition-transform" />
             </button>
          </div>
        </div>
      </div>
    </Link>
  );
}