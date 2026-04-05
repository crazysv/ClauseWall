"use client";

import { Badge } from "@/components/ui/badge";
import {
  BENCHMARK_TYPE_LABELS,
  DOCUMENT_TYPE_INFO,
  INDIAN_STATES,
} from "@/lib/market/constants";
import type { BenchmarkType } from "@/types/market";

interface CategoryFilterBarProps {
  selectedType: string;
  selectedScope: string;
  selectedDocType: string;
  onTypeChange: (type: string) => void;
  onScopeChange: (scope: string) => void;
  onDocTypeChange: (docType: string) => void;
}

export default function CategoryFilterBar({
  selectedType,
  selectedScope,
  selectedDocType,
  onTypeChange,
  onScopeChange,
  onDocTypeChange,
}: CategoryFilterBarProps) {
  const benchmarkTypes = [
    "all",
    ...Object.keys(BENCHMARK_TYPE_LABELS).slice(0, 12),
  ];

  const docTypes = ["all", ...Object.keys(DOCUMENT_TYPE_INFO)];

  const scopes = [
    "all",
    "national",
    ...Object.entries(INDIAN_STATES)
      .filter(([_, s]) => s.major_cities.length > 2)
      .map(([key]) => key)
      .slice(0, 10),
  ];

  return (
    <div className="space-y-3 p-4 rounded-none bg-white/[0.02] border border-foreground border-2">
      {/* Benchmark Type */}
      <div>
        <p className="text-[10px] text-foreground font-medium uppercase tracking-wider mb-1.5">
          Metric
        </p>
        <div className="flex flex-wrap gap-1.5">
          {benchmarkTypes.map((type) => (
            <button
              key={type}
              onClick={() => onTypeChange(type)}
              className={`px-2.5 py-1 rounded-md text-xs transition-colors ${selectedType === type ? "bg-cyan-500/15 text-cyan-400 border border-cyan-500/30" : "bg-white/[0.03] text-foreground border border-foreground border-2 hover:text-foreground"}`}
            >
              {type === "all"
                ? "All"
                : BENCHMARK_TYPE_LABELS[type as BenchmarkType] || type}
            </button>
          ))}
        </div>
      </div>

      {/* Document Type */}
      <div>
        <p className="text-[10px] text-foreground font-medium uppercase tracking-wider mb-1.5">
          Contract Type
        </p>
        <div className="flex flex-wrap gap-1.5">
          {docTypes.map((dt) => {
            const info = DOCUMENT_TYPE_INFO[dt];
            return (
              <button
                key={dt}
                onClick={() => onDocTypeChange(dt)}
                className={`px-2.5 py-1 rounded-md text-xs transition-colors ${selectedDocType === dt ? "bg-purple-500/15 text-purple-400 border border-purple-500/30" : "bg-white/[0.03] text-foreground border border-foreground border-2 hover:text-foreground"}`}
              >
                {dt === "all"
                  ? "All"
                  : `${info?.icon || ""} ${info?.label || dt}`}
              </button>
            );
          })}
        </div>
      </div>

      {/* Scope */}
      <div>
        <p className="text-[10px] text-foreground font-medium uppercase tracking-wider mb-1.5">
          Region
        </p>
        <div className="flex flex-wrap gap-1.5">
          {scopes.map((scope) => {
            const stateInfo = INDIAN_STATES[scope];
            return (
              <button
                key={scope}
                onClick={() => onScopeChange(scope)}
                className={`px-2.5 py-1 rounded-md text-xs transition-colors capitalize ${selectedScope === scope ? "bg-green-500/15 text-green-400 border border-green-500/30" : "bg-white/[0.03] text-foreground border border-foreground border-2 hover:text-foreground"}`}
              >
                {scope === "all"
                  ? "All India"
                  : stateInfo?.name || scope.replace(/_/g, " ")}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
