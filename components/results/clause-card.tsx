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
  MessageSquare,
  Gavel,
  BookOpen,
  Lightbulb,
  Users,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import ELI5Section from "@/components/results/eli5-section";
import CommunityInsight from "@/components/results/community-insight";

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
}

interface ClauseCardProps {
  clause: HybridClause;
  isExpanded: boolean;
  onToggle: () => void;
  jurisdiction: string;
}

type ActionTab = "legal" | "fair" | "negotiate" | "penalty" | "eli5" | "community" | null;

export default function ClauseCard({ clause, isExpanded, onToggle, jurisdiction }: ClauseCardProps) {
  const [activeAction, setActiveAction] = useState<ActionTab>(null);

  const toggleAction = (tab: ActionTab) => {
    setActiveAction((prev) => (prev === tab ? null : tab));
  };

  // Risk styling
  const riskConfig = {
    safe: {
      icon: <CheckCircle2 className="h-4 w-4 text-green-500" />,
      borderClass: "border-l-green-500",
      badgeClass: "bg-green-500/15 text-green-400 border-green-500/30",
      label: "Safe",
    },
    warning: {
      icon: <AlertTriangle className="h-4 w-4 text-yellow-500" />,
      borderClass: "border-l-yellow-500",
      badgeClass: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
      label: "Warning",
    },
    dangerous: {
      icon: <XCircle className="h-4 w-4 text-red-500" />,
      borderClass: "border-l-red-500",
      badgeClass: "bg-red-500/15 text-red-400 border-red-500/30",
      label: "Dangerous",
    },
    illegal: {
      icon: <Scale className="h-4 w-4 text-purple-500" />,
      borderClass: "border-l-purple-500",
      badgeClass: "bg-purple-500/15 text-purple-400 border-purple-500/30",
      label: "Illegal",
    },
  };

  const risk = riskConfig[clause.risk_level as keyof typeof riskConfig] || riskConfig.warning;

  // Verification badge (small inline)
  const verificationBadge = () => {
    if (clause.verification_source === "database" && clause.confidence === "verified") {
      return (
        <Badge className="bg-green-500/15 text-green-400 border-green-500/30 text-[10px] px-1.5 gap-1">
          <ShieldCheck className="h-3 w-3" />
          Verified
        </Badge>
      );
    }
    if (clause.verification_source === "database") {
      return (
        <Badge className="bg-yellow-500/15 text-yellow-400 border-yellow-500/30 text-[10px] px-1.5 gap-1">
          <ShieldAlert className="h-3 w-3" />
          Partial
        </Badge>
      );
    }
    return (
      <Badge className="bg-blue-500/15 text-blue-400 border-blue-500/30 text-[10px] px-1.5 gap-1">
        <Bot className="h-3 w-3" />
        AI
      </Badge>
    );
  };

  // Action buttons config — only show buttons for data that exists
  const actionButtons: { key: ActionTab; icon: React.ReactNode; label: string; available: boolean; color: string }[] = [
    {
      key: "legal",
      icon: <Scale className="h-3.5 w-3.5" />,
      label: "Legal Ref",
      available: !!clause.legal_citation,
      color: "blue",
    },
    {
      key: "fair",
      icon: <CheckCircle2 className="h-3.5 w-3.5" />,
      label: "Fair Version",
      available: !!clause.fair_alternative,
      color: "green",
    },
    {
      key: "negotiate",
      icon: <MessageSquare className="h-3.5 w-3.5" />,
      label: "What to Say",
      available: !!clause.negotiation_script,
      color: "purple",
    },
    {
      key: "penalty",
      icon: <Gavel className="h-3.5 w-3.5" />,
      label: "Penalty",
      available: !!clause.penalty_info,
      color: "orange",
    },
    {
      key: "eli5",
      icon: <Lightbulb className="h-3.5 w-3.5" />,
      label: "Explain Simple",
      available: clause.risk_level !== "safe",
      color: "yellow",
    },
    {
      key: "community",
      icon: <Users className="h-3.5 w-3.5" />,
      label: "Community",
      available: clause.risk_level === "dangerous" || clause.risk_level === "illegal",
      color: "orange",
    },
  ];

  const availableActions = actionButtons.filter((a) => a.available);

  const getButtonStyle = (btn: typeof actionButtons[0], isActive: boolean) => {
    const colorMap: Record<string, { active: string; inactive: string }> = {
      blue: {
        active: "bg-blue-500/20 border-blue-500/40 text-blue-400",
        inactive: "bg-white/[0.03] border-white/10 text-gray-400 hover:text-blue-400 hover:border-blue-500/30",
      },
      green: {
        active: "bg-green-500/20 border-green-500/40 text-green-400",
        inactive: "bg-white/[0.03] border-white/10 text-gray-400 hover:text-green-400 hover:border-green-500/30",
      },
      purple: {
        active: "bg-purple-500/20 border-purple-500/40 text-purple-400",
        inactive: "bg-white/[0.03] border-white/10 text-gray-400 hover:text-purple-400 hover:border-purple-500/30",
      },
      orange: {
        active: "bg-orange-500/20 border-orange-500/40 text-orange-400",
        inactive: "bg-white/[0.03] border-white/10 text-gray-400 hover:text-orange-400 hover:border-orange-500/30",
      },
      yellow: {
        active: "bg-yellow-500/20 border-yellow-500/40 text-yellow-400",
        inactive: "bg-white/[0.03] border-white/10 text-gray-400 hover:text-yellow-400 hover:border-yellow-500/30",
      },
    };
    const colors = colorMap[btn.color] || colorMap.blue;
    return isActive ? colors.active : colors.inactive;
  };

  return (
    <div
      className={`rounded-xl border border-white/5 border-l-4 ${risk.borderClass} bg-gray-900/50 overflow-hidden transition-all`}
    >
      {/* ── HEADER (always visible, click to expand) ── */}
      <div
        className="flex items-start justify-between p-4 cursor-pointer hover:bg-white/[0.02] transition-colors"
        onClick={onToggle}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            {risk.icon}
            <Badge className={risk.badgeClass}>{risk.label}</Badge>
            <span className="text-xs text-gray-500">Score: {clause.risk_score}/100</span>
            <Badge variant="outline" className="text-[10px] border-white/10 text-gray-500">
              {clause.clause_type}
            </Badge>
            {verificationBadge()}
          </div>
          <p className="text-sm text-gray-400 line-clamp-2 italic">
            &quot;{clause.original_text.substring(0, 180)}
            {clause.original_text.length > 180 ? "..." : ""}&quot;
          </p>
        </div>
        <button className="p-1 ml-2 text-gray-500 flex-shrink-0">
          {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
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
              {/* Divider */}
              <div className="border-t border-white/5" />

              {/* Full Clause Text */}
              <div>
                <p className="text-xs font-medium text-gray-500 mb-1.5">Full Clause Text</p>
                <p className="text-sm text-gray-300 bg-white/[0.03] p-3 rounded-lg leading-relaxed">
                  {clause.original_text}
                </p>
              </div>

              {/* Analysis (always visible — this is the main value) */}
              <div>
                <p className="text-xs font-medium text-gray-500 mb-1.5">Analysis</p>
                <p className="text-sm text-gray-300 leading-relaxed">
                  {clause.explanation}
                </p>
              </div>

              {/* Red Flags (always visible — critical info) */}
              {clause.red_flags && clause.red_flags.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-red-400 mb-1.5">🚩 Red Flags</p>
                  <ul className="space-y-1">
                    {clause.red_flags.map((flag, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-red-300">
                        <span className="text-red-500 mt-1 text-xs">•</span>
                        {flag}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* ── ACTION BUTTONS ROW ── */}
              {availableActions.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-2">Deep Dive</p>
                  <div className="flex flex-wrap gap-2">
                    {availableActions.map((btn) => {
                      const isActive = activeAction === btn.key;
                      return (
                        <button
                          key={btn.key}
                          onClick={() => toggleAction(btn.key)}
                          className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border text-xs font-medium transition-all ${getButtonStyle(btn, isActive)}`}
                        >
                          {btn.icon}
                          {btn.label}
                          {isActive && <ChevronUp className="h-3 w-3 ml-0.5" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* ── EXPANDABLE ACTION CONTENT (only one at a time) ── */}
              <AnimatePresence mode="wait">
                {activeAction === "legal" && clause.legal_citation && (
                  <motion.div
                    key="legal"
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    transition={{ duration: 0.15 }}
                    className="p-4 rounded-lg bg-blue-500/5 border border-blue-500/20"
                  >
                    <p className="text-xs font-medium text-blue-400 mb-1.5 flex items-center gap-1.5">
                      <Scale className="h-3.5 w-3.5" />
                      Legal Reference
                    </p>
                    <p className="text-sm text-blue-300 leading-relaxed">
                      {clause.legal_citation}
                    </p>
                  </motion.div>
                )}

                {activeAction === "fair" && clause.fair_alternative && (
                  <motion.div
                    key="fair"
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    transition={{ duration: 0.15 }}
                    className="p-4 rounded-lg bg-green-500/5 border border-green-500/20"
                  >
                    <p className="text-xs font-medium text-green-400 mb-1.5 flex items-center gap-1.5">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Fair Alternative — What This Clause Should Say
                    </p>
                    <p className="text-sm text-green-300 leading-relaxed">
                      {clause.fair_alternative}
                    </p>
                  </motion.div>
                )}

                {activeAction === "negotiate" && clause.negotiation_script && (
                  <motion.div
                    key="negotiate"
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    transition={{ duration: 0.15 }}
                    className="p-4 rounded-lg bg-purple-500/5 border border-purple-500/20"
                  >
                    <p className="text-xs font-medium text-purple-400 mb-1.5 flex items-center gap-1.5">
                      <MessageSquare className="h-3.5 w-3.5" />
                      What to Say — Negotiation Script
                    </p>
                    <p className="text-sm text-purple-300 leading-relaxed italic">
                      &quot;{clause.negotiation_script}&quot;
                    </p>
                  </motion.div>
                )}

                {activeAction === "penalty" && clause.penalty_info && (
                  <motion.div
                    key="penalty"
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    transition={{ duration: 0.15 }}
                    className="p-4 rounded-lg bg-orange-500/5 border border-orange-500/20"
                  >
                    <p className="text-xs font-medium text-orange-400 mb-1.5 flex items-center gap-1.5">
                      <Gavel className="h-3.5 w-3.5" />
                      Penalty for Violation
                    </p>
                    <p className="text-sm text-orange-300 leading-relaxed">
                      {clause.penalty_info}
                    </p>
                  </motion.div>
                )}

                {activeAction === "eli5" && clause.risk_level !== "safe" && (
                  <motion.div
                    key="eli5"
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    transition={{ duration: 0.15 }}
                  >
                    <ELI5Section
                      clauseId={clause.id}
                      clauseText={clause.original_text}
                      explanation={clause.explanation}
                      riskLevel={clause.risk_level}
                      legalCitation={clause.legal_citation}
                      clauseType={clause.clause_type}
                    />
                  </motion.div>
                )}

                {activeAction === "community" &&
                  (clause.risk_level === "dangerous" || clause.risk_level === "illegal") && (
                    <motion.div
                      key="community"
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -5 }}
                      transition={{ duration: 0.15 }}
                    >
                      <CommunityInsight
                        clauseId={clause.id}
                        clauseText={clause.original_text}
                        clauseType={clause.clause_type}
                        jurisdiction={jurisdiction}
                        riskLevel={clause.risk_level}
                      />
                    </motion.div>
                  )}
              </AnimatePresence>

              {/* ── VERIFICATION BADGE (always visible at bottom) ── */}
              <div className="pt-1">
                {clause.verification_source === "database" && clause.confidence === "verified" ? (
                  <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-green-500/5 border border-green-500/15">
                    <ShieldCheck className="h-4 w-4 text-green-400" />
                    <span className="text-xs text-green-400 font-medium">
                      ⚖️ Verified — ClauseWall Legal Database
                    </span>
                  </div>
                ) : clause.verification_source === "database" ? (
                  <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-yellow-500/5 border border-yellow-500/15">
                    <ShieldAlert className="h-4 w-4 text-yellow-400" />
                    <span className="text-xs text-yellow-400 font-medium">
                      ⚠️ Partially Verified — Review Recommended
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-500/5 border border-blue-500/15">
                    <Bot className="h-4 w-4 text-blue-400" />
                    <span className="text-xs text-blue-400 font-medium">
                      🤖 AI Analysis — Verify Independently
                    </span>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}