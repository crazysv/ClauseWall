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
    { value: "all", label: "All", count: clauses.length },
    {
      value: "illegal",
      label: "Illegal",
      count: document.illegal_count,
      color: "text-purple-400",
    },
    {
      value: "dangerous",
      label: "Dangerous",
      count: document.dangerous_count,
      color: "text-red-400",
    },
    {
      value: "warning",
      label: "Warning",
      count: document.warning_count,
      color: "text-yellow-400",
    },
    {
      value: "safe",
      label: "Safe",
      count: document.safe_count,
      color: "text-green-400",
    },
  ];

  return (
    <div id="clause-list">
      {/* Clause Header + Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <h2 className="font-space text-lg font-bold text-[#fafafa] tracking-wide uppercase">
          Clause Analysis
        </h2>
        <div className="flex items-center gap-1.5 flex-wrap">
          {filters.map((filter) => (
            <button
              key={filter.value}
              onClick={() => onSetFilterRisk(filter.value)}
              className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all ${
                filterRisk === filter.value
                  ? "bg-[#fafafa] text-[#0a0a0a]"
                  : "bg-[#171717] border border-[#262626] text-[#a3a3a3] hover:border-[#404040] hover:text-[#fafafa]"
              }`}
            >
              <span
                className={
                  filterRisk === filter.value
                    ? "text-[#0a0a0a]"
                    : filter.color
                }
              >
                {filter.count}
              </span>{" "}
              {filter.label}
            </button>
          ))}

          <span className="text-foreground/20 mx-1">|</span>

          <button
            onClick={() => onSetSortByRisk(!sortByRisk)}
            className="text-[10px] text-foreground/50 hover:text-foreground transition-colors font-medium"
            aria-label="Toggle sort order"
          >
            {sortByRisk ? "↕ By order" : "↕ By risk"}
          </button>

          <span className="text-foreground/20">|</span>

          <button
            onClick={onExpandAll}
            className="text-[10px] text-foreground/50 hover:text-foreground transition-colors font-medium"
          >
            Expand All
          </button>
          <button
            onClick={onCollapseAll}
            className="text-[10px] text-foreground/50 hover:text-foreground transition-colors font-medium"
          >
            Collapse All
          </button>
        </div>
      </div>

      {/* Sort indicator */}
      {sortByRisk && (
        <p className="text-[10px] text-foreground/40 mb-3 font-medium">
          Sorted by risk level — most critical first
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
