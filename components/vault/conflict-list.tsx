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
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import type { CrossContractConflict, ConflictSeverity } from "@/types";

interface ConflictListProps {
  conflicts: CrossContractConflict[];
}

const SEVERITY_CONFIG: Record<
  ConflictSeverity,
  { color: string; bg: string; border: string; label: string }
> = {
  critical: {
    color: "text-red-700",
    bg: "bg-red-50",
    border: "border-red-200",
    label: "Critical",
  },
  high: {
    color: "text-amber-700",
    bg: "bg-amber-50",
    border: "border-amber-200",
    label: "High",
  },
  medium: {
    color: "text-yellow-700",
    bg: "bg-yellow-50",
    border: "border-yellow-200",
    label: "Medium",
  },
  low: {
    color: "text-indigo-700",
    bg: "bg-indigo-50",
    border: "border-indigo-200",
    label: "Low",
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

export function ConflictList({ conflicts }: ConflictListProps) {
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
      <div className="flex flex-col items-center justify-center py-8 md:py-6 md:py-8 lg:py-12 lg:py-16 text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 border-dashed rounded-3xl">
        <CheckCircle2 className="w-12 h-12 text-emerald-400 mb-4" />
        <h3 className="text-lg font-black text-slate-800 dark:text-slate-200 mb-2 tracking-tight">
          No Conflicts Found
        </h3>
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400 max-w-md">
          Great news! No conflicts were detected between your contracts. Your
          agreements appear to be consistent with each other.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filter Bar */}
      <div className="flex gap-2 flex-wrap">
        {(["all", "critical", "high", "medium"] as FilterType[]).map((f) => {
          const count = counts[f as keyof typeof counts] ?? 0;
          const isActive = filter === f;
          return (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-full text-xs font-bold border transition-all shadow-sm dark:shadow-slate-900/20 ${ isActive ? "bg-indigo-600 border-indigo-700 text-white" : "bg-white dark:bg-card border-slate-200 dark:border-slate-700 text-slate-500 hover:text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800" }`}
            >
              {f === "all" ? "All" : f.charAt(0).toUpperCase() + f.slice(1)}{" "}
              <span className={isActive ? "text-indigo-200" : "text-slate-400"}>({count})</span>
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
              <Card
                className={`bg-white dark:bg-card border-slate-200 dark:border-slate-700 hover:border-indigo-300 shadow-sm dark:shadow-slate-900/20 rounded-2xl cursor-pointer transition-all`}
                onClick={() => toggleExpand(conflict.id)}
              >
                <CardContent className="p-4">
                  {/* Header */}
                  <div className="flex items-start gap-4">
                    <div className={`p-2 rounded-xl ${config.bg}`}>
                      <Icon className={`w-5 h-5 ${config.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge className={`${config.bg} ${config.color} text-[10px] font-black uppercase tracking-widest border-0 px-2 rounded-full`}>
                          {config.label}
                        </Badge>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                          {conflict.conflict_type.replace(/_/g, " ")}
                        </span>
                      </div>
                      <h4 className="text-base font-black text-slate-900 dark:text-slate-100">
                        {conflict.title}
                      </h4>
                    </div>
                    <ChevronDown
                      className={`w-5 h-5 text-slate-400 transition-transform flex-shrink-0 mt-1 ${
                        isExpanded ? "rotate-180 text-indigo-500" : ""
                      }`}
                    />
                  </div>

                  {/* Two-column contract comparison */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                    <div className="rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-4">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-2">📄 {conflict.document_a_title}</p>
                      <p className="text-sm font-medium text-slate-800 dark:text-slate-200 line-clamp-2 leading-relaxed">
                        {conflict.document_a_clause || "—"}
                      </p>
                    </div>
                    <div className="rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-4">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-2">📄 {conflict.document_b_title}</p>
                      <p className="text-sm font-medium text-slate-800 dark:text-slate-200 line-clamp-2 leading-relaxed">
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
                          <p className="text-sm font-medium text-slate-600 dark:text-slate-400 leading-relaxed">{conflict.description}</p>

                          {/* Legal Implication */}
                          {conflict.legal_implication && (
                            <div className="rounded-xl bg-red-50 border border-red-100 p-4">
                              <p className="text-[10px] text-red-800 font-black uppercase tracking-widest mb-2">
                                ⚠️ Legal Implication
                              </p>
                              <p className="text-sm font-medium text-red-950/80 leading-relaxed">
                                {conflict.legal_implication}
                              </p>
                            </div>
                          )}

                          {/* Legal Citation */}
                          {conflict.legal_citation && (
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                              📜 Citation: <span className="text-slate-600 dark:text-slate-400">{conflict.legal_citation}</span>
                            </p>
                          )}

                          {/* Resolution */}
                          {conflict.resolution_suggestion && (
                            <div className="rounded-xl bg-emerald-50 border border-emerald-100 p-4">
                              <p className="text-[10px] text-emerald-800 font-black uppercase tracking-widest mb-2">
                                ✅ Resolution Suggestion
                              </p>
                              <p className="text-sm font-medium text-emerald-950/80 leading-relaxed">
                                {conflict.resolution_suggestion}
                              </p>
                            </div>
                          )}

                          {/* Financial Risk */}
                          {conflict.financial_risk != null &&
                            conflict.financial_risk > 0 && (
                              <p className="text-sm text-red-600 font-black tracking-tight">
                                💰 Financial Risk: ₹
                                {conflict.financial_risk.toLocaleString("en-IN")}
                              </p>
                            )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
