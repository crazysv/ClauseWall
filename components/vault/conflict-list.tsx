"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertTriangle,
  Zap,
  ChevronDown,
  Scale,
  ShieldAlert,
  Lock,
  FileWarning,
  Clock,
  Banknote,
  CheckCircle2,
} from "lucide-react";
import type { CrossContractConflict, ConflictSeverity } from "@/types";

interface ConflictListProps {
  conflicts: CrossContractConflict[];
}

const SEVERITY_CONFIG: Record<
  ConflictSeverity,
  { color: string; bg: string; border: string; label: string }
> = {
  critical: {
    color: "text-red-500",
    bg: "bg-red-950/20",
    border: "border-red-900/50",
    label: "CRITICAL",
  },
  high: {
    color: "text-orange-500",
    bg: "bg-orange-950/20",
    border: "border-orange-900/50",
    label: "HIGH",
  },
  medium: {
    color: "text-amber-500",
    bg: "bg-amber-950/20",
    border: "border-amber-900/50",
    label: "MEDIUM",
  },
  low: {
    color: "text-cyan-500",
    bg: "bg-cyan-950/20",
    border: "border-cyan-900/50",
    label: "LOW",
  },
};

const CONFLICT_ICONS: Record<string, typeof AlertTriangle> = {
  direct_contradiction: AlertTriangle,
  obligation_overlap: Clock,
  ip_conflict: Lock,
  non_compete_clash: ShieldAlert,
  exclusivity_violation: FileWarning,
  jurisdiction_conflict: Scale,
  confidentiality_breach: Lock,
  time_commitment_impossible: Clock,
  financial_conflict: Banknote,
  termination_cascade: Zap,
  insurance_gap: ShieldAlert,
  coverage_overlap: FileWarning,
  other: AlertTriangle,
};

type FilterType = "all" | ConflictSeverity;

