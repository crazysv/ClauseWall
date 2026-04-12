"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  ChevronDown,
  Scale,
  AlertTriangle,
  DollarSign,
  Lightbulb,
} from "lucide-react";
import type { ContractMismatch, MismatchSeverity, MismatchType } from "@/types";

interface MismatchCardProps {
  mismatch: ContractMismatch;
  index: number;
}

const SEVERITY_STYLES: Record<
  MismatchSeverity,
  { border: string; badge: string; bg: string; label: string }
> = {
  critical: {
    border: "border-red-500",
    badge: "text-red-400 bg-red-950/20 border border-red-900/50",
    bg: "border-l-2 border-l-red-500",
    label: "CRITICAL",
  },
  major: {
    border: "border-amber-500",
    badge: "text-amber-400 bg-amber-950/20 border border-amber-900/50",
    bg: "border-l-2 border-l-amber-500",
    label: "MAJOR",
  },
  minor: {
    border: "border-amber-400",
    badge: "text-amber-300 bg-amber-950/10 border border-amber-900/30",
    bg: "border-l-2 border-l-amber-400",
    label: "MINOR",
  },
  info: {
    border: "border-cyan-500",
    badge: "text-cyan-400 bg-cyan-950/20 border border-cyan-900/50",
    bg: "border-l-2 border-l-cyan-500",
    label: "INFO",
  },
};

const TYPE_LABELS: Record<MismatchType, string> = {
  direct_contradiction: "Direct Contradiction",
  missing_promise: "Missing Promise",
  weakened_promise: "Weakened Promise",
  hidden_condition: "Hidden Condition",
  amount_mismatch: "Amount Mismatch",
  timeline_mismatch: "Timeline Mismatch",
  scope_mismatch: "Scope Mismatch",
};

const ENFORCEABILITY_LABELS: Record<string, { label: string; color: string }> =
  {
    strongly_enforceable: {
      label: "Strongly Enforceable",
      color: "text-emerald-400 bg-emerald-950/20 border-emerald-900/50",
    },
    moderately_enforceable: {
      label: "Moderately Enforceable",
      color: "text-amber-400 bg-amber-950/20 border-amber-900/50",
    },
    weakly_enforceable: {
      label: "Weakly Enforceable",
      color: "text-amber-500 bg-amber-950/20 border-amber-900/50",
    },
    not_enforceable: {
      label: "Not Enforceable",
      color: "text-red-400 bg-red-950/20 border-red-900/50",
    },
    needs_legal_review: {
      label: "Needs Legal Review",
      color: "text-cyan-400 bg-cyan-950/20 border-cyan-900/50",
    },
  };

