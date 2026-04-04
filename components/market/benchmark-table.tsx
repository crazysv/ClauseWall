"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { ArrowUpDown, ChevronDown, ChevronUp } from "lucide-react";
import type { MarketBenchmark, BenchmarkType } from "@/types/market";
import { BENCHMARK_TYPE_LABELS, UNIT_LABELS } from "@/lib/market/constants";

interface BenchmarkTableProps {
  benchmarks: MarketBenchmark[];
}

type SortKey =
  | "benchmark_type"
  | "scope_value"
  | "sample_count"
  | "median_value"
  | "mean_value";

export default function BenchmarkTable({ benchmarks }: BenchmarkTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>("sample_count");
  const [sortAsc, setSortAsc] = useState(false);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  const sorted = useMemo(() => {
    return [...benchmarks].sort((a, b) => {
      const aVal = (a as any)[sortKey] ?? 0;
      const bVal = (b as any)[sortKey] ?? 0;
      if (typeof aVal === "string")
        return sortAsc ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      return sortAsc ? aVal - bVal : bVal - aVal;
    });
  }, [benchmarks, sortKey, sortAsc]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortAsc(!sortAsc);
    else {
      setSortKey(key);
      setSortAsc(false);
    }
  };

  const columns: { key: SortKey; label: string; align?: string }[] = [
    { key: "benchmark_type", label: "Metric" },
    { key: "scope_value", label: "Scope" },
    { key: "sample_count", label: "Samples", align: "text-right" },
    { key: "median_value", label: "Median", align: "text-right" },
    { key: "mean_value", label: "Mean", align: "text-right" },
  ];

  return (
    <div className="overflow-x-auto rounded-xl border border-white/5">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-white/[0.03]">
            {columns.map((col) => (
              <th
                key={col.key}
                className={`px-4 py-3 text-xs font-medium text-white/40 cursor-pointer hover:text-white/60 transition-colors ${col.align || "text-left"}`}
                onClick={() => toggleSort(col.key)}
              >
                <span className="inline-flex items-center gap-1">
                  {col.label}
                  <ArrowUpDown className="h-3 w-3 opacity-40" />
                </span>
              </th>
            ))}
            <th className="px-4 py-3 text-xs font-medium text-white/40 text-right">
              P25–P75
            </th>
            <th className="w-8" />
          </tr>
        </thead>
        <tbody>
          {sorted.map((bm) => {
            const label =
              BENCHMARK_TYPE_LABELS[bm.benchmark_type as BenchmarkType] ||
              bm.benchmark_type;
            const unit = UNIT_LABELS[bm.value_unit || ""] || "";
            const isExpanded = expandedRow === bm.id;

            return (
              <motion.tr
                key={bm.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="border-t border-white/5 hover:bg-white/[0.02] cursor-pointer"
                onClick={() => setExpandedRow(isExpanded ? null : bm.id)}
              >
                <td className="px-4 py-3 text-white/80 font-medium">{label}</td>
                <td className="px-4 py-3 text-white/50 capitalize">
                  {bm.scope_value?.replace(/_/g, " ") || "—"}
                </td>
                <td className="px-4 py-3 text-right text-white/50">
                  {bm.sample_count}
                </td>
                <td className="px-4 py-3 text-right text-white font-medium">
                  {bm.median_value !== null
                    ? `${bm.median_value} ${unit}`
                    : "—"}
                </td>
                <td className="px-4 py-3 text-right text-white/60">
                  {bm.mean_value !== null ? `${bm.mean_value} ${unit}` : "—"}
                </td>
                <td className="px-4 py-3 text-right text-white/40 text-xs">
                  {bm.p25_value !== null && bm.p75_value !== null
                    ? `${bm.p25_value}–${bm.p75_value} ${unit}`
                    : "—"}
                </td>
                <td className="px-2 py-3">
                  {isExpanded ? (
                    <ChevronUp className="h-3.5 w-3.5 text-white/20" />
                  ) : (
                    <ChevronDown className="h-3.5 w-3.5 text-white/20" />
                  )}
                </td>
              </motion.tr>
            );
          })}
        </tbody>
      </table>
      {sorted.length === 0 && (
        <div className="text-center py-12 text-white/30 text-sm">
          No benchmarks match your filters
        </div>
      )}
    </div>
  );
}
