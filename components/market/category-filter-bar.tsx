"use client";

import { Badge } from "@/components/ui/badge";
import { BENCHMARK_TYPE_LABELS, DOCUMENT_TYPE_INFO, INDIAN_STATES } from "@/lib/market/constants";
import type { BenchmarkType } from "@/types/market";

interface CategoryFilterBarProps {
  selectedType: string;
  selectedScope: string;
  selectedDocType: string;
  onTypeChange: (type: string) => void;
  onScopeChange: (scope: string) => void;
  onDocTypeChange: (docType: string) => void;
}

export function CategoryFilterBar({
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
    <div className="space-y-4 p-5 rounded-2xl bg-white dark:bg-card border border-slate-200 dark:border-slate-700 shadow-sm dark:shadow-slate-900/20">
      {/* Benchmark Type */}
      <div>
        <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest mb-2">Metric</p>
        <div className="flex flex-wrap gap-2">
          {benchmarkTypes.map((type) => (
            <button
              key={type}
              onClick={() => onTypeChange(type)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${ selectedType === type ? "bg-teal-50 text-teal-700 border-2 border-teal-200" : "bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-2 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 hover:border-slate-300" }`}
            >
              {type === "all" ? "All" : BENCHMARK_TYPE_LABELS[type as BenchmarkType] || type}
            </button>
          ))}
        </div>
      </div>

      {/* Document Type */}
      <div>
        <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest mb-2">Contract Type</p>
        <div className="flex flex-wrap gap-2">
          {docTypes.map((dt) => {
            const info = DOCUMENT_TYPE_INFO[dt];
            return (
              <button
                key={dt}
                onClick={() => onDocTypeChange(dt)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${ selectedDocType === dt ? "bg-purple-50 text-purple-700 border-2 border-purple-200" : "bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-2 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 hover:border-slate-300" }`}
              >
                {dt === "all" ? "All" : `${info?.icon || ""} ${info?.label || dt}`}
              </button>
            );
          })}
        </div>
      </div>

      {/* Scope */}
      <div>
        <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest mb-2">Region</p>
        <div className="flex flex-wrap gap-2">
          {scopes.map((scope) => {
            const stateInfo = INDIAN_STATES[scope];
            return (
              <button
                key={scope}
                onClick={() => onScopeChange(scope)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all capitalize ${ selectedScope === scope ? "bg-emerald-50 text-emerald-700 border-2 border-emerald-200" : "bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-2 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 hover:border-slate-300" }`}
              >
                {scope === "all" ? "All India" : stateInfo?.name || scope.replace(/_/g, " ")}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