export default function MismatchCard({ mismatch, index }: MismatchCardProps) {
  const [expanded, setExpanded] = useState(false);
  const severity = SEVERITY_STYLES[mismatch.severity] || SEVERITY_STYLES.info;
  const enforceability =
    ENFORCEABILITY_LABELS[mismatch.legal_significance?.enforceability] ||
    ENFORCEABILITY_LABELS.needs_legal_review;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className={`border border-neutral-900 bg-[#0a0a0a] ${severity.bg} hover:border-neutral-700 transition-colors overflow-hidden flex flex-col`}
    >
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full p-4 text-left flex-1"
      >
        <div className="flex items-center gap-2 flex-wrap mb-3">
          <span
            className={`px-1.5 py-0.5 text-[7px] font-mono uppercase tracking-widest ${severity.badge}`}
          >
            {severity.label}
          </span>
          <span className="px-1.5 py-0.5 text-[7px] font-mono uppercase tracking-widest text-neutral-400 border border-neutral-800 bg-[#050505]">
            {TYPE_LABELS[mismatch.mismatch_type] || mismatch.mismatch_type}
          </span>
          {mismatch.clause_number && (
            <span className="px-1.5 py-0.5 text-[7px] font-mono uppercase tracking-widest text-neutral-500 border border-neutral-800 bg-[#050505]">
              CLAUSE {mismatch.clause_number}
            </span>
          )}
          <div className="ml-auto">
            <ChevronDown
              className={`w-3.5 h-3.5 text-neutral-600 transition-transform ${expanded ? "rotate-180" : ""}`}
            />
          </div>
        </div>

        {/* Promise vs Contract */}
        <div className="space-y-3">
          <div className="p-3 border border-dashed border-neutral-800 bg-[#050505]">
            <p className="text-[7px] font-mono uppercase tracking-widest text-amber-400 mb-1.5">
              💬 PROMISE
            </p>
            <p className="text-[10px] font-mono text-neutral-300 leading-relaxed">
              &ldquo;{mismatch.promise_says}&rdquo;
            </p>
            <p className="text-[7px] font-mono uppercase tracking-widest text-neutral-600 mt-2">
              — {mismatch.promise.promised_by}
              {mismatch.promise.date ? `, ${mismatch.promise.date}` : ""}
            </p>
          </div>

          <div className="flex items-center justify-center">
            <span className="text-[7px] font-mono uppercase tracking-widest text-red-400 px-2 py-0.5 border border-red-900/50 bg-red-950/20">
              ⚡ VS
            </span>
          </div>

          <div className="p-3 border border-neutral-800 bg-[#050505]">
            <p className="text-[7px] font-mono uppercase tracking-widest text-cyan-400 mb-1.5">
              📄 CONTRACT
            </p>
            <p className="text-[10px] font-mono text-neutral-300 leading-relaxed">
              &ldquo;{mismatch.contract_says}&rdquo;
            </p>
          </div>
        </div>
      </button>

      {/* Expanded Details */}
      {expanded && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="px-4 pb-4 space-y-3 border-t border-neutral-800 pt-3"
        >
          {/* Explanation */}
          <div className="p-3 border border-neutral-800 bg-[#050505]">
            <p className="text-[8px] font-mono uppercase tracking-widest text-neutral-400 flex items-center gap-2 mb-2">
              <AlertTriangle className="w-3 h-3" /> WHAT THIS MEANS
            </p>
            <p className="text-[9px] font-mono text-neutral-500 leading-relaxed">
              {mismatch.explanation}
            </p>
          </div>

          {/* Financial Impact */}
          {(mismatch.financial_impact || mismatch.financial_description) && (
            <div className="p-3 border-l-2 border-red-500 bg-red-950/20">
              <p className="text-[8px] font-mono uppercase tracking-widest text-red-400 flex items-center gap-2 mb-2">
                <DollarSign className="w-3 h-3" /> FINANCIAL IMPACT
              </p>
              <p className="text-[9px] font-mono text-red-300/70 leading-relaxed">
                {mismatch.financial_impact
                  ? `₹${mismatch.financial_impact.toLocaleString("en-IN")}`
                  : ""}
                {mismatch.financial_description &&
                  ` — ${mismatch.financial_description}`}
              </p>
            </div>
          )}

          {/* Legal Status */}
          {mismatch.legal_significance && (
            <div className="p-3 border-l-2 border-cyan-500 bg-cyan-950/20">
              <div className="flex flex-wrap items-center gap-2 mb-2 border-b border-neutral-800 pb-2">
                <Scale className="w-3 h-3 text-cyan-400" />
                <span className="text-[8px] font-mono uppercase tracking-widest text-cyan-400">
                  LEGAL STATUS:
                </span>
                <span
                  className={`px-1.5 py-0.5 text-[7px] font-mono uppercase tracking-widest border ${enforceability.color}`}
                >
                  {enforceability.label}
                </span>
              </div>
              {mismatch.legal_significance.reasoning && (
                <p className="text-[9px] font-mono text-neutral-500 leading-relaxed mb-2">
                  {mismatch.legal_significance.reasoning}
                </p>
              )}
              {mismatch.legal_significance.evidence_strength && (
                <span className="text-[7px] font-mono uppercase tracking-widest text-cyan-400 px-1.5 py-0.5 border border-cyan-900/50 bg-cyan-950/10 inline-block mb-2">
                  {mismatch.legal_significance.evidence_strength}
                </span>
              )}
              {mismatch.legal_significance.applicable_laws.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {mismatch.legal_significance.applicable_laws.map((law, i) => (
                    <span
                      key={i}
                      className="px-1.5 py-0.5 border border-neutral-800 text-[7px] font-mono uppercase tracking-widest bg-[#050505] text-neutral-400"
                    >
                      {law.act} {law.section}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Recommendation */}
          {mismatch.recommendation && (
            <div className="p-3 border-l-2 border-emerald-500 bg-emerald-950/20">
              <p className="text-[8px] font-mono uppercase tracking-widest text-emerald-400 flex items-center gap-2 mb-2">
                <Lightbulb className="w-3 h-3" /> WHAT TO DO
              </p>
              <p className="text-[9px] font-mono text-emerald-300/70 leading-relaxed">
                {mismatch.recommendation}
              </p>
            </div>
          )}
        </motion.div>
      )}
    </motion.div>
  );
}
