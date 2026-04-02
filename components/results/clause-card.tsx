"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
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
  Target,
  Swords,
  ArrowRight,
  Scan,
  Flame,
  Pencil,
  Network,
  FileText
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ELI5Section } from "@/components/results/eli5-section";
import { CommunityInsight } from "@/components/results/community-insight";
import { KnowledgeGraphModal } from "@/components/results/knowledge-graph-modal";
import { DeceptionTab } from "@/components/results/deception-tab";
import { ProofSummary } from "@/components/results/proof-summary";
import { ProofTreeModal } from "@/components/results/proof-tree-modal";
import type { ProofTree } from "@/lib/reasoning/types";
import { DeliberationSummary } from "@/components/deliberation/deliberation-summary";
import { DeliberationModal } from "@/components/deliberation/deliberation-modal";
import type { ClauseDeliberation, AgentRole } from "@/lib/deliberation/types";
import { AudioPlayerInline } from "@/components/bhasha/audio-player-inline";
import type { SupportedLanguage } from "@/types/bhasha";

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
}

type ActionTab = "legal" | "fair" | "negotiate" | "penalty" | "eli5" | "community" | "deception" | "debate" | null;
type TabGroup = 'understand' | 'legal' | 'action' | null;

export function ClauseCard({
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
  detectedLanguage,
}: ClauseCardProps) {
  const prefersReducedMotion = useReducedMotion();
  const [activeAction, setActiveAction] = useState<ActionTab>(null);
  const [showProofModal, setShowProofModal] = useState(false);
  const [showGraph, setShowGraph] = useState(false);

  const [activeGroup, setActiveGroup] = useState<TabGroup>(null);
  const [activeSubTab, setActiveSubTab] = useState<string | null>(null);

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
    } catch {
        // Silently handled
      } finally {
      setIsDeliberating(false);
      setCurrentDelibAgent(null);
    }
  }

  let proofTree: ProofTree | null = null;
  try {
    if (clause.proof_data) {
      proofTree = typeof clause.proof_data === "string"
        ? JSON.parse(clause.proof_data)
        : clause.proof_data;
    }
  } catch {}

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

  const riskConfig = {
    safe: {
      icon: <CheckCircle2 className="h-4 w-4" />,
      borderClass: "border-l-emerald-500",
      badgeClass: "bg-emerald-500 text-white font-bold border-none",
      label: "Safe",
    },
    warning: {
      icon: <AlertTriangle className="h-4 w-4" />,
      borderClass: "border-l-amber-500",
      badgeClass: "bg-amber-500 text-white font-bold border-none",
      label: "Warning",
    },
    dangerous: {
      icon: <XCircle className="h-4 w-4" />,
      borderClass: "border-l-rose-500",
      badgeClass: "bg-rose-500 text-white font-bold border-none",
      label: "Dangerous",
    },
    illegal: {
      icon: <Scale className="h-4 w-4" />,
      borderClass: "border-l-purple-600",
      badgeClass: "bg-purple-600 text-white font-bold border-none",
      label: "Illegal",
    },
  };

  const risk = riskConfig[clause.risk_level as keyof typeof riskConfig] || riskConfig.warning;
  const showRoast = isRoastMode && !!roastText && (clause.risk_level === "dangerous" || clause.risk_level === "illegal");

  const verificationBadge = () => {
    if (clause.verification_source === "database" && clause.confidence === "verified") {
      return (
        <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-500 text-[10px] px-2 py-0.5 rounded-full font-bold gap-1 shadow-sm dark:shadow-slate-900/20" title="Verified against Indian legal database">
          <ShieldCheck className="h-3.5 w-3.5" />
          Verified ✓
        </Badge>
      );
    }
    if (clause.verification_source === "database") {
      return (
        <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-500 text-[10px] px-2 py-0.5 rounded-full font-bold gap-1 shadow-sm dark:shadow-slate-900/20" title="Partially verified against legal database">
          <ShieldAlert className="h-3.5 w-3.5" />
          Partial
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-500 text-[10px] px-2 py-0.5 rounded-full font-bold gap-1 shadow-sm dark:shadow-slate-900/20" title="AI-based assessment, not formally verified">
        <Bot className="h-3.5 w-3.5" />
        AI Suggested
      </Badge>
    );
  };

  const showAutopsy = (clause.risk_level === "dangerous" || clause.risk_level === "illegal") && !!onAutopsy;

  const tabGroups: { id: TabGroup; label: string; icon: React.ReactNode }[] = [
    { id: 'understand', label: 'Understand', icon: <Lightbulb className="w-4 h-4" /> },
    { id: 'legal', label: 'Legal Analysis', icon: <Scale className="w-4 h-4" /> },
    { id: 'action', label: 'Take Action', icon: <Target className="w-4 h-4" /> },
  ];

  return (
    <motion.div
      whileHover={prefersReducedMotion ? {} : { y: -2, boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}
      transition={{ duration: 0.2 }}
      className={`clause-card rounded-xl bg-white dark:bg-card transition-all duration-300 overflow-hidden border border-slate-200 dark:border-slate-700 border-l-4 shadow-sm dark:shadow-slate-900/20 ${ showRoast ? "ring-2 ring-orange-400" : "" } ${isExpanded ? "border-l-indigo-600 shadow-lg ring-1 ring-slate-100" : risk.borderClass}`}
    >
      {/* ── HEADER ── */}
      <div
        className={`flex items-start justify-between p-4 sm:p-5 cursor-pointer group transition-colors ${isExpanded ? "bg-slate-50 dark:bg-slate-800/80" : "hover:bg-slate-50 dark:hover:bg-slate-800 dark:bg-slate-800"}`}
        onClick={onToggle}
      >
        <div className="flex-1 min-w-0 pr-4">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <Badge variant="outline" className="text-slate-500 dark:text-slate-400 bg-white dark:bg-card border-slate-200 dark:border-slate-700 rounded-lg px-2 py-0.5 font-bold text-[10px] shadow-sm dark:shadow-slate-900/20">
              #{clause.clause_number}
            </Badge>
            
            <Badge className={`px-2.5 py-0.5 rounded-full ${risk.badgeClass} flex items-center gap-1.5 shadow-sm dark:shadow-slate-900/20`}>
              {risk.icon}
              {risk.label}
            </Badge>
            
            <span className="text-xs font-black text-slate-500 dark:text-slate-400 whitespace-nowrap bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full border border-slate-200 dark:border-slate-700">
              Score: {clause.risk_score}
            </span>
            
            {verificationBadge()}
            
            <Badge variant="outline" className="text-[10px] border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 rounded-full font-semibold bg-white dark:bg-card shadow-sm dark:shadow-slate-900/20">
              {clause.clause_type}
            </Badge>

            {showRoast && (
              <Badge className="bg-orange-100 text-orange-700 border-orange-300 text-[10px] px-2 rounded-full gap-1 font-bold shadow-sm dark:shadow-slate-900/20">
                <Flame className="h-3 w-3 text-orange-500" />
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
          <p className={`text-sm font-semibold transition-colors duration-200 line-clamp-1 ${isExpanded ? "text-indigo-900" : "text-slate-600 group-hover:text-slate-900 dark:text-slate-100"}`}>
            &quot;{(clause.explanation || clause.original_text || "")}&quot;
          </p>
        </div>
        <button className="p-1.5 mt-1 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-full flex-shrink-0 group-hover:bg-indigo-100 group-hover:text-indigo-600 transition-colors shadow-sm dark:shadow-slate-900/20" aria-label={isExpanded ? "Collapse clause" : "Expand clause"}>
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
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="overflow-hidden bg-white dark:bg-slate-900"
          >
            <div className="px-5 pb-5 space-y-6">
              <div className="border-t border-slate-100" />

              {/* Full Clause Text */}
              <div>
                <p className="text-[11px] font-bold text-slate-400 mb-2 uppercase tracking-wider flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5" /> Full Clause Text
                </p>
                <div className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-4 rounded-xl shadow-inner">
                  <p className="text-sm font-medium text-slate-700 leading-relaxed font-serif">
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
                    <p className="text-[11px] font-bold text-orange-500 mb-2 uppercase tracking-wider flex items-center gap-1.5">
                      <Flame className="h-4 w-4" /> Roasted Analysis 🔥
                    </p>
                    <div className="p-4 rounded-xl bg-gradient-to-br from-orange-50 to-orange-100 border border-orange-200 shadow-sm dark:shadow-slate-900/20">
                      <p className="text-sm text-orange-900 font-medium leading-relaxed">
                        {roastText}
                      </p>
                    </div>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-2 font-medium">
                      ⚠️ Roast mode provides blunt entertainment. Formal legal analysis continues below.
                    </p>
                  </motion.div>
                ) : (
                  <motion.div
                    key="analysis"
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    transition={{ duration: 0.2 }}
                    className="p-4 rounded-xl bg-indigo-50/50 border border-indigo-100 shadow-sm dark:shadow-slate-900/20"
                  >
                    <p className="text-[11px] font-bold text-indigo-500 mb-2 uppercase tracking-wider flex items-center gap-1.5">
                       Analysis
                    </p>
                    <p className="text-sm font-semibold text-indigo-950 leading-relaxed">
                      {clause.explanation}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Red Flags */}
              {clause.red_flags && clause.red_flags.length > 0 && (
                <div className="p-4 rounded-xl border border-rose-100 bg-rose-50/30">
                  <p className="text-[11px] font-bold text-rose-500 mb-3 uppercase tracking-wider flex items-center gap-1.5">
                    <AlertTriangle className="h-3.5 w-3.5" /> Red Flags
                  </p>
                  <ul className="space-y-2">
                    {clause.red_flags.map((flag, i) => (
                      <li key={i} className="flex items-start gap-2.5 text-sm font-medium text-rose-800">
                        <span className="text-rose-500 font-bold">•</span>
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

              {/* QUICK ACTIONS */}
              {clause.risk_level !== "safe" && (
                <div className="flex flex-wrap items-center gap-2 pt-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mr-2">
                    Actions
                  </span>

                  {showAutopsy && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onAutopsy!();
                      }}
                      className="inline-flex items-center gap-1.5 text-xs font-bold py-1.5 px-3 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 bg-white dark:bg-card shadow-sm dark:shadow-slate-900/20 hover:text-slate-900 dark:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800 hover:shadow transition-all"
                    >
                      <Scan className="w-3.5 h-3.5" /> Breakdown
                    </button>
                  )}

                  {!!onRewrite && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onRewrite();
                      }}
                       className="inline-flex items-center gap-1.5 text-xs font-bold py-1.5 px-3 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 bg-white dark:bg-card shadow-sm dark:shadow-slate-900/20 hover:text-slate-900 dark:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800 hover:shadow transition-all"
                    >
                      <Pencil className="w-3.5 h-3.5" /> Rewrite
                    </button>
                  )}

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowGraph(true);
                    }}
                     className="inline-flex items-center gap-1.5 text-xs font-bold py-1.5 px-3 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 bg-white dark:bg-card shadow-sm dark:shadow-slate-900/20 hover:text-slate-900 dark:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800 hover:shadow transition-all"
                  >
                    <Network className="w-3.5 h-3.5" /> Legal Web
                  </button>
                </div>
              )}

              {/* ── TAB GROUP NAVIGATION ── */}
              {clause.risk_level !== "safe" && (
                <div className="rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden bg-slate-50 dark:bg-slate-800">
                  {/* Level 1: Group Buttons */}
                  <div className="flex border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
                    {tabGroups.map((group) => {
                      const visibleTabs = getVisibleSubTabs(group.id);
                      if (visibleTabs.length === 0) return null;
                      const isActive = activeGroup === group.id;

                      return (
                        <button
                          key={group.id}
                          onClick={() => handleGroupClick(group.id)}
                          className={`flex-1 flex items-center justify-center gap-2 py-3 px-3 text-xs sm:text-sm font-bold transition-all duration-200 border-b-2 outline-none ${ isActive ? "text-indigo-600 border-indigo-600 bg-indigo-50/50" : "text-slate-500 border-transparent hover:text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 dark:bg-slate-800" }`}
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
                        transition={{ duration: 0.3, ease: "easeInOut" }}
                        className="overflow-hidden"
                      >
                        {/* Sub-tab buttons */}
                        <div className="flex gap-2 px-4 py-3 bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 overflow-x-auto scrollbar-hide">
                          {getVisibleSubTabs(activeGroup).map((subTab) => (
                            <button
                              key={subTab.id}
                              onClick={() => handleSubTabClick(subTab.id)}
                              className={`text-[11px] font-bold py-1.5 px-3 rounded-full transition-colors whitespace-nowrap shadow-sm dark:shadow-slate-900/20 ${ activeSubTab === subTab.id ? "text-white bg-indigo-600" : "text-slate-600 bg-white dark:bg-card hover:text-slate-900 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700" }`}
                            >
                              {subTab.label}
                            </button>
                          ))}
                        </div>

                        {/* Tab Content */}
                        {activeSubTab && (
                          <div className="p-5 bg-white dark:bg-slate-900">
                            <AnimatePresence mode="wait">
                              {activeSubTab === "legal" && clause.legal_citation && (
                                <motion.div
                                  key="legal"
                                  initial={{ opacity: 0, scale: 0.98 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  exit={{ opacity: 0, scale: 0.98 }}
                                  transition={{ duration: 0.15 }}
                                  className="p-5 rounded-xl bg-blue-50 border border-blue-100 shadow-sm dark:shadow-slate-900/20"
                                >
                                  <p className="text-[11px] font-extrabold text-blue-600 mb-2 flex items-center gap-1.5 uppercase tracking-wider">
                                    <Scale className="h-4 w-4" /> Legal Reference
                                  </p>
                                  <p className="text-sm font-medium text-blue-900 leading-relaxed">{clause.legal_citation}</p>
                                </motion.div>
                              )}

                              {activeSubTab === "fair" && clause.fair_alternative && (
                                <motion.div
                                  key="fair"
                                  initial={{ opacity: 0, scale: 0.98 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  exit={{ opacity: 0, scale: 0.98 }}
                                  transition={{ duration: 0.15 }}
                                  className="p-5 rounded-xl bg-emerald-50 border border-emerald-100 shadow-sm dark:shadow-slate-900/20"
                                >
                                  <p className="text-[11px] font-extrabold text-emerald-600 mb-2 flex items-center gap-1.5 uppercase tracking-wider">
                                    <CheckCircle2 className="h-4 w-4" /> Fair Alternative Setup
                                  </p>
                                  <p className="text-sm font-medium text-emerald-900 leading-relaxed">{clause.fair_alternative}</p>
                                  {documentId && clause.risk_level !== 'safe' && (
                                    <Link
                                      href={`/negotiate/${documentId}`}
                                      className="inline-flex items-center font-bold gap-1 text-[11px] text-emerald-700 hover:text-emerald-800 transition-colors mt-4"
                                    >
                                      Want help negotiating this? Request a playbook →
                                    </Link>
                                  )}
                                </motion.div>
                              )}

                              {activeSubTab === "negotiate" && (
                                <motion.div
                                  key="negotiate"
                                  initial={{ opacity: 0, scale: 0.98 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  exit={{ opacity: 0, scale: 0.98 }}
                                  transition={{ duration: 0.15 }}
                                  className="space-y-4"
                                >
                                  {clause.negotiation_script ? (
                                    <div className="p-5 rounded-xl bg-indigo-50 border border-indigo-100 shadow-sm dark:shadow-slate-900/20">
                                      <p className="text-[11px] font-extrabold text-indigo-600 mb-2 flex items-center gap-1.5 uppercase tracking-wider">
                                        <MessageSquare className="h-4 w-4" /> Recommended Script
                                      </p>
                                      <p className="text-sm font-medium text-indigo-900 leading-relaxed italic">
                                        &quot;{clause.negotiation_script}&quot;
                                      </p>
                                    </div>
                                  ) : (
                                    <div className="p-5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm dark:shadow-slate-900/20">
                                      <p className="text-[11px] font-extrabold text-slate-500 dark:text-slate-400 mb-2 flex items-center gap-1.5 uppercase tracking-wider">
                                        <MessageSquare className="h-4 w-4" /> Negotiation Data
                                      </p>
                                      <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                                        A detailed negotiation script sequence is generated within the playbook module.
                                      </p>
                                    </div>
                                  )}

                                  <a
                                    href={`/negotiate/${clause.document_id}`}
                                    className="flex items-center justify-between p-4 rounded-xl bg-white dark:bg-card border border-slate-200 dark:border-slate-700 shadow-sm dark:shadow-slate-900/20 hover:border-indigo-300 hover:shadow-md transition-all group"
                                  >
                                    <div className="flex items-center gap-2.5">
                                      <div className="p-1.5 bg-indigo-50 rounded-lg group-hover:bg-indigo-100 transition-colors">
                                        <Swords className="h-5 w-5 text-indigo-600" />
                                      </div>
                                      <span className="text-sm text-slate-800 dark:text-slate-200 font-bold group-hover:text-indigo-700 transition-colors">
                                        Launch Full Playbook
                                      </span>
                                    </div>
                                    <ArrowRight className="h-5 w-5 text-slate-400 group-hover:translate-x-1 group-hover:text-indigo-600 transition-all" />
                                  </a>
                                </motion.div>
                              )}

                              {activeSubTab === "penalty" && clause.penalty_info && (
                                <motion.div
                                  key="penalty"
                                  initial={{ opacity: 0, scale: 0.98 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  exit={{ opacity: 0, scale: 0.98 }}
                                  transition={{ duration: 0.15 }}
                                  className="p-5 rounded-xl bg-amber-50 border border-amber-200 shadow-sm dark:shadow-slate-900/20"
                                >
                                  <p className="text-[11px] font-extrabold text-amber-600 mb-2 flex items-center gap-1.5 uppercase tracking-wider">
                                    <Gavel className="h-4 w-4" /> Threat Matrix
                                  </p>
                                  <p className="text-sm font-medium text-amber-900 leading-relaxed">{clause.penalty_info}</p>
                                </motion.div>
                              )}

                              {activeSubTab === "eli5" && clause.risk_level !== "safe" && (
                                <motion.div
                                  key="eli5"
                                  initial={{ opacity: 0, scale: 0.98 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  exit={{ opacity: 0, scale: 0.98 }}
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
                                    initial={{ opacity: 0, scale: 0.98 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.98 }}
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
                                  initial={{ opacity: 0, scale: 0.98 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  exit={{ opacity: 0, scale: 0.98 }}
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
                                  initial={{ opacity: 0, scale: 0.98 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  exit={{ opacity: 0, scale: 0.98 }}
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
                                  initial={{ opacity: 0, scale: 0.98 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  exit={{ opacity: 0, scale: 0.98 }}
                                  transition={{ duration: 0.15 }}
                                  className="p-5 rounded-xl bg-blue-50 border border-blue-100 shadow-sm dark:shadow-slate-900/20"
                                >
                                  <p className="text-[11px] font-extrabold text-blue-600 mb-2 flex items-center gap-1.5 uppercase tracking-wider">
                                    <ShieldCheck className="h-4 w-4" /> Deep Proof Structure
                                  </p>
                                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-4">
                                    Secure logical resolution mapped to target statute thresholds.
                                  </p>
                                  <button
                                    onClick={() => setShowProofModal(true)}
                                    className="flex items-center gap-2 text-sm font-bold text-blue-600 hover:text-blue-700 transition-colors bg-white dark:bg-card px-4 py-2 border border-blue-200 rounded-lg shadow-sm dark:shadow-slate-900/20 w-fit"
                                  >
                                    Execute Proof Visualizer <ArrowRight className="h-4 w-4" />
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
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MODALS */}
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

      {proofTree && (
        <ProofTreeModal
          proofTree={proofTree}
          isOpen={showProofModal}
          onClose={() => setShowProofModal(false)}
        />
      )}

      {localDeliberation && (
        <DeliberationModal
          deliberation={localDeliberation}
          isOpen={showDeliberationModal}
          onClose={() => setShowDeliberationModal(false)}
        />
      )}
    </motion.div>
  );
}