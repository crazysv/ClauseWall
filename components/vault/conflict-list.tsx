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
    color: "text-red-600 dark:text-red-500",
    bg: "bg-red-100 dark:bg-red-950",
    border: "border-red-500",
    label: "CRITICAL",
  },
  high: {
    color: "text-orange-600 dark:text-orange-500",
    bg: "bg-orange-100 dark:bg-orange-950",
    border: "border-orange-500",
    label: "HIGH",
  },
  medium: {
    color: "text-yellow-600 dark:text-yellow-500",
    bg: "bg-yellow-100 dark:bg-yellow-950",
    border: "border-yellow-500",
    label: "MEDIUM",
  },
  low: {
    color: "text-blue-600 dark:text-blue-500",
    bg: "bg-blue-100 dark:bg-blue-950",
    border: "border-blue-500",
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
      <div className="flex flex-col items-center justify-center py-16 text-center border-4 border-black bg-green-50 dark:bg-green-950 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
        <CheckCircle2 className="w-16 h-16 text-green-600 dark:text-green-500 mb-6 stroke-[3px]" />
        <h3 className="text-2xl font-black uppercase tracking-widest text-green-700 dark:text-green-400 mb-4">
          NO CONFLICTS FOUND
        </h3>
        <p className="text-sm font-bold uppercase tracking-widest text-green-900/60 dark:text-green-200/60 max-w-md leading-relaxed">
          GREAT NEWS! NO CONFLICTS WERE DETECTED BETWEEN YOUR CONTRACTS. YOUR
          AGREEMENTS APPEAR TO BE CONSISTENT WITH EACH OTHER.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filter Bar */}
      <div className="flex gap-3 flex-wrap p-4 border-4 border-black bg-white dark:bg-zinc-900 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
        {(["all", "critical", "high", "medium"] as FilterType[]).map((f) => {
          const count = counts[f as keyof typeof counts] ?? 0;
          const isActive = filter === f;
          return (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 font-black uppercase tracking-widest text-xs border-4 transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 hover:shadow-none ${
                isActive
                  ? "bg-black text-white border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] translate-y-[-2px] dark:bg-white dark:text-black"
                  : "bg-white text-black border-black dark:bg-zinc-800 dark:text-white"
              }`}
            >
              {f === "all" ? "ALL" : f.toUpperCase()}{" "}
              <span className={isActive ? "opacity-80" : "text-muted-foreground"}>({count})</span>
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
                className={`border-4 border-black rounded-none shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] ${config.bg} cursor-pointer hover:-translate-y-1 hover:shadow-none transition-all`}
                onClick={() => toggleExpand(conflict.id)}
              >
                <CardContent className="p-6">
                  {/* Header */}
                  <div className="flex items-start gap-4">
                    <div className={`p-3 border-4 border-black bg-white dark:bg-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]`}>
                      <Icon className={`w-5 h-5 ${config.color} stroke-[3px]`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2 flex-wrap">
                        <Badge className={`px-2 py-0.5 border-2 border-black rounded-none shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] ${config.bg} ${config.color} font-black uppercase tracking-widest text-[10px]`}>
                          {config.label}
                        </Badge>
                        <span className="text-xs font-black uppercase tracking-widest text-muted-foreground bg-white dark:bg-black px-2 py-0.5 border-2 border-black">
                          {conflict.conflict_type.replace(/_/g, " ")}
                        </span>
                      </div>
                      <h4 className="text-base font-black uppercase tracking-widest text-foreground block">
                        {conflict.title}
                      </h4>
                    </div>
                    <ChevronDown
                      className={`w-6 h-6 stroke-[3px] text-black dark:text-white transition-transform flex-shrink-0 mt-1 ${
                        isExpanded ? "rotate-180" : ""
                      }`}
                    />
                  </div>

                  {/* Two-column contract comparison */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
                    <div className="border-4 border-black bg-white dark:bg-zinc-900 p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                      <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-3 flex items-center gap-2 border-b-2 border-black pb-2">
                        <span className="text-black dark:text-white">📄</span> {conflict.document_a_title}
                      </p>
                      <p className="text-sm font-bold uppercase tracking-widest text-foreground leading-relaxed line-clamp-3">
                        {conflict.document_a_clause || "—"}
                      </p>
                    </div>
                    <div className="border-4 border-black bg-white dark:bg-zinc-900 p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                      <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-3 flex items-center gap-2 border-b-2 border-black pb-2">
                        <span className="text-black dark:text-white">📄</span> {conflict.document_b_title}
                      </p>
                      <p className="text-sm font-bold uppercase tracking-widest text-foreground leading-relaxed line-clamp-3">
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
                        <div className="mt-8 space-y-4">
                          {/* Description */}
                          <p className="text-sm font-bold uppercase tracking-widest text-foreground leading-relaxed p-4 border-l-4 border-black bg-white dark:bg-zinc-900 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                            {conflict.description}
                          </p>

                          {/* Legal Implication */}
                          {conflict.legal_implication && (
                            <div className="border-4 border-black bg-red-50 dark:bg-red-950/20 p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                              <p className="text-[10px] font-black uppercase tracking-widest text-red-600 dark:text-red-400 mb-2 border-b-2 border-red-500 pb-2">
                                ⚠️ LEGAL IMPLICATION
                              </p>
                              <p className="text-sm font-bold uppercase tracking-widest text-red-900/80 dark:text-red-200/80 leading-relaxed">
                                {conflict.legal_implication}
                              </p>
                            </div>
                          )}

                          {/* Legal Citation */}
                          {conflict.legal_citation && (
                            <p className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                              <span className="p-1 border-2 border-black bg-gray-100 dark:bg-zinc-800">📜</span> {conflict.legal_citation}
                            </p>
                          )}

                          {/* Resolution */}
                          {conflict.resolution_suggestion && (
                            <div className="border-4 border-black bg-green-50 dark:bg-green-950/20 p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                              <p className="text-[10px] font-black uppercase tracking-widest text-green-600 dark:text-green-500 mb-2 border-b-2 border-green-500 pb-2">
                                ✅ RESOLUTION SUGGESTION
                              </p>
                              <p className="text-sm font-bold uppercase tracking-widest text-green-900/80 dark:text-green-200/80 leading-relaxed">
                                {conflict.resolution_suggestion}
                              </p>
                            </div>
                          )}

                          {/* Financial Risk */}
                          {conflict.financial_risk != null &&
                            conflict.financial_risk > 0 && (
                              <p className="text-base font-black uppercase tracking-widest text-red-600 dark:text-red-400 inline-block px-4 py-2 border-4 border-red-500 bg-red-100 dark:bg-red-950 shadow-[4px_4px_0px_0px_rgba(239,68,68,1)]">
                                💰 FINANCIAL RISK: ₹
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