export default function ConflictList({ conflicts }: ConflictListProps) {
  const [filter, setFilter] = useState<FilterType>("all");
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const filtered =
    filter === "all"
      ? conflicts
      : conflicts.filter((c) => c.severity === filter);

  const counts = {
    all: conflicts.length,
    critical: conflicts.filter((c) => c.severity === "critical").length,
    high: conflicts.filter((c) => c.severity === "high").length,
    medium: conflicts.filter((c) => c.severity === "medium").length,
  };

  const toggleExpand = (id: string) => {
    const next = new Set(expandedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setExpandedIds(next);
  };

  if (conflicts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center border border-emerald-900/40 bg-emerald-950/10">
        <CheckCircle2 className="w-8 h-8 text-emerald-500 mb-4" />
        <h3 className="text-[10px] font-mono uppercase tracking-widest text-emerald-500 mb-2">
          [ NO_CONFLICTS_DETECTED ]
        </h3>
        <p className="text-[9px] font-mono uppercase tracking-widest text-neutral-600 max-w-md leading-relaxed">
          NO CONFLICTS WERE DETECTED BETWEEN YOUR CONTRACTS. YOUR
          AGREEMENTS APPEAR TO BE CONSISTENT WITH EACH OTHER.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filter Bar */}
      <div className="flex gap-2 flex-wrap p-3 border border-neutral-900 bg-[#0a0a0a]">
        {(["all", "critical", "high", "medium"] as FilterType[]).map((f) => {
          const count = counts[f as keyof typeof counts] ?? 0;
          const isActive = filter === f;
          return (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 font-mono uppercase tracking-widest text-[9px] border transition-colors ${
                isActive
                  ? "border-cyan-900/50 bg-cyan-950/20 text-cyan-400"
                  : "border-neutral-800 bg-[#050505] text-neutral-500 hover:text-neutral-300 hover:border-neutral-700"
              }`}
            >
              {f === "all" ? "ALL" : f.toUpperCase()}{" "}
              <span
                className={isActive ? "text-cyan-500/70" : "text-neutral-700"}
              >
                ({count})
              </span>
            </button>
          );
        })}
      </div>

      {/* Conflict Cards */}
      <div className="space-y-3">
        {filtered.map((conflict, index) => {
          const config = SEVERITY_CONFIG[conflict.severity];
          const Icon = CONFLICT_ICONS[conflict.conflict_type] || AlertTriangle;
          const isExpanded = expandedIds.has(conflict.id);

          return (
            <motion.div
              key={conflict.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <div
                className={`border ${config.border} ${config.bg} cursor-pointer hover:border-neutral-600 transition-colors`}
                onClick={() => toggleExpand(conflict.id)}
              >
                <div className="p-5">
                  {/* Header */}
                  <div className="flex items-start gap-4">
                    <div
                      className="p-2 border border-neutral-800 bg-[#050505] flex-shrink-0"
                    >
                      <Icon
                        className={`w-4 h-4 ${config.color}`}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <span
                          className={`text-[8px] font-mono uppercase tracking-widest px-1.5 py-0.5 border ${config.border} ${config.color}`}
                        >
                          {config.label}
                        </span>
                        <span className="text-[8px] font-mono uppercase tracking-widest text-neutral-600 bg-neutral-900 px-1.5 py-0.5 border border-neutral-800">
                          {conflict.conflict_type.replace(/_/g, " ")}
                        </span>
                      </div>
                      <h4 className="text-xs font-mono uppercase tracking-widest text-neutral-200">
                        {conflict.title}
                      </h4>
                    </div>
                    <ChevronDown
                      className={`w-4 h-4 text-neutral-600 transition-transform flex-shrink-0 mt-1 ${
                        isExpanded ? "rotate-180" : ""
                      }`}
                    />
                  </div>

                  {/* Two-column contract comparison */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-5">
                    <div className="border border-neutral-900 bg-[#050505] p-4">
                      <p className="text-[8px] font-mono uppercase tracking-widest text-neutral-600 mb-3 flex items-center gap-2 border-b border-neutral-900 pb-2">
                        // {conflict.document_a_title}
                      </p>
                      <p className="text-[10px] font-mono text-neutral-400 leading-relaxed line-clamp-3">
                        {conflict.document_a_clause || "—"}
                      </p>
                    </div>
                    <div className="border border-neutral-900 bg-[#050505] p-4">
                      <p className="text-[8px] font-mono uppercase tracking-widest text-neutral-600 mb-3 flex items-center gap-2 border-b border-neutral-900 pb-2">
                        // {conflict.document_b_title}
                      </p>
                      <p className="text-[10px] font-mono text-neutral-400 leading-relaxed line-clamp-3">
                        {conflict.document_b_clause || "—"}
                      </p>
                    </div>
                  </div>

                  {/* Expanded Details */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="mt-6 space-y-4">
                          {/* Description */}
                          <p className="text-[10px] font-mono text-neutral-400 leading-relaxed p-4 border-l-2 border-neutral-800 bg-[#050505]">
                            {conflict.description}
                          </p>

                          {/* Legal Implication */}
                          {conflict.legal_implication && (
                            <div className="border-l-2 border-red-900/50 bg-red-950/10 p-4">
                              <p className="text-[8px] font-mono uppercase tracking-widest text-red-500 mb-2 border-b border-red-900/30 pb-2">
                                LEGAL_IMPLICATION
                              </p>
                              <p className="text-[10px] font-mono text-red-400/80 leading-relaxed">
                                {conflict.legal_implication}
                              </p>
                            </div>
                          )}

                          {/* Legal Citation */}
                          {conflict.legal_citation && (
                            <p className="text-[9px] font-mono uppercase tracking-widest text-neutral-600 flex items-center gap-2">
                              <span className="text-neutral-700">//</span>{" "}
                              {conflict.legal_citation}
                            </p>
                          )}

                          {/* Resolution */}
                          {conflict.resolution_suggestion && (
                            <div className="border-l-2 border-emerald-900/50 bg-emerald-950/10 p-4">
                              <p className="text-[8px] font-mono uppercase tracking-widest text-emerald-500 mb-2 border-b border-emerald-900/30 pb-2">
                                RESOLUTION_SUGGESTION
                              </p>
                              <p className="text-[10px] font-mono text-emerald-400/80 leading-relaxed">
                                {conflict.resolution_suggestion}
                              </p>
                            </div>
                          )}

                          {/* Financial Risk */}
                          {conflict.financial_risk != null &&
                            conflict.financial_risk > 0 && (
                              <span className="text-xs font-mono text-red-500 border border-red-900/50 bg-red-950/20 px-3 py-1.5 inline-block">
                                FINANCIAL_RISK: ₹
                                {conflict.financial_risk.toLocaleString(
                                  "en-IN",
                                )}
                              </span>
                            )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
