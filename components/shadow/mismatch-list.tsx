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
  const [filterSeverity, setFilterSeverity] = useState<
    MismatchSeverity | "all"
  >("all");
  const [filterType, setFilterType] = useState<MismatchType | "all">("all");
  const [sortBy, setSortBy] = useState<SortOption>("severity");

  const filtered = useMemo(() => {
    let result = [...mismatches];

    if (filterSeverity !== "all") {
      result = result.filter((m) => m.severity === filterSeverity);
    }
    if (filterType !== "all") {
      result = result.filter((m) => m.mismatch_type === filterType);
    }

    const severityOrder: Record<string, number> = {
      critical: 0,
      major: 1,
      minor: 2,
      info: 3,
    };

    if (sortBy === "severity") {
      result.sort(
        (a, b) =>
          (severityOrder[a.severity] ?? 4) - (severityOrder[b.severity] ?? 4),
      );
    } else if (sortBy === "financial") {
      result.sort(
        (a, b) => (b.financial_impact || 0) - (a.financial_impact || 0),
      );
    }

    return result;
  }, [mismatches, filterSeverity, filterType, sortBy]);

  if (mismatches.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center border border-emerald-900/50 bg-emerald-950/10">
        <PartyPopper className="w-12 h-12 text-emerald-500 mb-4" />
        <h3 className="text-xs font-mono uppercase tracking-widest text-emerald-400 mb-2">
          NO MISMATCHES FOUND!
        </h3>
        <p className="text-[8px] font-mono uppercase tracking-widest text-neutral-600 max-w-sm leading-relaxed">
          THE PROMISES MATCH THE CONTRACT. YOUR AGREEMENT APPEARS TRUSTWORTHY.
          🎉
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-1.5 border-b border-neutral-900 pb-3">
        <div className="flex items-center gap-2 text-[8px] font-mono uppercase tracking-widest text-neutral-400 pr-2">
          <Filter className="w-3 h-3" />
          SEVERITY:
        </div>
        {(["all", "critical", "major", "minor", "info"] as const).map((sev) => (
          <button
            key={sev}
            onClick={() => setFilterSeverity(sev)}
            className={`px-2 py-1 text-[7px] font-mono uppercase tracking-widest transition-colors border ${
              filterSeverity === sev
                ? "bg-amber-950/20 text-amber-400 border-amber-900/50"
                : "bg-[#050505] text-neutral-600 border-neutral-800 hover:border-neutral-700 hover:text-neutral-400"
            }`}
          >
            {sev === "all" ? "ALL" : sev.toUpperCase()}
            {sev !== "all" && (
              <span
                className={`ml-1.5 px-1 ${filterSeverity === sev ? "text-amber-400/70" : "text-neutral-700"}`}
              >
                {mismatches.filter((m) => m.severity === sev).length}
              </span>
            )}
          </button>
        ))}

        <div className="w-px h-6 bg-neutral-800 mx-2 hidden sm:block" />

        <button
          onClick={() =>
            setSortBy(sortBy === "severity" ? "financial" : "severity")
          }
          className="flex items-center gap-2 px-2 py-1 text-[7px] font-mono uppercase tracking-widest transition-colors border border-amber-900/50 bg-amber-950/10 text-amber-400 hover:text-amber-300 ml-auto"
        >
          <ArrowUpDown className="w-3 h-3" />
          {sortBy === "severity" ? "BY SEVERITY" : "BY IMPACT"}
        </button>
      </div>

      {/* Mismatch Cards */}
      <div className="space-y-3">
        {filtered.map((mismatch, i) => (
          <MismatchCard key={mismatch.id} mismatch={mismatch} index={i} />
        ))}
      </div>

      {filtered.length === 0 && mismatches.length > 0 && (
        <div className="p-4 border border-dashed border-neutral-800 text-center">
          <p className="text-[8px] font-mono uppercase tracking-widest text-neutral-600">
            NO MISMATCHES MATCH THE SELECTED FILTER.
          </p>
        </div>
      )}
    </div>
  );
}
