"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Scale,
  ShieldCheck,
  ShieldAlert,
  Bot,
  Flame,
  Scan,
  Pencil,
  ArrowRight,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import KnowledgeGraphModal from "@/components/results/knowledge-graph-modal";
import ProofSummary from "@/components/results/proof-summary";
import type { ProofTree } from "@/lib/reasoning/types";
import type { ClauseDeliberation } from "@/lib/deliberation/types";
import { AudioPlayerInline } from "@/components/bhasha/audio-player-inline";
import type { SupportedLanguage } from "@/types/bhasha";
import { formatClauseType } from "@/lib/format-clause-type";

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
  verification_source?: "database" | "ai";
  confidence?: "verified" | "partial" | "ai_suggested";
  matched_rule_id?: string | null;
  negotiation_script?: string | null;
  penalty_info?: string | null;
  community_match?: string | null;
  proof_data?: string | null;
}

interface ClauseCardProps {
  clause: HybridClause;
  isExpanded: boolean;
  onToggle: () => void;
  jurisdiction: string;
  documentType?: string;
  onAutopsy?: () => void;
  onRewrite?: () => void;
  isRoastMode?: boolean;
  roastText?: string | null;
  deliberation?: ClauseDeliberation | null;
  documentId?: string;
  detectedLanguage?: string;
  onDeepDive?: (clause: HybridClause, tab: string) => void;
}

