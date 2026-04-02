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
  critical: { border: "border-l-red-500", badge: "bg-red-100/90 text-red-700", bg: "bg-red-50", label: "CRITICAL" },
  major: { border: "border-l-orange-500", badge: "bg-orange-100/90 text-orange-700", bg: "bg-orange-50", label: "MAJOR" },
  minor: { border: "border-l-amber-500", badge: "bg-amber-100/90 text-amber-700", bg: "bg-amber-50", label: "MINOR" },
  info: { border: "border-l-indigo-500", badge: "bg-indigo-100/90 text-indigo-700", bg: "bg-indigo-50", label: "INFO" },
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
  strongly_enforceable: { label: "Strongly Enforceable", color: "text-emerald-700 font-bold tracking-tight" },
  moderately_enforceable: { label: "Moderately Enforceable", color: "text-amber-700 font-bold tracking-tight" },
  weakly_enforceable: { label: "Weakly Enforceable", color: "text-orange-700 font-bold tracking-tight" },
  not_enforceable: { label: "Not Enforceable", color: "text-red-700 font-bold tracking-tight" },
  needs_legal_review: { label: "Needs Legal Review", color: "text-indigo-700 font-bold tracking-tight" },
};

export function MismatchCard({ mismatch, index }: MismatchCardProps) {
  const [expanded, setExpanded] = useState(false);
  const severity = SEVERITY_STYLES[mismatch.severity] || SEVERITY_STYLES.info;
  const enforceability = ENFORCEABILITY_LABELS[mismatch.legal_significance?.enforceability] || ENFORCEABILITY_LABELS.needs_legal_review;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className={`rounded-2xl border-l-[6px] ${severity.border} border border-slate-200 dark:border-slate-700 bg-white dark:bg-card shadow-sm dark:shadow-slate-900/20 overflow-hidden mb-4 hover:border-r-indigo-100 hover:shadow-md transition-all`}
    >
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full p-4 sm:p-5 text-left hover:bg-slate-50 dark:hover:bg-slate-800 dark:bg-slate-800 transition-colors focus:outline-none"
      >
        <div className="flex items-center gap-2 flex-wrap mb-4">
          <span className={`px-2 py-0.5 rounded-md border-none text-[10px] shadow-sm dark:shadow-slate-900/20 font-bold uppercase tracking-widest ${severity.badge}`}>
            {severity.label}
          </span>
          <span className="px-2.5 py-0.5 rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 shadow-sm dark:shadow-slate-900/20 text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
            {TYPE_LABELS[mismatch.mismatch_type] || mismatch.mismatch_type}
          </span>
          {mismatch.clause_number && (
            <span className="px-2.5 py-0.5 rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 shadow-sm dark:shadow-slate-900/20 text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
              Clause {mismatch.clause_number}
            </span>
          )}
          <div className={`ml-auto p-1.5 rounded-full border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 transition-transform shadow-sm dark:shadow-slate-900/20 ${expanded ? "rotate-180 bg-slate-100" : ""}`}>
            <ChevronDown className="w-4 h-4 text-slate-400" />
          </div>
        </div>

        {/* Promise vs Contract */}
        <div className="space-y-0 text-sm relative">
          <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 shadow-sm dark:shadow-slate-900/20 relative z-0">
            <p className="text-[10px] text-amber-700 font-bold uppercase tracking-widest mb-2 flex items-center gap-1.5">
              <span className="text-sm drop-shadow-sm dark:shadow-slate-900/20">💬</span> Promise
            </p>
            <p className="text-sm font-medium text-amber-900 leading-relaxed pl-5 border-l-2 border-amber-200/60">&ldquo;{mismatch.promise_says}&rdquo;</p>
            <p className="text-[10px] font-bold uppercase tracking-widest text-amber-700/60 mt-3 flex justify-end">
              — {mismatch.promise.promised_by}{mismatch.promise.date ? `, ${mismatch.promise.date}` : ""}
            </p>
          </div>

          <div className="flex items-center justify-center -mt-3.5 -mb-3.5 z-10 relative pointer-events-none">
            <span className="text-[10px] border border-slate-200 dark:border-slate-700 shadow-sm dark:shadow-slate-900/20 text-slate-500 dark:text-slate-400 font-black uppercase tracking-widest bg-white dark:bg-card px-2.5 py-0.5 rounded-full inline-flex items-center gap-1 text-center justify-center">
              <span className="text-yellow-500 drop-shadow-sm dark:shadow-slate-900/20 text-xs">⚡</span> vs
            </span>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm dark:shadow-slate-900/20 relative z-0">
            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest mb-2 flex items-center gap-1.5">
              <span className="text-sm">📄</span> Contract
            </p>
            <p className="text-sm font-medium text-slate-700 leading-relaxed pl-5 border-l-2 border-slate-200 dark:border-slate-700">&ldquo;{mismatch.contract_says}&rdquo;</p>
          </div>
        </div>
      </button>

      {/* Expanded Details */}
      {expanded && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="px-5 pb-5 space-y-4 border-t border-slate-100"
        >
          {/* Explanation */}
          <div className="pt-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 flex items-center gap-1.5 mb-2">
              <AlertTriangle className="w-3.5 h-3.5" /> What this means
            </p>
            <p className="text-sm font-medium text-slate-700 leading-relaxed p-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-100 rounded-xl shadow-inner">{mismatch.explanation}</p>
          </div>

          {/* Financial Impact */}
          {(mismatch.financial_impact || mismatch.financial_description) && (
            <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 shadow-sm dark:shadow-slate-900/20">
              <p className="text-[10px] font-bold uppercase tracking-widest text-red-500 flex items-center gap-1.5 mb-1.5">
                <DollarSign className="w-3.5 h-3.5" /> Financial Impact
              </p>
              <p className="text-sm font-bold text-red-800">
                {mismatch.financial_impact ? `₹${mismatch.financial_impact.toLocaleString("en-IN")}` : ""}
                {mismatch.financial_description && ` — ${mismatch.financial_description}`}
              </p>
            </div>
          )}

          {/* Legal Status */}
          {mismatch.legal_significance && (
            <div className="p-4 rounded-xl bg-indigo-50 border border-indigo-200 shadow-sm dark:shadow-slate-900/20 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-indigo-100/50 to-transparent pointer-events-none" />
              <p className="text-[10px] font-bold uppercase tracking-widest text-indigo-500 flex items-center gap-1.5 mb-2">
                <Scale className="w-3.5 h-3.5" /> Legal Status: <span className={enforceability.color}>{enforceability.label}</span>
              </p>
              {mismatch.legal_significance.reasoning && (
                <p className="text-sm font-medium text-slate-700 mt-1 leading-relaxed border-l-2 border-indigo-200 pl-3">{mismatch.legal_significance.reasoning}</p>
              )}
              {mismatch.legal_significance.evidence_strength && (
                <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mt-2 uppercase tracking-wide">Evidence: {mismatch.legal_significance.evidence_strength}</p>
              )}
              {mismatch.legal_significance.applicable_laws.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {mismatch.legal_significance.applicable_laws.map((law, i) => (
                    <span key={i} className="px-2.5 py-1 rounded bg-indigo-100/60 font-bold uppercase tracking-tight text-[10px] text-indigo-800 border border-indigo-200 shadow-sm dark:shadow-slate-900/20 font-mono">
                      {law.act} §{law.section}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Recommendation */}
          {mismatch.recommendation && (
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 shadow-sm dark:shadow-slate-900/20 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-emerald-100/50 to-transparent pointer-events-none" />
              <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-600 flex items-center gap-1.5 mb-2">
                <Lightbulb className="w-3.5 h-3.5" /> What to do
              </p>
              <p className="text-sm font-black text-emerald-900 tracking-tight leading-relaxed">{mismatch.recommendation}</p>
            </div>
          )}
        </motion.div>
      )}
    </motion.div>
  );
}
