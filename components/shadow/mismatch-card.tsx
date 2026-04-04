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
    border: "border-red-600",
    badge: "bg-red-600 text-white",
    bg: "bg-red-100",
    label: "CRITICAL",
  },
  major: {
    border: "border-orange-500",
    badge: "bg-orange-500 text-white",
    bg: "bg-orange-100",
    label: "MAJOR",
  },
  minor: {
    border: "border-yellow-500",
    badge: "bg-yellow-400 text-black",
    bg: "bg-yellow-100",
    label: "MINOR",
  },
  info: {
    border: "border-blue-500",
    badge: "bg-blue-600 text-white",
    bg: "bg-blue-100",
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
      color: "text-green-700 bg-green-200 border-green-600",
    },
    moderately_enforceable: {
      label: "Moderately Enforceable",
      color: "text-yellow-700 bg-yellow-200 border-yellow-600",
    },
    weakly_enforceable: {
      label: "Weakly Enforceable",
      color: "text-orange-700 bg-orange-200 border-orange-600",
    },
    not_enforceable: {
      label: "Not Enforceable",
      color: "text-red-700 bg-red-200 border-red-600",
    },
    needs_legal_review: {
      label: "Needs Legal Review",
      color: "text-blue-700 bg-blue-200 border-blue-600",
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
      className={`border-4 border-black ${severity.bg} shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-y-1 hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all overflow-hidden flex flex-col`}
    >
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full p-4 text-left border-l-8 transition-colors flex-1"
        style={{ borderLeftColor: severity.border.replace("border-", "") }}
      >
        <div className="flex items-center gap-3 flex-wrap mb-4">
          <span
            className={`px-2 py-1 text-xs font-black uppercase tracking-widest border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] ${severity.badge}`}
          >
            {severity.label}
          </span>
          <span className="px-2 py-1 text-xs font-black uppercase tracking-widest bg-white border-2 border-black text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
            {TYPE_LABELS[mismatch.mismatch_type] || mismatch.mismatch_type}
          </span>
          {mismatch.clause_number && (
            <span className="px-2 py-1 text-xs font-black uppercase tracking-widest bg-gray-200 border-2 border-black text-black">
              Clause {mismatch.clause_number}
            </span>
          )}
          <div className="ml-auto bg-white border-2 border-black p-1 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
            <ChevronDown
              className={`w-5 h-5 text-black transition-transform ${expanded ? "rotate-180" : ""}`}
            />
          </div>
        </div>

        {/* Promise vs Contract */}
        <div className="space-y-4">
          <div className="p-4 bg-white border-4 border-black border-dashed shadow-[inset_4px_4px_0px_0px_rgba(0,0,0,0.05)]">
            <p className="text-xs text-black font-black uppercase tracking-widest mb-2 bg-yellow-200 inline-block px-1 border-2 border-black">
              💬 Promise
            </p>
            <p className="text-base font-bold text-black leading-snug">
              &ldquo;{mismatch.promise_says}&rdquo;
            </p>
            <p className="text-xs font-black uppercase tracking-widest text-black/60 mt-3">
              — {mismatch.promise.promised_by}
              {mismatch.promise.date ? `, ${mismatch.promise.date}` : ""}
            </p>
          </div>

          <div className="flex items-center justify-center">
            <span className="text-sm text-white font-black uppercase tracking-widest bg-black px-3 py-1 border-2 border-black">
              ⚡ VS
            </span>
          </div>

          <div className="p-4 bg-gray-800 border-4 border-black text-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <p className="text-xs text-black bg-white inline-block px-1 border-2 border-black font-black uppercase tracking-widest mb-2">
              📄 Contract
            </p>
            <p className="text-base font-bold leading-snug">
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
          className="px-4 pb-4 space-y-4 border-t-4 border-black bg-white pt-4"
        >
          {/* Explanation */}
          <div className="p-4 bg-gray-100 border-4 border-black">
            <p className="text-xs text-black font-black uppercase tracking-widest flex items-center gap-2 mb-2">
              <AlertTriangle className="w-4 h-4" /> What this means
            </p>
            <p className="text-sm font-bold text-black/80">
              {mismatch.explanation}
            </p>
          </div>

          {/* Financial Impact */}
          {(mismatch.financial_impact || mismatch.financial_description) && (
            <div className="p-4 bg-red-100 border-4 border-red-600 shadow-[4px_4px_0px_0px_rgba(220,38,38,1)]">
              <p className="text-xs text-red-900 font-black uppercase tracking-widest flex items-center gap-2 mb-2">
                <DollarSign className="w-4 h-4" /> Financial Impact
              </p>
              <p className="text-sm font-bold text-red-800">
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
            <div className="p-4 bg-blue-50 border-4 border-blue-600 shadow-[4px_4px_0px_0px_rgba(37,99,235,1)]">
              <div className="flex flex-wrap items-center gap-2 mb-3 border-b-2 border-blue-600 pb-2">
                <Scale className="w-4 h-4 text-blue-900" />
                <span className="text-xs text-blue-900 font-black uppercase tracking-widest">
                  Legal Status:
                </span>
                <span
                  className={`px-2 py-1 text-xs font-black uppercase tracking-widest border-2 shadow-[2px_2px_0px_0px_rgba(0,0,0,0.2)] ${enforceability.color}`}
                >
                  {enforceability.label}
                </span>
              </div>
              {mismatch.legal_significance.reasoning && (
                <p className="text-sm font-bold text-blue-900 mb-2">
                  {mismatch.legal_significance.reasoning}
                </p>
              )}
              {mismatch.legal_significance.evidence_strength && (
                <p className="text-xs font-black uppercase tracking-widest text-blue-800 bg-blue-200 inline-block px-2 py-1 border-2 border-blue-400 mb-2">
                  {mismatch.legal_significance.evidence_strength}
                </p>
              )}
              {mismatch.legal_significance.applicable_laws.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {mismatch.legal_significance.applicable_laws.map((law, i) => (
                    <span
                      key={i}
                      className="px-2 py-1 border-2 border-blue-900 text-xs font-black uppercase tracking-widest bg-white text-blue-900"
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
            <div className="p-4 bg-green-100 border-4 border-green-600 shadow-[4px_4px_0px_0px_rgba(22,163,74,1)]">
              <p className="text-xs text-green-900 font-black uppercase tracking-widest flex items-center gap-2 mb-2">
                <Lightbulb className="w-4 h-4" /> What to do
              </p>
              <p className="text-sm font-bold text-green-900">
                {mismatch.recommendation}
              </p>
            </div>
          )}
        </motion.div>
      )}
    </motion.div>
  );
}