export default function ClauseCard({
  clause,
  isExpanded,
  onToggle,
  jurisdiction,
  documentType = "rental",
  onAutopsy,
  onRewrite,
  isRoastMode = false,
  roastText,
  deliberation,
  documentId,
  detectedLanguage,
  onDeepDive,
}: ClauseCardProps) {
  const [showGraph, setShowGraph] = useState(false);

  // Parse proof tree data
  let proofTree: ProofTree | null = null;
  try {
    if (clause.proof_data) {
      proofTree =
        typeof clause.proof_data === "string"
          ? JSON.parse(clause.proof_data)
          : clause.proof_data;
    }
  } catch {
    // Invalid proof data — ignore
  }

  // Risk styling
  const riskConfig = {
    safe: {
      icon: <CheckCircle2 className="h-4 w-4 text-green-500" />,
      borderClass: "border-l-4 border-l-green-500",
      badgeClass:
        "bg-green-500/10 text-green-400 font-bold border border-green-500/30 uppercase text-[10px] rounded-lg",
      label: "Safe",
    },
    warning: {
      icon: <AlertTriangle className="h-4 w-4 text-yellow-500" />,
      borderClass: "border-l-4 border-l-yellow-500",
      badgeClass:
        "bg-yellow-500/10 text-yellow-400 font-bold border border-yellow-500/30 uppercase text-[10px] rounded-lg",
      label: "Warning",
    },
    dangerous: {
      icon: <XCircle className="h-4 w-4 text-red-500" />,
      borderClass: "border-l-4 border-l-red-500",
      badgeClass:
        "bg-red-500/10 text-red-400 font-bold border border-red-500/30 uppercase text-[10px] rounded-lg",
      label: "Dangerous",
    },
    illegal: {
      icon: <Scale className="h-4 w-4 text-purple-500" />,
      borderClass: "border-l-4 border-l-purple-500",
      badgeClass:
        "bg-purple-500/10 text-purple-400 font-bold border border-purple-500/30 uppercase text-[10px] rounded-lg",
      label: "Illegal",
    },
  };

  const risk =
    riskConfig[clause.risk_level as keyof typeof riskConfig] ||
    riskConfig.warning;

  const showRoast =
    isRoastMode &&
    !!roastText &&
    (clause.risk_level === "dangerous" || clause.risk_level === "illegal");

  const verificationBadge = () => {
    if (
      clause.verification_source === "database" &&
      clause.confidence === "verified"
    ) {
      return (
        <Badge
          className="bg-green-500/15 text-green-400 border-green-500/30 text-[10px] px-1.5 gap-1"
          title="Verified against Indian legal database"
        >
          <ShieldCheck className="h-3 w-3" />
          Verified
        </Badge>
      );
    }
    if (clause.verification_source === "database") {
      return (
        <Badge
          className="bg-yellow-500/15 text-yellow-400 border-yellow-500/30 text-[10px] px-1.5 gap-1"
          title="Partially verified against legal database"
        >
          <ShieldAlert className="h-3 w-3" />
          Partial
        </Badge>
      );
    }
    return (
      <Badge
        className="bg-blue-500/15 text-blue-400 border-blue-500/30 text-[10px] px-1.5 gap-1"
        title="AI-based assessment, not formally verified"
      >
        <Bot className="h-3 w-3" />
        AI
      </Badge>
    );
  };

  const showAutopsy =
    (clause.risk_level === "dangerous" || clause.risk_level === "illegal") &&
    !!onAutopsy;

  return (
    <div
      className={`card-results overflow-hidden transition-all ${risk.borderClass} ${
        showRoast ? "ring-2 ring-orange-500" : ""
      }`}
    >
      {/* ── HEADER ── */}
      <div
        className="flex items-start justify-between p-4 cursor-pointer hover:bg-muted/50 transition-colors"
        onClick={onToggle}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            {risk.icon}
            <Badge className={risk.badgeClass}>{risk.label}</Badge>
            <span
              className="text-[10px] font-bold tracking-wider text-[#a3a3a3] uppercase"
              title="Risk score for this clause (0-100)"
            >
              {clause.risk_score}/100
            </span>
            <Badge
              variant="outline"
              className="text-[10px] uppercase font-bold text-[#a3a3a3] border border-[#404040] rounded-lg"
            >
              {formatClauseType(clause.clause_type)}
            </Badge>
            {verificationBadge()}
            {showRoast && (
              <Badge className="bg-orange-50 text-orange-900 dark:text-orange-100 font-bold border-2 border-orange-600 uppercase text-[10px] px-1.5 gap-1">
                <Flame className="h-3.5 w-3.5" />
                Roasted
              </Badge>
            )}
            {detectedLanguage && detectedLanguage !== "en" && (
              <AudioPlayerInline
                text={clause.explanation || clause.original_text}
                language={detectedLanguage as SupportedLanguage}
                size="sm"
              />
            )}
          </div>
          <p className="text-sm font-medium text-[#a3a3a3] line-clamp-2">
            &quot;
            {(clause.explanation || clause.original_text || "").substring(
              0,
              120
            )}
            {(clause.explanation || clause.original_text || "").length > 120
              ? "..."
              : ""}
            &quot;
          </p>
        </div>
        <button
          className="p-1 ml-2 text-foreground/50 flex-shrink-0"
          aria-label={isExpanded ? "Collapse clause" : "Expand clause"}
        >
          {isExpanded ? (
            <ChevronUp className="h-5 w-5" />
          ) : (
            <ChevronDown className="h-5 w-5" />
          )}
        </button>
      </div>

      {/* ── EXPANDED CONTENT ── */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-4">
              <div className="border-t border-foreground/20" />

              {/* Full Clause Text */}
              <div>
                <p className="results-section-label mb-1.5">
                  Original Text
                </p>
                <div className="well-recessed p-3">
                  <p className="text-sm text-[#e5e5e5] leading-relaxed font-medium">
                    {clause.original_text}
                  </p>
                </div>
              </div>

              {/* ── ROAST or ANALYSIS ── */}
              <AnimatePresence mode="wait">
                {showRoast ? (
                  <motion.div
                    key="roast"
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    transition={{ duration: 0.2 }}
                  >
                    <p className="text-xs font-black uppercase tracking-wider text-orange-600 mb-2 flex items-center gap-1.5">
                      <Flame className="h-4 w-4" />
                      Roasted Analysis 🔥
                    </p>
                    <div className="p-4 bg-orange-50 dark:bg-orange-950 border-2 border-orange-600 text-orange-900 dark:text-orange-100">
                      <p className="text-sm leading-relaxed font-bold">
                        {roastText}
                      </p>
                    </div>
                    <p className="text-[10px] text-foreground/50 mt-2 font-medium">
                      Roast mode — entertainment + education. Toggle off for formal analysis.
                    </p>
                  </motion.div>
                ) : (
                  <motion.div
                    key="analysis"
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    transition={{ duration: 0.2 }}
                  >
                    <p className="results-section-label mb-1.5">
                      Analysis
                    </p>
                    <p className="text-sm text-[#a3a3a3] font-medium leading-relaxed">
                      {clause.explanation}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Red Flags */}
              {clause.red_flags && clause.red_flags.length > 0 && (
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-red-500/80 mb-1.5">
                    🚩 Red Flags
                  </p>
                  <ul className="space-y-1">
                    {clause.red_flags.map((flag, i) => (
                      <li
                        key={i}
                        className="flex items-start gap-2 text-sm text-red-400/90"
                      >
                        <span className="text-red-500 mt-1 text-xs">•</span>
                        {flag}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Legal Proof Summary (compact, only if proof exists) */}
              {proofTree && (
                <ProofSummary
                  proofTree={proofTree}
                  onViewProof={() => onDeepDive?.(clause, "proof")}
                  documentId={documentId}
                />
              )}

              {/* ── SINGLE ACTION LINE ── */}
              {clause.risk_level !== "safe" && (
                <div className="flex items-center justify-between pt-2 border-t border-foreground/10">
                  {/* Primary: Deep Dive button */}
                  {onDeepDive && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeepDive(clause, "eli5");
                      }}
                      className="inline-flex items-center gap-1.5 text-xs py-1.5 px-3 rounded-lg bg-[#fafafa] text-[#0a0a0a] hover:bg-[#e5e5e5] transition-colors font-semibold uppercase tracking-wider"
                    >
                      Deep Dive
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  )}

                  {/* Secondary: subtle text links */}
                  <div className="flex items-center gap-3">
                    {showAutopsy && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onAutopsy!();
                        }}
                        className="inline-flex items-center gap-1 text-[11px] text-foreground/50 hover:text-foreground transition-colors font-medium"
                      >
                        <Scan className="w-3 h-3" />
                        Breakdown
                      </button>
                    )}
                    {!!onRewrite && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onRewrite();
                        }}
                        className="inline-flex items-center gap-1 text-[11px] text-foreground/50 hover:text-foreground transition-colors font-medium"
                      >
                        <Pencil className="w-3 h-3" />
                        Rewrite
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Legal Web Modal (triggered from drawer now, but kept for backwards compat) */}
      {showGraph && (
        <KnowledgeGraphModal
          isOpen={showGraph}
          onClose={() => setShowGraph(false)}
          clauseType={clause.clause_type}
          jurisdiction={jurisdiction}
          clauseText={clause.original_text}
          riskLevel={clause.risk_level}
        />
      )}
    </div>
  );
}
