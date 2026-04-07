"use client";

import React from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronDown,
  BarChart3,
  FileStack,
} from "lucide-react";
import {
  getRiskLevel,
  getRiskLabel,
  RISK_COLORS,
} from "@/lib/utils/constants";
import { NextSteps } from "@/components/results/next-steps";
import PowerBalanceMeter from "@/components/results/power-balance-meter";
import EntityReputation from "@/components/results/entity-reputation";
import EscapeCTA from "@/components/results/escape-cta";
import SimulatorCTA from "@/components/results/simulator-cta";
import ComplaintCTA from "@/components/complaint/complaint-cta";
import { TimebombCTA } from "@/components/timebomb/timebomb-cta";
import { PoisonPillCTA } from "@/components/poisonpill/poison-pill-cta";
import ShadowCTA from "@/components/shadow/shadow-cta";
import DeliberationCTA from "@/components/deliberation/deliberation-cta";

import type { Document as DocType } from "@/types";
import type { StateMachineReport } from "@/lib/statemachine/types";
import type {
  TemporalExtractionResult,
  PoisonPillAnalysisResult,
} from "@/types";
import type {
  DeliberationResult,
  DeliberationProgress,
} from "@/lib/deliberation/types";

// Lazy imports for heavy components
import dynamic from "next/dynamic";
const StateMachineCTA = dynamic(
  () => import("@/components/statemachine/statemachine-cta"),
  { ssr: false },
);
const AuthoritySection = dynamic(
  () => import("@/components/authority/authority-section"),
  { ssr: false },
);
const EntityIntelligenceCard = dynamic(
  () => import("@/components/collective/entity-intelligence-card"),
  { ssr: false },
);

interface HybridClause {
  id: string;
  clause_type: string;
  risk_level: string;
  confidence?: "verified" | "partial" | "ai_suggested";
  explanation: string;
  [key: string]: unknown;
}

interface ContextRailProps {
  document: DocType;
  documentId: string;
  clauses: HybridClause[];

  // Analysis Details
  analysisDetailsOpen: boolean;
  onSetAnalysisDetailsOpen: (open: boolean) => void;
  verificationStats: {
    verified: number;
    partial: number;
    ai_suggested: number;
    verification_rate: number;
  };

  // Deliberation
  deliberationResult: DeliberationResult | null;
  isRunningDeliberation: boolean;
  deliberationProgress: DeliberationProgress | null;
  onRunFullDeliberation: () => void;
  onShowDeliberationView: () => void;

  // Advanced Tools
  forensicsLabOpen: boolean;
  onSetForensicsLabOpen: (open: boolean) => void;
  onShowStateMachineModal: () => void;
}

