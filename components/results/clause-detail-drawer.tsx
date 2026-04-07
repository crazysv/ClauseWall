"use client";

import { useState, useCallback, useEffect, useRef } from "react";

import Link from "next/link";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Scale,
  Lightbulb,
  Target,
  Gavel,
  MessageSquare,
  Swords,
  ArrowRight,
  ShieldCheck,
  Users,
  Eye,
  Network,
  BookOpen,
} from "lucide-react";
import ELI5Section from "@/components/results/eli5-section";
import CommunityInsight from "@/components/results/community-insight";
import DeceptionTab from "@/components/results/deception-tab";
import KnowledgeGraphModal from "@/components/results/knowledge-graph-modal";
import ProofSummary from "@/components/results/proof-summary";
import ProofTreeModal from "@/components/results/proof-tree-modal";
import DeliberationSummary from "@/components/deliberation/deliberation-summary";
import DeliberationModal from "@/components/deliberation/deliberation-modal";
import type { ProofTree } from "@/lib/reasoning/types";
import type { ClauseDeliberation, AgentRole } from "@/lib/deliberation/types";
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

type DrawerTab =
  | "eli5"
  | "deception"
  | "legal"
  | "fair"
  | "negotiate"
  | "penalty"
  | "community"
  | "debate"
  | "proof"
  | "legal_web";

interface ClauseDetailDrawerProps {
  clause: HybridClause | null;
  isOpen: boolean;
  onClose: () => void;
  initialTab?: DrawerTab | null;
  jurisdiction: string;
  documentType?: string;
  documentId?: string;
  deliberation?: ClauseDeliberation | null;
}

