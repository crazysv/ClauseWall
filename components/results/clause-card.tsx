"use client";

import { useState } from "react";
import Link from "next/link";
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
  Lightbulb,
  Users,
  Swords,
  ArrowRight,
  Scan,
  Flame,
  Pencil,
  Network,
  Eye,
  Target,
  BookOpen,
  FileText,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import ELI5Section from "@/components/results/eli5-section";
import CommunityInsight from "@/components/results/community-insight";
import KnowledgeGraphModal from "@/components/results/knowledge-graph-modal";
import DeceptionTab from "@/components/results/deception-tab";
import ProofSummary from "@/components/results/proof-summary";
import ProofTreeModal from "@/components/results/proof-tree-modal";
import type { ProofTree } from "@/lib/reasoning/types";
import DeliberationSummary from "@/components/deliberation/deliberation-summary";
import DeliberationModal from "@/components/deliberation/deliberation-modal";
import type { ClauseDeliberation, AgentRole } from "@/lib/deliberation/types";

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
}

type ActionTab = "legal" | "fair" | "negotiate" | "penalty" | "eli5" | "community" | "deception" | "debate" | null;
type TabGroup = 'understand' | 'legal' | 'action' | null;

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
  deliberation: initialDeliberation,
  documentId,
}: ClauseCardProps) {
  const [activeAction, setActiveAction] = useState<ActionTab>(null);
  const [showProofModal, setShowProofModal] = useState(false);
  const [showGraph, setShowGraph] = useState(false);

  // Tab group state
  const [activeGroup, setActiveGroup] = useState<TabGroup>(null);
  const [activeSubTab, setActiveSubTab] = useState<string | null>(null);

  // Deliberation state
  const [showDeliberationModal, setShowDeliberationModal] = useState(false);
  const [isDeliberating, setIsDeliberating] = useState(false);
  const [currentDelibAgent, setCurrentDelibAgent] = useState<AgentRole | null>(null);
  const [localDeliberation, setLocalDeliberation] = useState<ClauseDeliberation | null>(
    initialDeliberation || null
  );

  async function runSingleDeliberation() {
    setIsDeliberating(true);
    setCurrentDelibAgent("predator");
    try {
      const guardianTimer = setTimeout(() => setCurrentDelibAgent("guardian"), 3000);
      const arbiterTimer = setTimeout(() => setCurrentDelibAgent("arbiter"), 6000);

      const res = await fetch("/api/deliberation/single", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clauseText: clause.original_text,
          documentType,
          jurisdiction,
          clauseType: clause.clause_type,
        }),
      });

      clearTimeout(guardianTimer);
      clearTimeout(arbiterTimer);

      const data = await res.json();
      if (data.success && data.deliberation) {
        setLocalDeliberation(data.deliberation as ClauseDeliberation);
      }
    } catch (error) {
      console.error("[ClauseWall] Single deliberation failed:", error);
    } finally {
      setIsDeliberating(false);
      setCurrentDelibAgent(null);
    }
  }

  // Parse proof tree data
  let proofTree: ProofTree | null = null;
  try {
    if (clause.proof_data) {
      proofTree = typeof clause.proof_data === "string"
        ? JSON.parse(clause.proof_data)
        : clause.proof_data;
    }
  } catch {
    // Invalid proof data — ignore
  }

  // Sync grouped tabs with legacy activeAction for content rendering
  const handleGroupClick = (groupId: TabGroup) => {
    if (activeGroup === groupId) {
      setActiveGroup(null);
      setActiveSubTab(null);
      setActiveAction(null);
    } else {
      setActiveGroup(groupId);
      const visibleTabs = getVisibleSubTabs(groupId);
      const firstTab = visibleTabs[0]?.id || null;
      setActiveSubTab(firstTab);
      setActiveAction(firstTab as ActionTab);
    }
  };

  const handleSubTabClick = (tabId: string) => {
    setActiveSubTab(tabId);
    setActiveAction(tabId as ActionTab);
  };

  // Determine which sub-tabs are visible for each group
  function getVisibleSubTabs(groupId: TabGroup): { id: string; label: string }[] {
    switch (groupId) {
      case 'understand':
        return [
          ...(clause.risk_level !== "safe" ? [{ id: 'eli5', label: 'Plain English' }] : []),
          ...(clause.risk_level !== "safe" ? [{ id: 'deception', label: 'Hidden Traps' }] : []),
        ];
      case 'legal':
        return [
          ...(clause.legal_citation ? [{ id: 'legal', label: 'Legal Reference' }] : []),
          ...(clause.fair_alternative ? [{ id: 'fair', label: 'Fair Version' }] : []),
          ...(clause.penalty_info ? [{ id: 'penalty', label: 'Penalty Info' }] : []),
          ...((clause.risk_level === "dangerous" || clause.risk_level === "illegal") ? [{ id: 'community', label: 'Community Data' }] : []),
          ...(proofTree ? [{ id: 'proof', label: 'Legal Proof' }] : []),
        ];
      case 'action':
        return [
          ...(clause.risk_level !== "safe" ? [{ id: 'negotiate', label: 'Negotiation Script' }] : []),
          ...(clause.risk_level !== "safe" ? [{ id: 'debate', label: 'AI Debate' }] : []),
        ];
      default:
        return [];
    }
  }

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

  // Should show roast for this clause?
  const showRoast = isRoastMode && !!roastText && (clause.risk_level === "dangerous" || clause.risk_level === "illegal");

  // Verification badge
  const verificationBadge = () => {
    if (clause.verification_source === "database" && clause.confidence === "verified") {
      return (
        <Badge className="bg-green-500/15 text-green-400 border-green-500/30 text-[10px] px-1.5 gap-1" title="Verified against Indian legal database">
          <ShieldCheck className="h-3 w-3" />
          Verified
        </Badge>
      );
    }
    if (clause.verification_source === "database") {
      return (
        <Badge className="bg-yellow-500/15 text-yellow-400 border-yellow-500/30 text-[10px] px-1.5 gap-1" title="Partially verified against legal database">
          <ShieldAlert className="h-3 w-3" />
          Partial
        </Badge>
      );
    }
    return (
      <Badge className="bg-blue-500/15 text-blue-400 border-blue-500/30 text-[10px] px-1.5 gap-1" title="AI-based assessment, not formally verified">
        <Bot className="h-3 w-3" />
        AI
      </Badge>
    );
  };

  const showAutopsy =
    (clause.risk_level === "dangerous" || clause.risk_level === "illegal") && !!onAutopsy;

  // Tab group config
  const tabGroups: { id: TabGroup; label: string; icon: React.ReactNode }[] = [
    { id: 'understand', label: 'Understand', icon: <Lightbulb className="w-4 h-4" /> },
    { id: 'legal', label: 'Legal', icon: <Scale className="w-4 h-4" /> },
    { id: 'action', label: 'Take Action', icon: <Target className="w-4 h-4" /> },
  ];

  return (
    <div
      className={`rounded-xl border border-white/5 border-l-4 ${risk.borderClass} bg-gray-900/50 overflow-hidden transition-all ${
        showRoast ? "ring-1 ring-orange-500/20" : ""
      }`}
    >
      {/* ── HEADER ── */}
      <div
        className="flex items-start justify-between p-4 cursor-pointer hover:bg-white/[0.02] transition-colors"
        onClick={onToggle}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            {risk.icon}
            <Badge className={risk.badgeClass}>{risk.label}</Badge>
            <span className="text-xs text-gray-500" title="Risk score for this clause (0-100)">Score: {clause.risk_score}/100</span>
            <Badge variant="outline" className="text-[10px] border-white/10 text-gray-500">
              {clause.clause_type}
            </Badge>
            {verificationBadge()}
            {showRoast && (
              <Badge className="bg-orange-500/15 text-orange-400 border-orange-500/30 text-[10px] px-1.5 gap-1">
                <Flame className="h-3 w-3" />
                Roasted
              </Badge>
            )}
          </div>
          {/* Collapsed preview: show AI explanation instead of raw text */}
          <p className="text-sm text-white/60 line-clamp-2 italic">
            &quot;{(clause.explanation || clause.original_text || "").substring(0, 120)}
            {(clause.explanation || clause.original_text || "").length > 120 ? "..." : ""}&quot;
          </p>
        </div>
        <button className="p-1 ml-2 text-gray-500 flex-shrink-0" aria-label={isExpanded ? "Collapse clause" : "Expand clause"}>
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
              <div className="border-t border-white/5" />

              {/* Full Clause Text */}
              <div>
                <p className="text-xs font-medium text-gray-500 mb-1.5">Full Clause Text</p>
                <p className="text-sm text-gray-300 bg-white/[0.03] p-3 rounded-lg leading-relaxed">
                  {clause.original_text}
                </p>
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
                    <p className="text-xs font-medium text-orange-400 mb-1.5 flex items-center gap-1.5">
                      <Flame className="h-3.5 w-3.5" />
                      Roasted Analysis 🔥
                    </p>
                    <div className="p-4 rounded-lg bg-gradient-to-br from-orange-500/10 to-red-500/10 border border-orange-500/20">
                      <p className="text-sm text-orange-200 leading-relaxed">
                        {roastText}
                      </p>
                    </div>
                    <p className="text-[10px] text-gray-600 mt-1.5 italic">
                      ⚠️ Roast mode — entertainment + education. Formal legal analysis is above when roast mode is off.
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
                    <p className="text-xs font-medium text-gray-500 mb-1.5">Analysis</p>
                    <p className="text-sm text-gray-300 leading-relaxed">{clause.explanation}</p>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Red Flags */}
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

              {/* Legal Proof Summary */}
              <ProofSummary
                proofTree={proofTree}
                onViewProof={() => setShowProofModal(true)}
                documentId={documentId}
              />

              {/* ── QUICK ACTIONS — Compact CTA Row ── */}
              {clause.risk_level !== "safe" && (
                <div className="flex flex-wrap items-center gap-2 py-2">
                  <span className="text-[10px] text-white/30 font-medium uppercase tracking-wider mr-1">
                    Quick Actions
                  </span>

                  {showAutopsy && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onAutopsy!();
                      }}
                      className="inline-flex items-center gap-1.5 text-xs py-1.5 px-3 rounded-md border border-white/10 text-white/70 hover:text-white hover:bg-white/5 transition-colors"
                    >
                      <Scan className="w-3.5 h-3.5" />
                      Breakdown
                    </button>
                  )}

                  {!!onRewrite && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onRewrite();
                      }}
                      className="inline-flex items-center gap-1.5 text-xs py-1.5 px-3 rounded-md border border-white/10 text-white/70 hover:text-white hover:bg-white/5 transition-colors"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                      Rewrite
                    </button>
                  )}

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowGraph(true);
                    }}
                    className="inline-flex items-center gap-1.5 text-xs py-1.5 px-3 rounded-md border border-white/10 text-white/70 hover:text-white hover:bg-white/5 transition-colors"
                  >
                    <Network className="w-3.5 h-3.5" />
                    Legal Web
                  </button>
                </div>
              )}

              {/* ── TAB GROUP NAVIGATION ── */}
              {clause.risk_level !== "safe" && (
                <div>
                  {/* Level 1: Group Buttons */}
                  <div className="flex border-b border-white/10">
                    {tabGroups.map((group) => {
                      const visibleTabs = getVisibleSubTabs(group.id);
                      if (visibleTabs.length === 0) return null;
                      const isActive = activeGroup === group.id;

                      return (
                        <button
                          key={group.id}
                          onClick={() => handleGroupClick(group.id)}
                          className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 text-xs sm:text-sm font-medium transition-colors duration-200 border-b-2 focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:outline-none ${
                            isActive
                              ? "text-white border-blue-500 bg-white/5"
                              : "text-white/50 border-transparent hover:text-white/70 hover:bg-white/[0.02]"
                          }`}
                        >
                          {group.icon}
                          {group.label}
                        </button>
                      );
                    })}
                  </div>

                  {/* Level 2: Sub-tabs + Content */}
                  <AnimatePresence>
                    {activeGroup && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        {/* Sub-tab buttons */}
                        <div className="flex gap-1 px-2 py-1.5 bg-white/[0.02] border-b border-white/5 overflow-x-auto scrollbar-hide">
                          {getVisibleSubTabs(activeGroup).map((subTab) => (
                            <button
                              key={subTab.id}
                              onClick={() => handleSubTabClick(subTab.id)}
                              className={`text-xs py-1.5 px-3 rounded transition-colors duration-150 ${
                                activeSubTab === subTab.id
                                  ? "text-white bg-white/10"
                                  : "text-white/40 hover:text-white/60 hover:bg-white/5"
                              }`}
                            >
                              {subTab.label}
                            </button>
                          ))}
                        </div>

                        {/* Tab Content */}
                        {activeSubTab && (
                          <div className="pt-3">
                            <AnimatePresence mode="wait">
                              {activeSubTab === "legal" && clause.legal_citation && (
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
                                  <p className="text-sm text-blue-300 leading-relaxed">{clause.legal_citation}</p>
                                </motion.div>
                              )}

                              {activeSubTab === "fair" && clause.fair_alternative && (
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
                                  <p className="text-sm text-green-300 leading-relaxed">{clause.fair_alternative}</p>
                                  {/* Negotiate link for risky clauses */}
                                  {documentId && clause.risk_level !== 'safe' && (
                                    <Link
                                      href={`/negotiate/${documentId}`}
                                      className="inline-flex items-center gap-1 text-[10px] text-primary/50 hover:text-primary transition-colors mt-3"
                                    >
                                      Want help negotiating this? Get scripts →
                                    </Link>
                                  )}
                                </motion.div>
                              )}

                              {activeSubTab === "negotiate" && (
                                <motion.div
                                  key="negotiate"
                                  initial={{ opacity: 0, y: -5 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  exit={{ opacity: 0, y: -5 }}
                                  transition={{ duration: 0.15 }}
                                  className="space-y-3"
                                >
                                  {clause.negotiation_script ? (
                                    <div className="p-4 rounded-lg bg-purple-500/5 border border-purple-500/20">
                                      <p className="text-xs font-medium text-purple-400 mb-2 flex items-center gap-1.5">
                                        <MessageSquare className="h-3.5 w-3.5" />
                                        Negotiation Script
                                      </p>
                                      <p className="text-sm text-purple-300 leading-relaxed italic">
                                        &quot;{clause.negotiation_script}&quot;
                                      </p>
                                    </div>
                                  ) : (
                                    <div className="p-4 rounded-lg bg-purple-500/5 border border-purple-500/20">
                                      <p className="text-xs font-medium text-purple-400 mb-2 flex items-center gap-1.5">
                                        <MessageSquare className="h-3.5 w-3.5" />
                                        Negotiation Script
                                      </p>
                                      <p className="text-sm text-gray-400">
                                        A detailed negotiation script with counter-responses is available in the full playbook.
                                      </p>
                                    </div>
                                  )}

                                  <a
                                    href={`/negotiate/${clause.document_id}`}
                                    className="flex items-center justify-between p-3 rounded-lg bg-blue-500/5 border border-blue-500/20 hover:bg-blue-500/10 transition-colors group"
                                  >
                                    <div className="flex items-center gap-2">
                                      <Swords className="h-4 w-4 text-blue-400" />
                                      <span className="text-sm text-blue-400 font-medium">
                                        View Full Negotiation Playbook
                                      </span>
                                    </div>
                                    <ArrowRight className="h-4 w-4 text-blue-400 group-hover:translate-x-1 transition-transform" />
                                  </a>
                                </motion.div>
                              )}

                              {activeSubTab === "penalty" && clause.penalty_info && (
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
                                  <p className="text-sm text-orange-300 leading-relaxed">{clause.penalty_info}</p>
                                </motion.div>
                              )}

                              {activeSubTab === "eli5" && clause.risk_level !== "safe" && (
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

                              {activeSubTab === "community" &&
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
                                      communityMatch={clause.community_match}
                                    />
                                  </motion.div>
                                )}

                              {activeSubTab === "deception" && clause.risk_level !== "safe" && (
                                <motion.div
                                  key="deception"
                                  initial={{ opacity: 0, y: -5 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  exit={{ opacity: 0, y: -5 }}
                                  transition={{ duration: 0.15 }}
                                >
                                  <DeceptionTab
                                    clauseId={clause.id}
                                    clauseText={clause.original_text}
                                    clauseType={clause.clause_type}
                                    jurisdiction={jurisdiction}
                                    documentType={documentType}
                                  />
                                </motion.div>
                              )}

                              {activeSubTab === "debate" && clause.risk_level !== "safe" && (
                                <motion.div
                                  key="debate"
                                  initial={{ opacity: 0, y: -5 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  exit={{ opacity: 0, y: -5 }}
                                  transition={{ duration: 0.15 }}
                                >
                                  <DeliberationSummary
                                    deliberation={localDeliberation}
                                    onViewDebate={() => setShowDeliberationModal(true)}
                                    onTriggerDeliberation={runSingleDeliberation}
                                    isLoading={isDeliberating}
                                    currentAgent={currentDelibAgent}
                                    documentId={documentId}
                                  />
                                </motion.div>
                              )}

                              {activeSubTab === "proof" && proofTree && (
                                <motion.div
                                  key="proof"
                                  initial={{ opacity: 0, y: -5 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  exit={{ opacity: 0, y: -5 }}
                                  transition={{ duration: 0.15 }}
                                  className="p-4 rounded-lg bg-blue-500/5 border border-blue-500/20"
                                >
                                  <p className="text-xs font-medium text-blue-400 mb-2 flex items-center gap-1.5">
                                    <ShieldCheck className="h-3.5 w-3.5" />
                                    Legal Proof
                                  </p>
                                  <p className="text-xs text-white/40 mb-3">
                                    Step-by-step logical proof of this clause&apos;s legality
                                  </p>
                                  <button
                                    onClick={() => setShowProofModal(true)}
                                    className="flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300 transition-colors"
                                  >
                                    View Full Proof Tree <ArrowRight className="h-3.5 w-3.5" />
                                  </button>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}

              {/* Verification badge REMOVED from bottom — only in header now */}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Legal Web Modal */}
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

      {/* Proof Tree Modal */}
      {proofTree && (
        <ProofTreeModal
          proofTree={proofTree}
          isOpen={showProofModal}
          onClose={() => setShowProofModal(false)}
        />
      )}

      {/* AI Debate Modal */}
      {localDeliberation && (
        <DeliberationModal
          deliberation={localDeliberation}
          isOpen={showDeliberationModal}
          onClose={() => setShowDeliberationModal(false)}
        />
      )}

    </div>
  );
}