"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Filter, ArrowUpDown } from "lucide-react";
import { DeliberationPanel } from "./deliberation-panel";
import type {
  DeliberationResult,
  DeliberationVerdict,
  ClauseDeliberation,
} from "@/lib/deliberation/types";

// ============================================
// PROPS
// ============================================

interface DocumentDeliberationProps {
  result: DeliberationResult;
  onClauseClick?: (index: number) => void;
}

// ============================================
// VERDICT CONFIG
// ============================================

const verdictConfig: Record<
  string,
  { bg: string; border: string; text: string; emoji: string; label: string }
> = {
  fair: {
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/20",
    text: "text-emerald-400",
    emoji: "✅",
    label: "Fair",
  },
  partially_fair: {
    bg: "bg-amber-500/10",
    border: "border-amber-500/20",
    text: "text-amber-400",
    emoji: "⚠️",
    label: "Partial",
  },
  unfair: {
    bg: "bg-red-500/10",
    border: "border-red-500/20",
    text: "text-red-400",
    emoji: "❌",
    label: "Unfair",
  },
  illegal: {
    bg: "bg-indigo-500/10",
    border: "border-indigo-500/20",
    text: "text-purple-400",
    emoji: "⛔",
    label: "Illegal",
  },
};

// ============================================
// SEVERITY ORDER
// ============================================

const severityOrder: Record<string, number> = {
  illegal: 0,
  unfair: 1,
  partially_fair: 2,
  fair: 3,
};

// ============================================
// COMPONENT
// ============================================