export default function ClauseDetailDrawer({
  clause,
  isOpen,
  onClose,
  initialTab,
  jurisdiction,
  documentType = "rental",
  documentId,
  deliberation: initialDeliberation,
}: ClauseDetailDrawerProps) {
  const [activeTab, setActiveTab] = useState<DrawerTab | null>(
    initialTab || null
  );
  const [showProofModal, setShowProofModal] = useState(false);
  const [showGraphModal, setShowGraphModal] = useState(false);

  // Deliberation state (moved from clause-card)
  const [showDelibModal, setShowDelibModal] = useState(false);
  const [isDeliberating, setIsDeliberating] = useState(false);
  const [currentDelibAgent, setCurrentDelibAgent] = useState<AgentRole | null>(
    null
  );
  const [localDeliberation, setLocalDeliberation] =
    useState<ClauseDeliberation | null>(initialDeliberation || null);

  // Track which clause the drawer was last synced for
  const lastSyncedClauseId = useRef<string | null>(null);

  // Sync initialTab ONLY when a new clause opens the drawer
  useEffect(() => {
    if (isOpen && clause && clause.id !== lastSyncedClauseId.current) {
      lastSyncedClauseId.current = clause.id;
      setActiveTab(initialTab || "eli5");
      // Also reset deliberation state for the new clause
      setLocalDeliberation(initialDeliberation || null);
      setShowProofModal(false);
      setShowGraphModal(false);
      setShowDelibModal(false);
      setIsDeliberating(false);
      setCurrentDelibAgent(null);
    }
  }, [isOpen, clause, initialTab, initialDeliberation]);

  // Sync deliberation from parent when it arrives (e.g. from full deliberation run)
  useEffect(() => {
    if (initialDeliberation && !isDeliberating) {
      setLocalDeliberation(initialDeliberation);
    }
  }, [initialDeliberation, isDeliberating]);

  // Reset synced clause tracking when drawer closes
  useEffect(() => {
    if (!isOpen) {
      lastSyncedClauseId.current = null;
    }
  }, [isOpen]);


  const runSingleDeliberation = useCallback(async () => {
    if (!clause) return;
    setIsDeliberating(true);
    setCurrentDelibAgent("predator");
    try {
      const guardianTimer = setTimeout(
        () => setCurrentDelibAgent("guardian"),
        3000
      );
      const arbiterTimer = setTimeout(
        () => setCurrentDelibAgent("arbiter"),
        6000
      );

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
  }, [clause, documentType, jurisdiction]);

  if (!clause) return null;

  // Parse proof tree
  let proofTree: ProofTree | null = null;
  try {
    if (clause.proof_data) {
      proofTree =
        typeof clause.proof_data === "string"
          ? JSON.parse(clause.proof_data)
          : clause.proof_data;
    }
  } catch {
    // Invalid proof data
  }

  // Risk config for header styling
  const riskConfig: Record<
    string,
    { icon: React.ReactNode; color: string; label: string }
  > = {
    safe: {
      icon: <CheckCircle2 className="h-5 w-5 text-green-600" />,
      color: "border-green-600",
      label: "Safe",
    },
    warning: {
      icon: <AlertTriangle className="h-5 w-5 text-yellow-600" />,
      color: "border-yellow-600",
      label: "Warning",
    },
    dangerous: {
      icon: <XCircle className="h-5 w-5 text-red-600" />,
      color: "border-red-600",
      label: "Dangerous",
    },
    illegal: {
      icon: <Scale className="h-5 w-5 text-purple-600" />,
      color: "border-purple-600",
      label: "Illegal",
    },
  };
  const risk = riskConfig[clause.risk_level] || riskConfig.warning;

  // Available tabs
  const tabs: { id: DrawerTab; label: string; icon: React.ReactNode; show: boolean }[] = [
    {
      id: "eli5",
      label: "Plain English",
      icon: <Lightbulb className="w-3.5 h-3.5" />,
      show: clause.risk_level !== "safe",
    },
    {
      id: "deception",
      label: "Hidden Traps",
      icon: <Eye className="w-3.5 h-3.5" />,
      show: clause.risk_level !== "safe",
    },
    {
      id: "legal",
      label: "Legal Ref",
      icon: <Scale className="w-3.5 h-3.5" />,
      show: !!clause.legal_citation,
    },
    {
      id: "fair",
      label: "Fair Version",
      icon: <CheckCircle2 className="w-3.5 h-3.5" />,
      show: !!clause.fair_alternative,
    },
    {
      id: "negotiate",
      label: "Negotiate",
      icon: <MessageSquare className="w-3.5 h-3.5" />,
      show: clause.risk_level !== "safe",
    },
    {
      id: "penalty",
      label: "Penalty",
      icon: <Gavel className="w-3.5 h-3.5" />,
      show: !!clause.penalty_info,
    },
    {
      id: "community",
      label: "Community",
      icon: <Users className="w-3.5 h-3.5" />,
      show:
        clause.risk_level === "dangerous" || clause.risk_level === "illegal",
    },
    {
      id: "debate",
      label: "AI Debate",
      icon: <Swords className="w-3.5 h-3.5" />,
      show: clause.risk_level !== "safe",
    },
    {
      id: "proof",
      label: "Legal Proof",
      icon: <ShieldCheck className="w-3.5 h-3.5" />,
      show: !!proofTree,
    },
    {
      id: "legal_web",
      label: "Legal Web",
      icon: <Network className="w-3.5 h-3.5" />,
      show: true,
    },
  ];

  const visibleTabs = tabs.filter((t) => t.show);

  return (
    <>
      <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <SheetContent
          side="right"
          className={`w-full sm:max-w-lg md:max-w-xl border-l-4 ${risk.color} bg-background overflow-y-auto p-0`}
          showCloseButton={true}
        >
          {/* ── Drawer Header ── */}
          <SheetHeader className="p-5 pb-4 border-b border-foreground/20 bg-muted/50 sticky top-0 z-10">
            <div className="flex items-center gap-2 mb-1">
              {risk.icon}
              <Badge
                variant="outline"
                className="text-[10px] uppercase font-bold border border-foreground/30"
              >
                {formatClauseType(clause.clause_type)}
              </Badge>
              <span className="text-xs font-bold tracking-wider text-foreground/60 uppercase">
                Clause {clause.clause_number}
              </span>
            </div>
            <SheetTitle className="text-base font-bold text-foreground">
              {risk.label} Clause — Deep Dive
            </SheetTitle>
            <SheetDescription className="text-xs font-medium text-foreground leading-relaxed line-clamp-2">
              {clause.explanation?.substring(0, 120)}
              {(clause.explanation?.length || 0) > 120 ? "..." : ""}
            </SheetDescription>
          </SheetHeader>

          {/* ── Tab Navigation ── */}
          <div className="flex gap-1 flex-wrap px-5 py-2.5 border-b border-foreground/10 bg-background sticky top-[108px] z-10">
            {visibleTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() =>
                  setActiveTab(activeTab === tab.id ? null : tab.id)
                }
                className={`inline-flex items-center gap-1 text-[10px] py-1 px-2 border transition-colors duration-150 font-bold uppercase tracking-wider ${
                  activeTab === tab.id
                    ? "text-background bg-foreground border-foreground"
                    : "text-foreground/60 border-foreground/15 hover:border-foreground/40 hover:text-foreground"
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>

          {/* ── Tab Content ── */}
          <div className="p-5 space-y-4">
            {/* ELI5 */}
            {activeTab === "eli5" && clause.risk_level !== "safe" && (
              <ELI5Section
                clauseId={clause.id}
                clauseText={clause.original_text}
                explanation={clause.explanation}
                riskLevel={clause.risk_level}
                legalCitation={clause.legal_citation}
                clauseType={clause.clause_type}
              />
            )}

            {/* Deception */}
            {activeTab === "deception" && clause.risk_level !== "safe" && (
              <DeceptionTab
                clauseId={clause.id}
                clauseText={clause.original_text}
                clauseType={clause.clause_type}
                jurisdiction={jurisdiction}
                documentType={documentType}
              />
            )}

            {/* Legal Reference */}
            {activeTab === "legal" && clause.legal_citation && (
              <div className="p-4 bg-blue-500/5 border-2 border-blue-600">
                <p className="text-xs font-black uppercase tracking-wider text-blue-600 mb-2 flex items-center gap-1.5">
                  <Scale className="h-3.5 w-3.5" />
                  Legal Reference
                </p>
                <p className="text-sm text-foreground leading-relaxed font-medium">
                  {clause.legal_citation}
                </p>
              </div>
            )}

            {/* Fair Alternative */}
            {activeTab === "fair" && clause.fair_alternative && (
              <div className="space-y-3">
                <div className="p-4 bg-green-500/5 border-2 border-green-600">
                  <p className="text-xs font-black uppercase tracking-wider text-green-600 mb-2 flex items-center gap-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Fair Alternative — What This Clause Should Say
                  </p>
                  <p className="text-sm text-foreground leading-relaxed font-medium">
                    {clause.fair_alternative}
                  </p>
                </div>
                {documentId && clause.risk_level !== "safe" && (
                  <Link
                    href={`/negotiate/${documentId}`}
                    className="inline-flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors font-bold uppercase tracking-wider"
                  >
                    Want help negotiating this? Get scripts →
                  </Link>
                )}
              </div>
            )}

            {/* Negotiation Script */}
            {activeTab === "negotiate" && (
              <div className="space-y-3">
                {clause.negotiation_script ? (
                  <div className="p-4 bg-purple-500/5 border-2 border-purple-600">
                    <p className="text-xs font-black uppercase tracking-wider text-purple-600 mb-2 flex items-center gap-1.5">
                      <MessageSquare className="h-3.5 w-3.5" />
                      Negotiation Script
                    </p>
                    <p className="text-sm text-foreground font-medium leading-relaxed italic">
                      &quot;{clause.negotiation_script}&quot;
                    </p>
                  </div>
                ) : (
                  <div className="p-4 bg-purple-500/5 border-2 border-purple-600">
                    <p className="text-xs font-black uppercase tracking-wider text-purple-600 mb-2 flex items-center gap-1.5">
                      <MessageSquare className="h-3.5 w-3.5" />
                      Negotiation Script
                    </p>
                    <p className="text-sm text-foreground font-medium">
                      A detailed negotiation script with counter-responses is
                      available in the full playbook.
                    </p>
                  </div>
                )}

                <a
                  href={`/negotiate/${clause.document_id}`}
                  className="flex items-center justify-between p-3 bg-blue-500/5 border-2 border-blue-600 hover:bg-blue-500/10 transition-colors group"
                >
                  <div className="flex items-center gap-2">
                    <Swords className="h-4 w-4 text-blue-600" />
                    <span className="text-sm text-blue-600 font-bold uppercase tracking-wider">
                      View Full Negotiation Playbook
                    </span>
                  </div>
                  <ArrowRight className="h-4 w-4 text-blue-600 group-hover:translate-x-1 transition-transform" />
                </a>
              </div>
            )}

            {/* Penalty Info */}
            {activeTab === "penalty" && clause.penalty_info && (
              <div className="p-4 bg-orange-500/5 border-2 border-orange-600">
                <p className="text-xs font-black uppercase tracking-wider text-orange-600 mb-2 flex items-center gap-1.5">
                  <Gavel className="h-3.5 w-3.5" />
                  Penalty for Violation
                </p>
                <p className="text-sm text-foreground font-medium leading-relaxed">
                  {clause.penalty_info}
                </p>
              </div>
            )}

            {/* Community Data */}
            {activeTab === "community" &&
              (clause.risk_level === "dangerous" ||
                clause.risk_level === "illegal") && (
                <CommunityInsight
                  clauseId={clause.id}
                  clauseText={clause.original_text}
                  clauseType={clause.clause_type}
                  jurisdiction={jurisdiction}
                  riskLevel={clause.risk_level}
                  communityMatch={clause.community_match}
                />
              )}

            {/* AI Debate / Deliberation */}
            {activeTab === "debate" && clause.risk_level !== "safe" && (
              <DeliberationSummary
                deliberation={localDeliberation}
                onViewDebate={() => setShowDelibModal(true)}
                onTriggerDeliberation={runSingleDeliberation}
                isLoading={isDeliberating}
                currentAgent={currentDelibAgent}
                documentId={documentId}
              />
            )}

            {/* Legal Proof Tree */}
            {activeTab === "proof" && proofTree && (
              <div className="space-y-3">
                <ProofSummary
                  proofTree={proofTree}
                  onViewProof={() => setShowProofModal(true)}
                  documentId={documentId}
                />
                <button
                  onClick={() => setShowProofModal(true)}
                  className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-500 transition-colors font-bold uppercase tracking-wider"
                >
                  View Full Proof Tree{" "}
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            )}

            {/* Legal Web / Knowledge Graph */}
            {activeTab === "legal_web" && (
              <div className="space-y-3">
                <p className="text-[10px] font-bold uppercase tracking-wider text-foreground/50 mb-2 flex items-center gap-1.5">
                  <Network className="h-3.5 w-3.5" />
                  Legal Knowledge Graph
                </p>
                <p className="text-sm text-foreground/70 font-medium">
                  Visualize how this clause connects to statutes, precedents, and related legal concepts.
                </p>
                <button
                  onClick={() => setShowGraphModal(true)}
                  className="inline-flex items-center gap-1.5 text-xs py-1.5 px-3 border border-foreground/30 text-foreground hover:bg-muted transition-colors font-bold uppercase tracking-wider"
                >
                  Open Knowledge Graph
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            )}

            {/* No tab selected */}
            {!activeTab && (
              <div className="text-center py-16 text-foreground/30">
                <BookOpen className="w-6 h-6 mx-auto mb-3" />
                <p className="text-xs font-medium">
                  Select a topic above to explore this clause further
                </p>
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* ── Proof Tree Modal ── */}
      {proofTree && (
        <ProofTreeModal
          proofTree={proofTree}
          isOpen={showProofModal}
          onClose={() => setShowProofModal(false)}
        />
      )}

      {/* ── Deliberation Modal ── */}
      {localDeliberation && (
        <DeliberationModal
          deliberation={localDeliberation}
          isOpen={showDelibModal}
          onClose={() => setShowDelibModal(false)}
        />
      )}

      {/* ── Knowledge Graph Modal ── */}
      {clause && showGraphModal && (
        <KnowledgeGraphModal
          isOpen={showGraphModal}
          onClose={() => setShowGraphModal(false)}
          clauseType={clause.clause_type}
          jurisdiction={jurisdiction}
          clauseText={clause.original_text}
          riskLevel={clause.risk_level}
        />
      )}
    </>
  );
}
