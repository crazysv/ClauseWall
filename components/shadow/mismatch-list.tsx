"use client";

import { useState, useMemo } from "react";
import { Filter, ArrowUpDown, PartyPopper } from "lucide-react";
import { MismatchCard } from "./mismatch-card";
import type { ContractMismatch, MismatchSeverity, MismatchType } from "@/types";

interface MismatchListProps {
  mismatches: ContractMismatch[];
}

type SortOption = "severity" | "date" | "financial";

export function MismatchList({ mismatches }: MismatchListProps) {
  const [filterSeverity, setFilterSeverity] = useState<MismatchSeverity | "all">("all");
  const [filterType, setFilterType] = useState<MismatchType | "all">("all");
  const [sortBy, setSortBy] = useState<SortOption>("severity");

  const filtered = useMemo(() => {
    let result = [...mismatches];

    if (filterSeverity !== "all") {
      result = result.filter(m => m.severity === filterSeverity);
    }
    if (filterType !== "all") {
      result = result.filter(m => m.mismatch_type === filterType);
    }

    const severityOrder: Record<string, number> = { critical: 0, major: 1, minor: 2, info: 3 };

    if (sortBy === "severity") {
      result.sort((a, b) => (severityOrder[a.severity] ?? 4) - (severityOrder[b.severity] ?? 4));
    } else if (sortBy === "financial") {
      result.sort((a, b) => (b.financial_impact || 0) - (a.financial_impact || 0));
    }

    return result;
  }, [mismatches, filterSeverity, filterType, sortBy]);

  if (mismatches.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-4 md:px-6 sm:px-12 text-center bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 mt-4 max-w-4xl mx-auto rounded-3xl shadow-inner">
        <div className="h-20 w-20 bg-white dark:bg-card border border-slate-100 shadow-sm dark:shadow-slate-900/20 rounded-3xl flex items-center justify-center mb-6">
          <PartyPopper className="w-10 h-10 text-emerald-500" />
        </div>
        <h3 className="text-xl font-black text-slate-900 dark:text-slate-100 tracking-tight">No mismatches found!</h3>
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-2 max-w-md leading-relaxed">
          The promises match the contract. Your agreement appears trustworthy. <span className="text-lg">🎉</span>
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-400 mr-1">
          <Filter className="w-3 h-3" />
          Severity:
        </div>
        {(["all", "critical", "major", "minor", "info"] as const).map(sev => (
          <button
            key={sev}
            onClick={() => setFilterSeverity(sev)}
            className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all shadow-sm dark:shadow-slate-900/20 ${ filterSeverity === sev ? "bg-indigo-600 text-white border-2 border-indigo-700" : "bg-white dark:bg-card border-2 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-700" }`}
          >
            {sev === "all" ? "All" : sev.charAt(0).toUpperCase() + sev.slice(1)}
            {sev !== "all" && (
              <span className={`ml-1 ${filterSeverity === sev ? "text-indigo-200" : "text-slate-300"}`}>
                ({mismatches.filter(m => m.severity === sev).length})
              </span>
            )}
          </button>
        ))}

        <div className="w-px h-5 bg-slate-200 mx-2 hidden sm:block" />

        <button
          onClick={() => setSortBy(sortBy === "severity" ? "financial" : "severity")}
          className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all bg-white dark:bg-card border-2 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 shadow-sm dark:shadow-slate-900/20"
        >
          <ArrowUpDown className="w-3.5 h-3.5" />
          {sortBy === "severity" ? "By Severity" : "By Impact"}
        </button>
      </div>

      {/* Mismatch Cards */}
      <div className="space-y-0">
        {filtered.map((mismatch, i) => (
          <MismatchCard key={mismatch.id} mismatch={mismatch} index={i} />
        ))}
      </div>

      {filtered.length === 0 && mismatches.length > 0 && (
        <p className="text-center text-sm font-bold text-slate-400 py-10 uppercase tracking-widest">
          No mismatches match the selected filter.
        </p>
      )}
    </div>
  );
}
