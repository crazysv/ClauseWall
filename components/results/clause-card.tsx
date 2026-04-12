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

  // Risk stylin  // Risk styling
  const riskConfig = {
    safe: {
      icon: <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />,
      borderClass: "border-l-[2px] border-l-emerald-900/50",
      badgeClass:
        "bg-[#0e0e0e] text-emerald-500 font-mono border border-emerald-900/30 uppercase tracking-widest text-[9px] rounded-sm px-2 py-0.5",
      label: "SAFE",
    },
    warning: {
      icon: <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />,
      borderClass: "border-l-[2px] border-l-amber-900/50",
      badgeClass:
        "bg-[#0e0e0e] text-amber-500 font-mono border border-amber-900/30 uppercase tracking-widest text-[9px] rounded-sm px-2 py-0.5",
      label: "WARNING",
    },
    dangerous: {
      icon: <XCircle className="h-3.5 w-3.5 text-red-500" />,
      borderClass: "border-l-[2px] border-l-red-900/50 bg-[#1a0505]/20",
      badgeClass:
        "bg-[#0e0e0e] text-red-500 font-mono border border-red-900/50 uppercase tracking-widest text-[9px] rounded-sm px-2 py-0.5",
      label: "DANGEROUS",
    },
    illegal: {
      icon: <Scale className="h-3.5 w-3.5 text-red-600" />,
      borderClass: "border-l-[2px] border-l-red-600/60 bg-[#1a0505]/40",
      badgeClass:
        "bg-[#1a0505] text-red-500 font-mono border border-red-900 uppercase tracking-widest text-[9px] rounded-sm px-2 py-0.5 shadow-[0_0_10px_rgba(220,38,38,0.15)]",
      label: "ILLEGAL",
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
        <span
          className="bg-[#0e0e0e] border border-emerald-900/30 text-emerald-500 font-mono tracking-widest uppercase text-[9px] rounded-sm px-1.5 py-0.5 flex items-center gap-1"
          title="Verified against Indian legal database"
        >
          <ShieldCheck className="h-3 w-3" />
          VERIFIED
        </span>
      );
    }
    if (clause.verification_source === "database") {
      return (
        <span
          className="bg-[#0e0e0e] border border-amber-900/30 text-amber-500 font-mono tracking-widest uppercase text-[9px] rounded-sm px-1.5 py-0.5 flex items-center gap-1"
          title="Partially verified against legal database"
        >
          <ShieldAlert className="h-3 w-3" />
          PARTIAL
        </span>
      );
    }
    return (
      <span
        className="bg-[#050505] border border-cyan-900/30 text-cyan-500 font-mono tracking-widest uppercase text-[9px] rounded-sm px-1.5 py-0.5 flex items-center gap-1"
        title="AI-based assessment, not formally verified"
      >
        <Bot className="h-3 w-3" />
        AI INF
      </span>
    );
  };

  const showAutopsy =
    (clause.risk_level === "dangerous" || clause.risk_level === "illegal") &&
    !!onAutopsy;

  return (
    <div
      className={`bg-[#0a0a0a] border border-neutral-800 rounded-sm mb-2 relative overflow-hidden transition-all duration-200 ${risk.borderClass} ${
        showRoast ? "ring-1 ring-orange-500/50" : "hover:border-neutral-700"
      }`}
    >
      <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-neutral-500/10 to-transparent pointer-events-none" />

      {/* ── HEADER ── */}
      <div
        className="flex items-start justify-between p-4 cursor-pointer hover:bg-[#0e0e0e] transition-colors"
        onClick={onToggle}
      >
        <div className="flex-1 min-w-0 pr-4">
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            {risk.icon}
            <span className={risk.badgeClass}>{risk.label}</span>
            <span
              className={`text-[9px] font-mono tracking-widest uppercase ${
                clause.risk_level === "illegal" || clause.risk_level === "dangerous"
                  ? "text-red-500/70"
                  : "text-neutral-500"
              }`}
              title="Risk score for this clause (0-100)"
            >
              RISK: {clause.risk_score}
            </span>
            <span
              className="text-[9px] font-mono tracking-widest uppercase text-neutral-400 border border-neutral-800 bg-[#050505] px-2 py-0.5 rounded-sm"
            >
              {formatClauseType(clause.clause_type)}
            </span>
            {verificationBadge()}
            {showRoast && (
              <span className="bg-[#1a0f05] text-orange-500 font-mono border border-orange-900/50 uppercase tracking-widest text-[9px] rounded-sm px-1.5 py-0.5 flex items-center gap-1">
                <Flame className="h-3 w-3" />
                ROASTED
              </span>
            )}
            {detectedLanguage && detectedLanguage !== "en" && (
              <AudioPlayerInline
                text={clause.explanation || clause.original_text}
                language={detectedLanguage as SupportedLanguage}
                size="sm"
              />
            )}
          </div>
          <p className="text-[11px] font-mono text-neutral-400 leading-relaxed line-clamp-2">
            "{
              (clause.explanation || clause.original_text || "").substring(
                0,
                140
              )
            }
            {(clause.explanation || clause.original_text || "").length > 140
              ? "..."
              : ""}
            "
          </p>
        </div>
        <button
          className="p-1 mt-1 text-neutral-500 hover:text-white transition-colors flex-shrink-0"
          aria-label={isExpanded ? "Collapse clause" : "Expand clause"}
        >
          {isExpanded ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
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
              <div className="border-t border-neutral-900/50" />

              {/* Full Clause Text */}
              <div>
                <p className="text-[9px] font-mono text-neutral-500 tracking-widest uppercase mb-2">
                  [EXTRACTED VECTOR]
                </p>
                <div className="bg-[#050505] border border-neutral-900/50 p-4 rounded-sm">
                  <p className="text-[11px] font-mono text-neutral-300 leading-relaxed break-words">
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
                    <p className="text-[9px] font-mono tracking-widest text-orange-500 uppercase flex items-center gap-1.5 mb-2">
                      <Flame className="h-3 w-3" />
                      [ROASTED INFERENCE]
                    </p>
                    <div className="p-4 bg-[#1a0f05] border border-orange-900/30 text-orange-400 rounded-sm">
                      <p className="text-[11px] font-mono leading-relaxed">
                        {roastText}
                      </p>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="analysis"
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    transition={{ duration: 0.2 }}
                  >
                    <p className="text-[9px] font-mono text-cyan-600 tracking-widest uppercase mb-2">
                      [AI ANALYSIS / LEGAL IMPLICATIONS]
                    </p>
                    <p className="text-[11px] font-mono text-cyan-400/90 leading-relaxed bg-[#050b14] border border-cyan-900/30 p-4 rounded-sm">
                      {clause.explanation}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Red Flags */}
              {clause.red_flags && clause.red_flags.length > 0 && (
                <div className="bg-[#1a0505] border border-red-900/30 p-4 rounded-sm mt-2">
                  <p className="text-[9px] font-mono tracking-widest uppercase text-red-500 mb-2">
                    [CRITICAL ANOMALIES]
                  </p>
                  <ul className="space-y-1.5">
                    {clause.red_flags.map((flag, i) => (
                      <li
                        key={i}
                        className="flex items-start gap-2 text-[11px] font-mono text-red-400/90"
                      >
                        <span className="text-red-600 mt-0.5 text-[9px]">•</span>
                        {flag}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Legal Proof Summary (compact, only if proof exists) */}
              {proofTree && (
                <div className="pt-2">
                  <ProofSummary
                    proofTree={proofTree}
                    onViewProof={() => onDeepDive?.(clause, "proof")}
                    documentId={documentId}
                  />
                </div>
              )}

              {/* ── SINGLE ACTION LINE ── */}
              {clause.risk_level !== "safe" && (
                <div className="flex items-center justify-between pt-3 border-t border-neutral-900/50 mt-2">
                  {/* Primary: Deep Dive button */}
                  {onDeepDive && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeepDive(clause, "eli5");
                      }}
                      className="inline-flex items-center gap-2 text-[9px] font-mono py-2 px-4 rounded-sm bg-neutral-200 text-[#0a0a0a] hover:bg-white transition-colors tracking-widest uppercase border border-neutral-400 shadow-[0_0_10px_rgba(255,255,255,0.1)] hover:shadow-[0_0_15px_rgba(255,255,255,0.2)]"
                    >
                      EXECUTE DEEP DIVE
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  )}

                  {/* Secondary: subtle text links */}
                  <div className="flex items-center gap-4">
                    {showAutopsy && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onAutopsy!();
                        }}
                        className="inline-flex items-center gap-1.5 text-[9px] font-mono tracking-widest uppercase text-neutral-500 hover:text-cyan-400 transition-colors"
                      >
                        <Scan className="w-3 w-3" />
                        AUTOPSY MODE
                      </button>
                    )}
                    {!!onRewrite && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onRewrite();
                        }}
                        className="inline-flex items-center gap-1.5 text-[9px] font-mono tracking-widest uppercase text-neutral-500 hover:text-emerald-400 transition-colors"
                      >
                        <Pencil className="w-3 w-3" />
                        REWRITE SECTOR
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
