"use client";

import { useState, useMemo } from "react";
import { Filter, ArrowUpDown, PartyPopper } from "lucide-react";
import MismatchCard from "./mismatch-card";
import type { ContractMismatch, MismatchSeverity, MismatchType } from "@/types";

interface MismatchListProps {
  mismatches: ContractMismatch[];
}

type SortOption = "severity" | "date" | "financial";

export default function MismatchList({ mismatches }: MismatchListProps) {
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
      <div className="flex flex-col items-center justify-center p-8 text-center bg-green-50 border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
        <PartyPopper className="w-16 h-16 text-green-600 mb-4" />
        <h3 className="text-xl font-black uppercase tracking-widest text-black mb-2">No mismatches found!</h3>
        <p className="text-sm font-bold uppercase tracking-widest text-black/60 max-w-sm">
          The promises match the contract. Your agreement appears trustworthy. 🎉
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 bg-gray-100 p-3 border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
        <div className="flex items-center gap-2 text-sm font-black uppercase tracking-widest text-black pr-2">
          <Filter className="w-4 h-4" />
          Severity:
        </div>
        {(["all", "critical", "major", "minor", "info"] as const).map(sev => (
          <button
            key={sev}
            onClick={() => setFilterSeverity(sev)}
            className={`px-3 py-2 text-xs font-black uppercase tracking-widest transition-all border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-y-0.5 hover:shadow-[0px_0px_0px_0px_rgba(0,0,0,1)] ${
              filterSeverity === sev
                ? "bg-black text-white"
                : "bg-white text-black hover:bg-gray-200"
            }`}
          >
            {sev === "all" ? "All" : sev}
            {sev !== "all" && (
              <span className={`ml-2 px-1 ${filterSeverity === sev ? "bg-white text-black" : "bg-black text-white"}`}>
                {mismatches.filter(m => m.severity === sev).length}
              </span>
            )}
          </button>
        ))}

        <div className="w-1 h-8 bg-black mx-2 hidden sm:block" />

        <button
          onClick={() => setSortBy(sortBy === "severity" ? "financial" : "severity")}
          className="flex items-center gap-2 px-3 py-2 text-xs font-black uppercase tracking-widest transition-all border-2 border-black bg-yellow-200 text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-y-0.5 hover:shadow-[0px_0px_0px_0px_rgba(0,0,0,1)] ml-auto"
        >
          <ArrowUpDown className="w-4 h-4" />
          {sortBy === "severity" ? "By Severity" : "By Impact"}
        </button>
      </div>

      {/* Mismatch Cards */}
      <div className="space-y-4">
        {filtered.map((mismatch, i) => (
          <MismatchCard key={mismatch.id} mismatch={mismatch} index={i} />
        ))}
      </div>

      {filtered.length === 0 && mismatches.length > 0 && (
        <div className="p-4 bg-gray-100 border-4 border-black border-dashed text-center">
          <p className="text-sm font-black uppercase tracking-widest text-black/50">
            No mismatches match the selected filter.
          </p>
        </div>
      )}
    </div>
  );
}
