"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { ArrowUpDown, ChevronDown, ChevronUp } from "lucide-react";
import type { MarketBenchmark, BenchmarkType } from "@/types/market";
import { BENCHMARK_TYPE_LABELS, UNIT_LABELS } from "@/lib/market/constants";

interface BenchmarkTableProps {
  benchmarks: MarketBenchmark[];
}

type SortKey = "benchmark_type" | "scope_value" | "sample_count" | "median_value" | "mean_value";

export function BenchmarkTable({ benchmarks }: BenchmarkTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>("sample_count");
  const [sortAsc, setSortAsc] = useState(false);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  const sorted = useMemo(() => {
    return [...benchmarks].sort((a, b) => {
      const aVal = (a as any)[sortKey] ?? 0;
      const bVal = (b as any)[sortKey] ?? 0;
      if (typeof aVal === "string") return sortAsc ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      return sortAsc ? aVal - bVal : bVal - aVal;
    });
  }, [benchmarks, sortKey, sortAsc]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortAsc(!sortAsc);
    else { setSortKey(key); setSortAsc(false); }
  };

  const columns: { key: SortKey; label: string; align?: string }[] = [
    { key: "benchmark_type", label: "Metric" },
    { key: "scope_value", label: "Scope" },
    { key: "sample_count", label: "Samples", align: "text-right" },
    { key: "median_value", label: "Median", align: "text-right" },
    { key: "mean_value", label: "Mean", align: "text-right" },
  ];

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm dark:shadow-slate-900/20 bg-white dark:bg-card overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400">
            {columns.map((col) => (
              <th
                key={col.key}
                className={`px-4 py-3 text-[10px] font-bold uppercase tracking-widest cursor-pointer hover:text-slate-700 transition-colors ${col.align || "text-left"}`}
                onClick={() => toggleSort(col.key)}
              >
                <span className="inline-flex items-center gap-1.5">
                  {col.label}
                  <ArrowUpDown className="h-3 w-3 opacity-40 hover:opacity-100" />
                </span>
              </th>
            ))}
            <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 text-right">P25–P75</th>
            <th className="w-8" />
          </tr>
        </thead>
        <tbody>
          {sorted.map((bm) => {
            const label = BENCHMARK_TYPE_LABELS[bm.benchmark_type as BenchmarkType] || bm.benchmark_type;
            const unit = UNIT_LABELS[bm.value_unit || ""] || "";
            const isExpanded = expandedRow === bm.id;

            return (
              <motion.tr
                key={bm.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="border-t border-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800 dark:bg-slate-800 cursor-pointer transition-colors"
                onClick={() => setExpandedRow(isExpanded ? null : bm.id)}
              >
                <td className="px-4 py-3 text-slate-900 dark:text-slate-100 font-bold">{label}</td>
                <td className="px-4 py-3 text-slate-500 dark:text-slate-400 font-medium capitalize">{bm.scope_value?.replace(/_/g, " ") || "—"}</td>
                <td className="px-4 py-3 text-right text-slate-500 dark:text-slate-400 font-medium">{bm.sample_count}</td>
                <td className="px-4 py-3 text-right text-indigo-700 font-bold">
                  {bm.median_value !== null ? `${bm.median_value} ${unit}` : "—"}
                </td>
                <td className="px-4 py-3 text-right text-slate-600 dark:text-slate-400 font-bold">
                  {bm.mean_value !== null ? `${bm.mean_value} ${unit}` : "—"}
                </td>
                <td className="px-4 py-3 text-right text-slate-400 text-xs font-medium">
                  {bm.p25_value !== null && bm.p75_value !== null
                    ? `${bm.p25_value}–${bm.p75_value} ${unit}`
                    : "—"}
                </td>
                <td className="px-4 py-3">
                  {isExpanded
                    ? <ChevronUp className="h-4 w-4 text-slate-400" />
                    : <ChevronDown className="h-4 w-4 text-slate-400" />}
                </td>
              </motion.tr>
            );
          })}
        </tbody>
      </table>
      {sorted.length === 0 && (
        <div className="text-center py-6 md:py-8 lg:py-12 text-slate-400 font-medium text-sm bg-slate-50 dark:bg-slate-800 border-t border-slate-100">
          No benchmarks match your filters
        </div>
      )}
    </div>
  );
}