export default function ContextRail({
  document,
  documentId,
  clauses,
  analysisDetailsOpen,
  onSetAnalysisDetailsOpen,
  verificationStats,
  deliberationResult,
  isRunningDeliberation,
  deliberationProgress,
  onRunFullDeliberation,
  onShowDeliberationView,
  forensicsLabOpen,
  onSetForensicsLabOpen,
  onShowStateMachineModal,
}: ContextRailProps) {
  const riskLevel = getRiskLevel(document.overall_risk_score);
  const riskColor = RISK_COLORS[riskLevel];

  // Detected issues conditions
  const temporalData = document?.temporal_data as unknown as TemporalExtractionResult | null;
  const hasTimebombs = !!(temporalData as any)?.deadlines?.length;
  const poisonData = document?.poison_pill_data as unknown as PoisonPillAnalysisResult | null;
  const hasPoisonPills = (document.total_clauses || 0) >= 3;
  const shadowData = document.shadow_analysis_data as {
    trust_score?: number;
    total_mismatches?: number;
    critical_mismatches?: number;
    has_analysis?: boolean;
  } | null;
  const hasCriticalShadow =
    shadowData?.has_analysis === true &&
    (shadowData?.critical_mismatches ?? 0) > 0;
  const hasAnyDetectedIssue = hasTimebombs || hasPoisonPills || hasCriticalShadow;

  return (
    <div className="space-y-6">
      {/* ── Risk Score ── */}
      <div className="card-results-emphasis p-5 text-center">
        <p className="results-section-label mb-4">Risk Assessment</p>
        <div
          className="relative h-24 w-24 mx-auto rounded-full border-[3px] flex items-center justify-center mb-3"
          style={{ borderColor: riskColor, backgroundColor: '#111111' }}
        >
          <span
            className="font-space text-4xl font-black tabular-nums"
            style={{ color: riskColor }}
          >
            {document.overall_risk_score}
          </span>
        </div>
        <p
          className="font-space text-xs font-bold uppercase tracking-widest"
          style={{ color: riskColor }}
        >
          {getRiskLabel(riskLevel)}
        </p>
        <p className="text-[10px] text-[#6b6b6b] font-medium uppercase tracking-wider mt-1">
          {document.total_clauses} clauses analyzed
        </p>
      </div>

      {/* ── Breakdown ── */}
      <div className="grid grid-cols-2 gap-2">
        {[
          { count: document.safe_count, label: "Safe", borderColor: "#22c55e", textColor: "#22c55e" },
          { count: document.warning_count, label: "Warning", borderColor: "#eab308", textColor: "#eab308" },
          { count: document.dangerous_count, label: "Dangerous", borderColor: "#ef4444", textColor: "#ef4444" },
          { count: document.illegal_count, label: "Illegal", borderColor: "#a855f7", textColor: "#a855f7" },
        ].map((s) => (
          <div
            key={s.label}
            className="card-results p-3 border-l-4"
            style={{ borderLeftColor: s.borderColor }}
          >
            <p className="font-space text-lg font-bold tabular-nums" style={{ color: s.textColor }}>{s.count}</p>
            <p className="text-[10px] font-medium uppercase tracking-wider text-[#a3a3a3]">{s.label}</p>
          </div>
        ))}
      </div>

      {/* ── Entity ── */}
      {document.entity_name && (
        <div>
          <p className="results-section-label mb-1">
            Identified Entity
          </p>
          <p className="text-sm font-semibold text-[#fafafa] truncate">
            {document.entity_name}
          </p>
        </div>
      )}

      {/* ── Summary ── */}
      {document.summary && (
        <div>
          <p className="results-section-label mb-2">Summary</p>
          <p className="text-sm text-[#a3a3a3] leading-relaxed font-medium">
            {document.summary}
          </p>
        </div>
      )}

      {/* ── Detected Issues ── */}
      {hasAnyDetectedIssue && (
        <div>
          <p className="results-section-label mb-3">Detected Issues</p>
          <div className="space-y-2">
            {hasTimebombs && (
              <div id="timebomb-cta">
                <TimebombCTA
                  documentId={documentId}
                  temporalData={temporalData}
                  hasActivated={false}
                />
              </div>
            )}
            {hasPoisonPills && (
              <div id="poisonpill-cta">
                <PoisonPillCTA
                  documentId={documentId}
                  poisonPillData={poisonData}
                  totalClauses={document.total_clauses || 0}
                />
              </div>
            )}
            {hasCriticalShadow && (
              <div id="shadow-cta">
                <ShadowCTA
                  documentId={documentId}
                  shadowData={shadowData}
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Next Steps / Actions ── */}
      <div>
        <p className="results-section-label mb-3">Actions</p>
        <NextSteps
          overallRiskScore={document.overall_risk_score ?? 0}
          illegalCount={document.illegal_count ?? 0}
          dangerousCount={document.dangerous_count ?? 0}
          warningCount={document.warning_count ?? 0}
          documentId={documentId}
          hasStateMachine={!!document.state_machine_data}
          hasDeliberation={!!deliberationResult}
          entityName={document.entity_name || undefined}
        />
      </div>

      {/* ── Analysis Details ── */}
      <div className="border-t border-[#262626] pt-4">
        <button
          onClick={() => onSetAnalysisDetailsOpen(!analysisDetailsOpen)}
          className="w-full flex items-center justify-between py-2 group"
        >
          <span className="results-section-label group-hover:text-[#a3a3a3] transition-colors">
            Analysis Details
          </span>
          <div className="flex items-center gap-2">
            {!analysisDetailsOpen && (
              <span className="text-[9px] text-foreground/30">
                {verificationStats.verification_rate}% verified
              </span>
            )}
            <ChevronDown
              className={`w-3 h-3 text-foreground/30 transition-transform ${analysisDetailsOpen ? "rotate-180" : ""}`}
            />
          </div>
        </button>

        <AnimatePresence>
          {analysisDetailsOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="space-y-3 pt-2 pb-3">
                {/* Power Balance */}
                <PowerBalanceMeter
                  powerBalance={document.power_balance ?? null}
                />

                {/* Entity Reputation */}
                <EntityReputation
                  entityName={document.entity_name}
                  documentId={documentId}
                  jurisdiction={document.jurisdiction}
                  documentType={document.document_type}
                  overallRiskScore={document.overall_risk_score}
                  dangerousClauses={clauses
                    .filter((c) => c.risk_level === "dangerous")
                    .map((c) => c.explanation)}
                  illegalClauses={clauses
                    .filter((c) => c.risk_level === "illegal")
                    .map((c) => c.explanation)}
                />

                {/* Community Intelligence */}
                <EntityIntelligenceCard
                  entityName={document.entity_name}
                  documentId={documentId}
                  jurisdiction={document.jurisdiction || "pan_india"}
                  documentType={document.document_type || "other"}
                />

                {/* Verification Stats */}
                <div className="grid grid-cols-4 gap-1.5">
                  <div className="text-center p-2 border border-green-600 bg-green-950/30">
                    <p className="text-sm font-black tabular-nums text-green-400">{verificationStats.verified}</p>
                    <p className="text-[7px] font-bold uppercase text-green-300/60">Verified</p>
                  </div>
                  <div className="text-center p-2 border border-yellow-600 bg-yellow-950/30">
                    <p className="text-sm font-black tabular-nums text-yellow-400">{verificationStats.partial}</p>
                    <p className="text-[7px] font-bold uppercase text-yellow-300/60">Partial</p>
                  </div>
                  <div className="text-center p-2 border border-blue-600 bg-blue-950/30">
                    <p className="text-sm font-black tabular-nums text-blue-400">{verificationStats.ai_suggested}</p>
                    <p className="text-[7px] font-bold uppercase text-blue-300/60">AI-Only</p>
                  </div>
                  <div className="text-center p-2 border border-foreground/20 bg-foreground/5">
                    <p className="text-sm font-black tabular-nums text-foreground">{verificationStats.verification_rate}%</p>
                    <p className="text-[7px] font-bold uppercase text-foreground/40">Rate</p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Advanced Tools ── */}
      <div className="border-t border-[#262626] pt-4">
        <button
          onClick={() => onSetForensicsLabOpen(!forensicsLabOpen)}
          className="w-full flex items-center gap-2 py-2 group"
        >
          <span className="results-section-label group-hover:text-[#a3a3a3] transition-colors">
            More Tools
          </span>
          <div className="flex-1 border-t border-[#262626]" />
          <ChevronDown
            className={`w-3 h-3 text-foreground/20 group-hover:text-foreground/40 transition-all ${forensicsLabOpen ? "rotate-180" : ""}`}
          />
        </button>

        <AnimatePresence>
          {forensicsLabOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="overflow-hidden"
            >
              <div className="space-y-3 pt-2 pb-2">
                {/* Actions */}
                <div className="space-y-2">
                  <p className="results-section-label">
                    Take Action
                  </p>
                  <EscapeCTA
                    documentId={documentId}
                    dangerousCount={document.dangerous_count}
                    illegalCount={document.illegal_count}
                  />
                  <div id="complaint-cta">
                    <ComplaintCTA
                      documentId={documentId}
                      dangerousCount={document.dangerous_count}
                      illegalCount={document.illegal_count}
                      entityName={document.entity_name}
                    />
                  </div>
                  <div id="authority-section-cta">
                    <AuthoritySection
                      documentType={document.document_type}
                      jurisdiction={document.jurisdiction}
                      entityName={document.entity_name || ""}
                      clauseTypes={clauses
                        .map((c) => c.clause_type)
                        .filter(Boolean)}
                      preloadedRouting={(document as any).authority_routing || null}
                    />
                  </div>
                </div>

                <div className="space-y-2 pt-2 border-t border-[#262626]">
                  <p className="results-section-label">
                    Deep Analysis
                  </p>
                  <SimulatorCTA
                    documentId={documentId}
                    overallRiskScore={document.overall_risk_score}
                  />
                  <div id="ruin-calculator-cta">
                    <Link href={`/ruin-calculator/${documentId}`}>
                      <div className="card-results p-3 hover:bg-[#1f1f1f] transition-colors cursor-pointer group">
                        <div className="flex items-center gap-2.5">
                          <div className="p-1.5 bg-[#dc2626] rounded-lg">
                            <BarChart3 className="w-3.5 h-3.5 text-white" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-[10px] font-bold uppercase text-red-100">
                              Financial Risk Calculator
                            </h4>
                            <p className="text-[9px] text-[#a3a3a3] mt-0.5">
                              Monte Carlo simulation
                            </p>
                          </div>
                        </div>
                      </div>
                    </Link>
                  </div>

                  <div id="statemachine-cta">
                    {document.state_machine_data && (
                      <StateMachineCTA
                        report={
                          document.state_machine_data as unknown as StateMachineReport
                        }
                        onExplore={() => onShowStateMachineModal()}
                      />
                    )}
                  </div>

                  <div id="deliberation-cta">
                    <DeliberationCTA
                      result={deliberationResult}
                      isLoading={isRunningDeliberation}
                      progress={deliberationProgress}
                      onRun={onRunFullDeliberation}
                      onView={() => onShowDeliberationView()}
                    />
                  </div>

                  <div id="vault-cta">
                    <Link href="/vault">
                      <div className="card-results p-3 hover:bg-[#1f1f1f] transition-colors cursor-pointer group">
                        <div className="flex items-center gap-2.5">
                          <div className="p-1.5 bg-indigo-600 rounded-lg">
                            <FileStack className="w-3.5 h-3.5 text-white" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-[10px] font-bold uppercase text-indigo-100">
                              Contract Vault
                            </h4>
                            <p className="text-[9px] text-[#a3a3a3] mt-0.5">
                              Cross-analyze for conflicts
                            </p>
                          </div>
                        </div>
                      </div>
                    </Link>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
