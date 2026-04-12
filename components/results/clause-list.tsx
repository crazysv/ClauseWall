"use client";

import React, { RefObject } from "react";
import { motion } from "framer-motion";
import ClauseCard from "@/components/results/clause-card";
import type { Document as DocType } from "@/types";
import type { ClauseDeliberation } from "@/lib/deliberation/types";

interface HybridClause {
  id: string;
  document_id: string;
  clause_number: number;
  original_text: string;
  clause_type: string;
  risk_level: string;
  risk_score: number;
  explanation: string;
  legal_issue: string | null;
  legal_citation: string | null;
  statute_code: string | null;
  fair_alternative: string | null;
  red_flags: string[];
  percentile: number | null;
  created_at: string;
  extracted_value: number | null;
  extracted_unit: string | null;
  verification_source?: "database" | "ai";
  confidence?: "verified" | "partial" | "ai_suggested";
  matched_rule_id?: string | null;
  negotiation_script?: string | null;
  penalty_info?: string | null;
  community_match?: string | null;
  proof_data?: string | null;
}

interface ClauseListProps {
  document: DocType;
  documentId: string;
  clauses: HybridClause[];
  filteredClauses: HybridClause[];
  expandedClauses: Set<string>;
  filterRisk: string;
  sortByRisk: boolean;
  isRoastMode: boolean;
  roastCache: Map<string, string>;
  clauseListRef: RefObject<HTMLDivElement | null>;
  deliberationResult: { deliberations?: ClauseDeliberation[] } | null;
  onToggleClause: (id: string) => void;
  onSetFilterRisk: (risk: string) => void;
  onSetSortByRisk: (sort: boolean) => void;
  onExpandAll: () => void;
  onCollapseAll: () => void;
  onAutopsy: (clause: HybridClause) => void;
  onRewrite: (clause: HybridClause) => void;
  onDeepDive: (clause: unknown, tab: string) => void;
}

/**
 * Clause list component for the main column.
 * Contains filter bar, sort controls, and clause cards.
 */
export default function ClauseList({
  document,
  documentId,
  clauses,
  filteredClauses,
  expandedClauses,
  filterRisk,
  sortByRisk,
  isRoastMode,
  roastCache,
  clauseListRef,
  deliberationResult,
  onToggleClause,
  onSetFilterRisk,
  onSetSortByRisk,
  onExpandAll,
  onCollapseAll,
  onAutopsy,
  onRewrite,
  onDeepDive,
}: ClauseListProps) {
  const filters = [
    { value: "all", label: "ALL", count: clauses.length, color: "text-neutral-400" },
    {
      value: "illegal",
      label: "ILLEGAL",
      count: document.illegal_count,
      color: "text-red-600",
    },
    {
      value: "dangerous",
      label: "DANGEROUS",
      count: document.dangerous_count,
      color: "text-red-500",
    },
    {
      value: "warning",
      label: "WARNING",
      count: document.warning_count,
      color: "text-amber-500",
    },
    {
      value: "safe",
      label: "SAFE",
      count: document.safe_count,
      color: "text-emerald-500",
    },
  ];

  return (
    <div id="clause-list">
      {/* Clause Header + Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <h2 className="font-mono text-sm tracking-widest text-neutral-400 uppercase flex items-center gap-2">
          <span className="w-1.5 h-1.5 bg-cyan-500 rounded-sm"></span>
          ARRAY ANALYSIS
        </h2>
        <div className="flex items-center gap-1.5 flex-wrap">
          {filters.map((filter) => (
            <button
              key={filter.value}
              onClick={() => onSetFilterRisk(filter.value)}
              className={`px-3 py-1.5 text-[9px] font-mono uppercase tracking-widest rounded-sm border transition-all ${
                filterRisk === filter.value
                  ? "bg-neutral-200 border-neutral-400 text-[#0a0a0a] shadow-[0_0_10px_rgba(255,255,255,0.1)]"
                  : "bg-[#050505] border-neutral-800 text-neutral-500 hover:border-neutral-600 hover:text-neutral-300"
              }`}
            >
              <span
                className={
                  filterRisk === filter.value
                    ? "text-[#0a0a0a] font-bold"
                    : filter.color
                }
              >
                [{filter.count}]
              </span>{" "}
              {filter.label}
            </button>
          ))}

          <span className="text-neutral-800 mx-1">/</span>

          <button
            onClick={() => onSetSortByRisk(!sortByRisk)}
            className="text-[9px] font-mono tracking-widest uppercase text-neutral-500 hover:text-cyan-400 transition-colors"
            aria-label="Toggle sort order"
          >
            {sortByRisk ? "[SORT: DESCENDING]" : "[SORT: SEVERITY]"}
          </button>

          <span className="text-neutral-800">/</span>

          <button
            onClick={onExpandAll}
            className="text-[9px] font-mono tracking-widest uppercase text-neutral-500 hover:text-white transition-colors"
          >
            [EXPAND]
          </button>
          <button
            onClick={onCollapseAll}
            className="text-[9px] font-mono tracking-widest uppercase text-neutral-500 hover:text-white transition-colors"
          >
            [COLLAPSE]
          </button>
        </div>
      </div>

      {/* Sort indicator */}
      {sortByRisk && (
        <p className="text-[9px] font-mono tracking-widest uppercase text-cyan-600/70 mb-4 flex items-center gap-1.5">
          <span className="w-1 h-3 bg-cyan-600/50 block"></span>
          PRIORITIZING CRITICAL ANOMALIES
        </p>
      )}

      {/* Clause Cards */}
      <div className="space-y-3" ref={clauseListRef}>
        {filteredClauses.map((clause, index) => (
          <motion.div
            key={clause.id}
            data-clause-index={index}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.03 }}
          >
            <ClauseCard
              clause={clause}
              isExpanded={expandedClauses.has(clause.id)}
              onToggle={() => onToggleClause(clause.id)}
              jurisdiction={document.jurisdiction}
              documentType={document.document_type}
              onAutopsy={() => onAutopsy(clause)}
              onRewrite={() => onRewrite(clause)}
              isRoastMode={isRoastMode}
              roastText={roastCache.get(clause.id) || null}
              deliberation={
                deliberationResult?.deliberations?.find(
                  (d) =>
                    d.clauseIndex === clause.clause_number ||
                    d.clauseId === clause.id,
                ) || null
              }
              documentId={documentId}
              detectedLanguage={document.detected_language || undefined}
              onDeepDive={(c, tab) => onDeepDive(c, tab)}
            />
          </motion.div>
        ))}
      </div>

      {/* No results for filter */}
      {filteredClauses.length === 0 && (
        <div className="text-center py-12 text-foreground/50">
          <p className="text-sm">No {filterRisk} clauses found.</p>
          <button
            onClick={() => onSetFilterRisk("all")}
            className="text-xs text-[#a3a3a3] mt-2 hover:underline hover:text-[#fafafa] font-medium transition-colors"
          >
            Show all clauses
          </button>
        </div>
      )}
    </div>
  );
}
