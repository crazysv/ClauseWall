"use client";

import { FileText, ShieldCheck, AlertCircle, Flame, Skull } from "lucide-react";

// SummaryStats component - Overview statistics for the analysis
export function SummaryStats({ stats, ...restProps }: { stats?: any, [key: string]: any }) {
  // Support both legacy `stats` prop and standard `document/clauses` injected directly by results-client
  const doc = stats || restProps.document || restProps || {};
  
  // Extract values precisely preserving all original score resolution pathways
  const total = doc.total_clauses || doc.totalClauses || restProps.clauses?.length || 0;
  const safe = doc.safe_count || doc.safeCount || 0;
  const warning = doc.warning_count || doc.warningCount || 0;
  const dangerous = doc.dangerous_count || doc.dangerousClauses || doc.dangerousCount || 0;
  const illegal = doc.illegal_count || doc.illegalCount || 0;

  return (
    <div className="w-full">
      <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-4 px-1">Analysis Summary</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 md:flex md:flex-row flex-wrap gap-4 w-full">
        {/* Total Clauses */}
        <div className="flex-1 bg-white dark:bg-card rounded-xl shadow-sm dark:shadow-slate-900/20 border border-slate-100 p-5 transition-transform duration-300 hover:-translate-y-1 hover:shadow-md flex flex-col justify-between min-w-[130px]">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-slate-300" />
              <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Total</p>
            </div>
            <FileText className="h-5 w-5 text-slate-300" />
          </div>
          <h4 className="text-xl md:text-lg md:text-xl lg:text-2xl lg:text-3xl font-black text-slate-800 dark:text-slate-200">{total}</h4>
        </div>

        {/* Safe */}
        <div className="flex-1 bg-white dark:bg-card rounded-xl shadow-sm dark:shadow-slate-900/20 border border-slate-100 p-5 transition-transform duration-300 hover:-translate-y-1 hover:shadow-md flex flex-col justify-between min-w-[130px]">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
              <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Safe</p>
            </div>
            <ShieldCheck className="h-5 w-5 text-emerald-200" />
          </div>
          <h4 className="text-xl md:text-lg md:text-xl lg:text-2xl lg:text-3xl font-black text-slate-800 dark:text-slate-200">{safe}</h4>
        </div>

        {/* Warning */}
        <div className="flex-1 bg-white dark:bg-card rounded-xl shadow-sm dark:shadow-slate-900/20 border border-slate-100 p-5 transition-transform duration-300 hover:-translate-y-1 hover:shadow-md flex flex-col justify-between min-w-[130px]">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.5)]" />
              <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Warning</p>
            </div>
            <AlertCircle className="h-5 w-5 text-amber-200" />
          </div>
          <h4 className="text-xl md:text-lg md:text-xl lg:text-2xl lg:text-3xl font-black text-slate-800 dark:text-slate-200">{warning}</h4>
        </div>

        {/* Dangerous */}
        <div className="flex-1 bg-white dark:bg-card rounded-xl shadow-sm dark:shadow-slate-900/20 border border-slate-100 p-5 transition-transform duration-300 hover:-translate-y-1 hover:shadow-md flex flex-col justify-between min-w-[130px]">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]" />
              <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Danger</p>
            </div>
            <Flame className="h-5 w-5 text-rose-200" />
          </div>
          <h4 className="text-xl md:text-lg md:text-xl lg:text-2xl lg:text-3xl font-black text-slate-800 dark:text-slate-200">{dangerous}</h4>
        </div>

        {/* Illegal */}
        <div className="flex-1 bg-white dark:bg-card rounded-xl shadow-sm dark:shadow-slate-900/20 border border-slate-100 p-5 transition-transform duration-300 hover:-translate-y-1 hover:shadow-md flex flex-col justify-between min-w-[130px]">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-purple-600 shadow-[0_0_8px_rgba(147,51,234,0.5)]" />
              <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Illegal</p>
            </div>
            <Skull className="h-5 w-5 text-purple-200" />
          </div>
          <h4 className="text-xl md:text-lg md:text-xl lg:text-2xl lg:text-3xl font-black text-slate-800 dark:text-slate-200">{illegal}</h4>
        </div>
      </div>
    </div>
  );
}
