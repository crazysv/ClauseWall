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
    color: "text-red-400",
    bg: "bg-red-500/10",
    border: "border-red-500/20",
    label: "Critical",
  },
  high: {
    color: "text-orange-400",
    bg: "bg-orange-500/10",
    border: "border-orange-500/20",
    label: "High",
  },
  medium: {
    color: "text-yellow-400",
    bg: "bg-yellow-500/10",
    border: "border-yellow-500/20",
    label: "Medium",
  },
  low: {
    color: "text-blue-400",
    bg: "bg-blue-500/10",
    border: "border-blue-500/20",
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
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <CheckCircle2 className="w-12 h-12 text-green-400/50 mb-4" />
        <h3 className="text-lg font-semibold text-green-400 mb-2">
          No Conflicts Found
        </h3>
        <p className="text-sm text-white/40 max-w-md">
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
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                isActive
                  ? "bg-white/10 border-white/20 text-white"
                  : "bg-white/[0.02] border-white/5 text-white/40 hover:text-white/60"
              }`}
            >
              {f === "all" ? "All" : f.charAt(0).toUpperCase() + f.slice(1)}{" "}
              <span className="opacity-60">({count})</span>
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
                className={`${config.bg} ${config.border} cursor-pointer hover:brightness-110 transition-all`}
                onClick={() => toggleExpand(conflict.id)}
              >
                <CardContent className="p-4">
                  {/* Header */}
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg ${config.bg}`}>
                      <Icon className={`w-4 h-4 ${config.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge className={`${config.bg} ${config.color} text-[10px] border-0`}>
                          {config.label}
                        </Badge>
                        <span className="text-[10px] text-white/30">
                          {conflict.conflict_type.replace(/_/g, " ")}
                        </span>
                      </div>
                      <h4 className="text-sm font-semibold text-white">
                        {conflict.title}
                      </h4>
                    </div>
                    <ChevronDown
                      className={`w-4 h-4 text-white/30 transition-transform flex-shrink-0 ${
                        isExpanded ? "rotate-180" : ""
                      }`}
                    />
                  </div>

                  {/* Two-column contract comparison */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                    <div className="rounded-lg bg-white/[0.03] border border-white/5 p-3">
                      <p className="text-[10px] text-white/40 mb-1">📄 {conflict.document_a_title}</p>
                      <p className="text-xs text-white/70 line-clamp-2">
                        {conflict.document_a_clause || "—"}
                      </p>
                    </div>
                    <div className="rounded-lg bg-white/[0.03] border border-white/5 p-3">
                      <p className="text-[10px] text-white/40 mb-1">📄 {conflict.document_b_title}</p>
                      <p className="text-xs text-white/70 line-clamp-2">
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
                        <div className="mt-4 space-y-3">
                          {/* Description */}
                          <p className="text-sm text-white/60">{conflict.description}</p>

                          {/* Legal Implication */}
                          {conflict.legal_implication && (
                            <div className="rounded-lg bg-red-500/5 border border-red-500/10 p-3">
                              <p className="text-[10px] text-red-400 font-medium mb-1">
                                ⚠️ Legal Implication
                              </p>
                              <p className="text-xs text-white/60">
                                {conflict.legal_implication}
                              </p>
                            </div>
                          )}

                          {/* Legal Citation */}
                          {conflict.legal_citation && (
                            <p className="text-[10px] text-white/30">
                              📜 {conflict.legal_citation}
                            </p>
                          )}

                          {/* Resolution */}
                          {conflict.resolution_suggestion && (
                            <div className="rounded-lg bg-green-500/5 border border-green-500/10 p-3">
                              <p className="text-[10px] text-green-400 font-medium mb-1">
                                ✅ Resolution Suggestion
                              </p>
                              <p className="text-xs text-white/60">
                                {conflict.resolution_suggestion}
                              </p>
                            </div>
                          )}

                          {/* Financial Risk */}
                          {conflict.financial_risk != null &&
                            conflict.financial_risk > 0 && (
                              <p className="text-sm text-red-400 font-semibold">
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
