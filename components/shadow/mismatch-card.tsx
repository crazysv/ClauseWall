"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ChevronDown, Scale, AlertTriangle, DollarSign, Lightbulb } from "lucide-react";
import type { ContractMismatch, MismatchSeverity, MismatchType } from "@/types";

interface MismatchCardProps {
  mismatch: ContractMismatch;
  index: number;
}

const SEVERITY_STYLES: Record<MismatchSeverity, { border: string; badge: string; bg: string; label: string }> = {
  critical: { border: "border-l-red-500", badge: "bg-red-500/15 text-red-400", bg: "bg-red-500/5", label: "CRITICAL" },
  major: { border: "border-l-orange-500", badge: "bg-orange-500/15 text-orange-400", bg: "bg-orange-500/5", label: "MAJOR" },
  minor: { border: "border-l-yellow-500", badge: "bg-yellow-500/15 text-yellow-400", bg: "bg-yellow-500/5", label: "MINOR" },
  info: { border: "border-l-blue-500", badge: "bg-blue-500/15 text-blue-400", bg: "bg-blue-500/5", label: "INFO" },
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

const ENFORCEABILITY_LABELS: Record<string, { label: string; color: string }> = {
  strongly_enforceable: { label: "Strongly Enforceable", color: "text-green-400" },
  moderately_enforceable: { label: "Moderately Enforceable", color: "text-yellow-400" },
  weakly_enforceable: { label: "Weakly Enforceable", color: "text-orange-400" },
  not_enforceable: { label: "Not Enforceable", color: "text-red-400" },
  needs_legal_review: { label: "Needs Legal Review", color: "text-blue-400" },
};

export default function MismatchCard({ mismatch, index }: MismatchCardProps) {
  const [expanded, setExpanded] = useState(false);
  const severity = SEVERITY_STYLES[mismatch.severity] || SEVERITY_STYLES.info;
  const enforceability = ENFORCEABILITY_LABELS[mismatch.legal_significance?.enforceability] || ENFORCEABILITY_LABELS.needs_legal_review;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className={`rounded-xl border-l-4 ${severity.border} border border-white/5 bg-white/[0.02] overflow-hidden`}
    >
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full p-4 text-left hover:bg-white/[0.02] transition-colors"
      >
        <div className="flex items-center gap-2 flex-wrap mb-3">
          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${severity.badge}`}>
            {severity.label}
          </span>
          <span className="px-2 py-0.5 rounded text-[10px] bg-white/5 text-white/50">
            {TYPE_LABELS[mismatch.mismatch_type] || mismatch.mismatch_type}
          </span>
          {mismatch.clause_number && (
            <span className="px-2 py-0.5 rounded text-[10px] bg-white/5 text-white/50">
              Clause {mismatch.clause_number}
            </span>
          )}
          <ChevronDown className={`w-4 h-4 text-white/30 ml-auto transition-transform ${expanded ? "rotate-180" : ""}`} />
        </div>

        {/* Promise vs Contract */}
        <div className="space-y-2">
          <div className="p-3 rounded-lg bg-amber-500/5 border border-amber-500/10">
            <p className="text-[10px] text-amber-400/70 font-medium uppercase mb-1">💬 Promise</p>
            <p className="text-sm text-amber-200/90">&ldquo;{mismatch.promise_says}&rdquo;</p>
            <p className="text-xs text-white/30 mt-1">— {mismatch.promise.promised_by}{mismatch.promise.date ? `, ${mismatch.promise.date}` : ""}</p>
          </div>

          <div className="flex items-center justify-center">
            <span className="text-xs text-white/20 font-bold">⚡ vs</span>
          </div>

          <div className="p-3 rounded-lg bg-slate-500/5 border border-slate-500/10">
            <p className="text-[10px] text-slate-400/70 font-medium uppercase mb-1">📄 Contract</p>
            <p className="text-sm text-slate-200/90">&ldquo;{mismatch.contract_says}&rdquo;</p>
          </div>
        </div>
      </button>

      {/* Expanded Details */}
      {expanded && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="px-4 pb-4 space-y-3 border-t border-white/5"
        >
          {/* Explanation */}
          <div className="pt-3">
            <p className="text-xs text-white/40 flex items-center gap-1 mb-1">
              <AlertTriangle className="w-3 h-3" /> What this means
            </p>
            <p className="text-sm text-white/70">{mismatch.explanation}</p>
          </div>

          {/* Financial Impact */}
          {(mismatch.financial_impact || mismatch.financial_description) && (
            <div className="p-3 rounded-lg bg-red-500/5 border border-red-500/10">
              <p className="text-xs text-red-400/70 flex items-center gap-1 mb-1">
                <DollarSign className="w-3 h-3" /> Financial Impact
              </p>
              <p className="text-sm text-red-300">
                {mismatch.financial_impact ? `₹${mismatch.financial_impact.toLocaleString("en-IN")}` : ""}
                {mismatch.financial_description && ` — ${mismatch.financial_description}`}
              </p>
            </div>
          )}

          {/* Legal Status */}
          {mismatch.legal_significance && (
            <div className="p-3 rounded-lg bg-blue-500/5 border border-blue-500/10">
              <p className="text-xs text-blue-400/70 flex items-center gap-1 mb-1">
                <Scale className="w-3 h-3" /> Legal Status: <span className={enforceability.color}>{enforceability.label}</span>
              </p>
              {mismatch.legal_significance.reasoning && (
                <p className="text-xs text-white/50 mt-1">{mismatch.legal_significance.reasoning}</p>
              )}
              {mismatch.legal_significance.evidence_strength && (
                <p className="text-xs text-white/40 mt-1">{mismatch.legal_significance.evidence_strength}</p>
              )}
              {mismatch.legal_significance.applicable_laws.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {mismatch.legal_significance.applicable_laws.map((law, i) => (
                    <span key={i} className="px-1.5 py-0.5 rounded text-[9px] bg-blue-500/10 text-blue-300">
                      {law.act} {law.section}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Recommendation */}
          {mismatch.recommendation && (
            <div className="p-3 rounded-lg bg-green-500/5 border border-green-500/10">
              <p className="text-xs text-green-400/70 flex items-center gap-1 mb-1">
                <Lightbulb className="w-3 h-3" /> What to do
              </p>
              <p className="text-sm text-green-200/80">{mismatch.recommendation}</p>
            </div>
          )}
        </motion.div>
      )}
    </motion.div>
  );
}
