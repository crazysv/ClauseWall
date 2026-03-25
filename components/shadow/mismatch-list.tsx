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
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <PartyPopper className="w-12 h-12 text-green-400 mb-3" />
        <h3 className="text-lg font-semibold text-green-300">No mismatches found!</h3>
        <p className="text-sm text-white/40 mt-1 max-w-sm">
          The promises match the contract. Your agreement appears trustworthy. 🎉
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-1 text-xs text-white/40">
          <Filter className="w-3 h-3" />
          Severity:
        </div>
        {(["all", "critical", "major", "minor", "info"] as const).map(sev => (
          <button
            key={sev}
            onClick={() => setFilterSeverity(sev)}
            className={`px-2 py-1 rounded text-xs transition-colors ${
              filterSeverity === sev
                ? "bg-white/10 text-white"
                : "text-white/40 hover:text-white/60 hover:bg-white/5"
            }`}
          >
            {sev === "all" ? "All" : sev.charAt(0).toUpperCase() + sev.slice(1)}
            {sev !== "all" && (
              <span className="ml-1 text-white/20">
                ({mismatches.filter(m => m.severity === sev).length})
              </span>
            )}
          </button>
        ))}

        <div className="w-px h-4 bg-white/10 mx-1 hidden sm:block" />

        <button
          onClick={() => setSortBy(sortBy === "severity" ? "financial" : "severity")}
          className="flex items-center gap-1 px-2 py-1 rounded text-xs text-white/40 hover:text-white/60 hover:bg-white/5"
        >
          <ArrowUpDown className="w-3 h-3" />
          {sortBy === "severity" ? "By Severity" : "By Impact"}
        </button>
      </div>

      {/* Mismatch Cards */}
      <div className="space-y-3">
        {filtered.map((mismatch, i) => (
          <MismatchCard key={mismatch.id} mismatch={mismatch} index={i} />
        ))}
      </div>

      {filtered.length === 0 && mismatches.length > 0 && (
        <p className="text-center text-sm text-white/30 py-6">
          No mismatches match the selected filter.
        </p>
      )}
    </div>
  );
}