export function DocumentDeliberation({
  result,
  onClauseClick,
}: DocumentDeliberationProps) {
  const [expandedClause, setExpandedClause] = useState<number | null>(null);
  const [filter, setFilter] = useState<DeliberationVerdict | "all">("all");
  const [sortBy, setSortBy] = useState<"order" | "severity">("order");

  const { summary, deliberations } = result;

  // Filter + sort deliberations
  const filteredDeliberations = useMemo(() => {
    let items = [...deliberations];

    // Filter
    if (filter !== "all") {
      items = items.filter((d) => d.arbiterVerdict.verdict === filter);
    }

    // Sort
    if (sortBy === "severity") {
      items.sort(
        (a, b) =>
          (severityOrder[a.arbiterVerdict.verdict] ?? 2) -
          (severityOrder[b.arbiterVerdict.verdict] ?? 2)
      );
    }

    return items;
  }, [deliberations, filter, sortBy]);

  const toggleClause = (index: number) => {
    setExpandedClause((prev) => (prev === index ? null : index));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-lg font-bold flex items-center gap-2 mb-1">
          <span>⚔️</span>
          Adversarial Deliberation Results
        </h3>
        <p className="text-xs text-slate-900 dark:text-slate-100">
          {summary.totalClauses} clauses debated by 3 AI agents
        </p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { count: summary.fairCount, ...verdictConfig.fair },
          { count: summary.partiallyFairCount, ...verdictConfig.partially_fair },
          { count: summary.unfairCount, ...verdictConfig.unfair },
          { count: summary.illegalCount, ...verdictConfig.illegal },
        ].map((item) => (
          <div
            key={item.label}
            className={`p-3 rounded-xl border text-center ${item.bg} ${item.border}`}
          >
            <p className={`text-xl font-bold ${item.text}`}>
              {item.count}
              {item.emoji}
            </p>
            <p className="text-[10px] text-slate-900 dark:text-slate-100">{item.label}</p>
          </div>
        ))}
      </div>

      {/* Stats Row */}
      <div className="flex flex-wrap gap-6 text-xs text-slate-900 dark:text-slate-100">
        <span>
          Avg confidence:{" "}
          <strong className="text-slate-900 dark:text-slate-100">
            {Math.round(summary.averageConfidence * 100)}%
          </strong>
        </span>
        {summary.mostContestedClause !== "N/A" && (
          <span>
            Most contested:{" "}
            <strong className="text-amber-400/80">
              Clause {summary.mostContestedIndex + 1}
            </strong>
          </span>
        )}
      </div>

      {/* Filter + Sort Controls */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5">
          <Filter className="h-3 w-3 text-slate-900 dark:text-slate-100" />
          {(
            [
              { value: "all", label: "All" },
              { value: "fair", label: "✅ Fair" },
              { value: "partially_fair", label: "⚠️ Partial" },
              { value: "unfair", label: "❌ Unfair" },
              { value: "illegal", label: "⛔ Illegal" },
            ] as const
          ).map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`text-[10px] px-2 py-1 rounded-md border transition-colors ${ filter === f.value ? "bg-white dark:bg-card/10 border-white/20 text-slate-900 dark:text-slate-100" : "bg-white dark:bg-card shadow-sm dark:shadow-slate-900/20 border-l-4 border-indigo-500 border-white/5 text-slate-900 dark:text-slate-100 hover:text-slate-900 dark:text-slate-100" }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        <button
          onClick={() => setSortBy((s) => (s === "order" ? "severity" : "order"))}
          className="flex items-center gap-1 text-[10px] text-slate-900 dark:text-slate-100 hover:text-slate-900 dark:text-slate-100 transition-colors ml-auto"
        >
          <ArrowUpDown className="h-3 w-3" />
          {sortBy === "order" ? "By order" : "By severity"}
        </button>
      </div>

      {/* Clause Deliberation List */}
      <div className="space-y-2">
        {filteredDeliberations.map((delib, i) => {
          const v =
            verdictConfig[delib.arbiterVerdict.verdict] ||
            verdictConfig.partially_fair;
          const isExpanded = expandedClause === i;
          const clauseNum = (delib.clauseIndex ?? i) + 1;
          const previewText = delib.clauseText.substring(0, 50);

          return (
            <div key={delib.id} className="rounded-xl border border-white/8 overflow-hidden">
              {/* Clause Header (clickable) */}
              <button
                onClick={() => toggleClause(i)}
                className="w-full flex items-center justify-between p-3 hover:bg-white dark:bg-card shadow-sm dark:shadow-slate-900/20 border-l-4 border-indigo-500 transition-colors text-left"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-xs text-slate-900 dark:text-slate-100 font-mono shrink-0">
                    #{clauseNum}
                  </span>
                  <span className="text-xs text-slate-900 dark:text-slate-100 truncate">
                    {previewText}
                    {delib.clauseText.length > 50 ? "..." : ""}
                  </span>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-2">
                  <span className={`text-[10px] font-bold ${v.text}`}>
                    {v.emoji} {v.label.toUpperCase()}
                  </span>
                  <ChevronDown
                    className={`h-3.5 w-3.5 text-slate-900 dark:text-slate-100 transition-transform ${ isExpanded ? "rotate-180" : "" }`}
                  />
                </div>
              </button>

              {/* Expanded Content */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25 }}
                    className="overflow-hidden"
                  >
                    <div className="p-3 pt-0 border-t border-white/5">
                      {/* Clause text */}
                      <div className="p-2.5 rounded-md bg-white dark:bg-slate-900/[0.03] border border-white/5 mb-3 mt-2">
                        <p className="text-xs text-slate-900 dark:text-slate-100 leading-relaxed">
                          &ldquo;{delib.clauseText}&rdquo;
                        </p>
                      </div>

                      {/* Full deliberation panel */}
                      <DeliberationPanel
                        deliberation={delib}
                        compact
                      />

                      {/* Jump to clause button */}
                      {onClauseClick && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onClauseClick(delib.clauseIndex ?? i);
                          }}
                          className="mt-3 text-[10px] text-blue-400 hover:text-blue-300 transition-colors"
                        >
                          Jump to clause #{clauseNum} in document →
                        </button>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}

        {filteredDeliberations.length === 0 && (
          <div className="text-center py-8 text-xs text-slate-900 dark:text-slate-100">
            No {filter !== "all" ? filter.replace("_", " ") : ""} clauses found.
            <button
              onClick={() => setFilter("all")}
              className="text-blue-400 ml-1 hover:underline"
            >
              Show all
            </button>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="text-[10px] text-slate-900 dark:text-slate-100 pt-3 border-t border-white/5">
        Total deliberation time: {(result.totalDuration / 1000).toFixed(1)}s ·
        Completed at{" "}
        {new Date(result.completedAt).toLocaleString()}
      </div>
    </div>
  );
}
