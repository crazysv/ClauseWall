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
      <div className="bg-[#050505] border border-neutral-900 rounded-sm p-5 relative overflow-hidden">
        <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-neutral-500/10 to-transparent pointer-events-none" />
        <p className="text-[9px] font-mono text-neutral-500 tracking-widest uppercase mb-4 text-center">
          [OVERALL VULNERABILITY FACTOR]
        </p>
        <div className="text-center mb-2">
          <span
            className="font-mono text-5xl tracking-tighter"
            style={{ color: riskColor }}
          >
            {document.overall_risk_score}
          </span>
        </div>
        <div className="text-center">
          <span
            className="inline-block border border-neutral-800 bg-[#0a0a0a] px-3 py-1 font-mono text-[10px] tracking-widest uppercase rounded-sm"
            style={{ color: riskColor, borderColor: `${riskColor}40` }}
          >
            {getRiskLabel(riskLevel)}
          </span>
        </div>
        <p className="text-[9px] font-mono text-neutral-600 tracking-widest uppercase text-center mt-3">
          ARRAY SPAN: {document.total_clauses} VECTORS
        </p>
      </div>

      {/* ── Breakdown ── */}
      <div className="grid grid-cols-2 gap-2">
        {[
          { count: document.safe_count, label: "SAFE", borderColor: "#10b981", textColor: "#10b981", bg: "bg-[#050a05]" },
          { count: document.warning_count, label: "WARNING", borderColor: "#f59e0b", textColor: "#f59e0b", bg: "bg-[#0a0805]" },
          { count: document.dangerous_count, label: "DANGEROUS", borderColor: "#ef4444", textColor: "#ef4444", bg: "bg-[#0a0505]" },
          { count: document.illegal_count, label: "ILLEGAL", borderColor: "#dc2626", textColor: "#dc2626", bg: "bg-[#1a0505]" },
        ].map((s) => (
          <div
            key={s.label}
            className={`border border-neutral-800 rounded-sm p-3 ${s.bg}`}
            style={{ borderLeftColor: s.borderColor, borderLeftWidth: "2px" }}
          >
            <p className="font-mono text-xl tracking-tighter" style={{ color: s.textColor }}>{s.count}</p>
            <p className="text-[9px] font-mono uppercase tracking-widest text-neutral-500 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* ── Entity ── */}
      {document.entity_name && (
        <div className="bg-[#050505] border border-neutral-900 rounded-sm p-4">
          <p className="text-[9px] font-mono text-cyan-600 tracking-widest uppercase mb-1">
            [IDENTIFIED ENTITY]
          </p>
          <p className="text-xs font-mono text-neutral-300 truncate">
            {document.entity_name}
          </p>
        </div>
      )}

      {/* ── Summary ── */}
      {document.summary && (
        <div className="bg-[#050505] border border-neutral-900 rounded-sm p-4">
          <p className="text-[9px] font-mono text-cyan-600 tracking-widest uppercase mb-2">
            [SUMMARY CONTEXT]
          </p>
          <p className="text-[10px] font-mono text-neutral-400 leading-relaxed">
            {document.summary}
          </p>
        </div>
      )}

      {/* ── Detected Issues ── */}
      {hasAnyDetectedIssue && (
        <div>
          <p className="text-[9px] font-mono text-neutral-500 tracking-widest uppercase mb-3">
            [DETECTED ANOMALIES]
          </p>
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
        <p className="text-[9px] font-mono text-cyan-600 tracking-widest uppercase mb-3">
          [RECOMMENDED ACTIONS]
        </p>
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
      <div className="border-t border-neutral-900 pt-4 mt-6">
        <button
          onClick={() => onSetAnalysisDetailsOpen(!analysisDetailsOpen)}
          className="w-full flex items-center justify-between py-2 group"
        >
          <span className="text-[10px] font-mono text-neutral-400 group-hover:text-white transition-colors uppercase tracking-widest">
            [SYS.META_DATA]
          </span>
          <div className="flex items-center gap-2">
            {!analysisDetailsOpen && (
              <span className="text-[9px] font-mono text-neutral-600 tracking-widest uppercase">
                {verificationStats.verification_rate}% VERIFIED
              </span>
            )}
            <ChevronDown
              className={`w-3 h-3 text-neutral-600 transition-transform ${analysisDetailsOpen ? "rotate-180" : ""}`}
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
                <div className="grid grid-cols-4 gap-1.5 pt-2">
                  <div className="text-center p-2 border border-emerald-900/50 bg-[#050a05]">
                    <p className="text-xs font-mono text-emerald-500">{verificationStats.verified}</p>
                    <p className="text-[7px] font-mono uppercase tracking-widest text-emerald-600">VERIFIED</p>
                  </div>
                  <div className="text-center p-2 border border-amber-900/50 bg-[#0a0805]">
                    <p className="text-xs font-mono text-amber-500">{verificationStats.partial}</p>
                    <p className="text-[7px] font-mono uppercase tracking-widest text-amber-600">PARTIAL</p>
                  </div>
                  <div className="text-center p-2 border border-cyan-900/50 bg-[#050b14]">
                    <p className="text-xs font-mono text-cyan-500">{verificationStats.ai_suggested}</p>
                    <p className="text-[7px] font-mono uppercase tracking-widest text-cyan-600">AI-ONLY</p>
                  </div>
                  <div className="text-center p-2 border border-neutral-800 bg-[#050505]">
                    <p className="text-xs font-mono text-neutral-400">{verificationStats.verification_rate}%</p>
                    <p className="text-[7px] font-mono uppercase tracking-widest text-neutral-600">COVERAGE</p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Advanced Tools ── */}
      <div className="border-t border-neutral-900 pt-4">
        <button
          onClick={() => onSetForensicsLabOpen(!forensicsLabOpen)}
          className="w-full flex items-center gap-2 py-2 group"
        >
          <span className="text-[10px] font-mono text-neutral-400 group-hover:text-white transition-colors uppercase tracking-widest">
            [DEEP_LAB_TOOLS]
          </span>
          <div className="flex-1 border-t border-neutral-900" />
          <ChevronDown
            className={`w-3 h-3 text-neutral-600 group-hover:text-neutral-400 transition-all ${forensicsLabOpen ? "rotate-180" : ""}`}
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
                  <p className="text-[9px] font-mono text-cyan-600 tracking-widest uppercase mb-1">
                    [TACTICAL RESPONSES]
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

                <div className="space-y-2 pt-3 border-t border-neutral-900">
                  <p className="text-[9px] font-mono text-cyan-600 tracking-widest uppercase mb-1">
                    [SIMULATION & FORENSICS]
                  </p>
                  <SimulatorCTA
                    documentId={documentId}
                    overallRiskScore={document.overall_risk_score}
                  />
                  <div id="ruin-calculator-cta">
                    <Link href={`/ruin-calculator/${documentId}`}>
                      <div className="bg-[#050505] border border-neutral-800 rounded-sm p-3 hover:border-red-900 hover:bg-[#0a0505] transition-colors cursor-pointer group">
                        <div className="flex items-center gap-2.5">
                          <div className="p-1.5 bg-red-900/30 border border-red-900/50 rounded-sm">
                            <BarChart3 className="w-3.5 h-3.5 text-red-500" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-[10px] font-mono uppercase tracking-widest text-red-500">
                              Financial Risk Calculator
                            </h4>
                            <p className="text-[9px] font-mono text-neutral-500 mt-1 uppercase tracking-widest">
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
                      <div className="bg-[#050505] border border-neutral-800 rounded-sm p-3 hover:border-indigo-900 hover:bg-[#05050a] transition-colors cursor-pointer group">
                        <div className="flex items-center gap-2.5">
                          <div className="p-1.5 bg-indigo-900/30 border border-indigo-900/50 rounded-sm">
                            <FileStack className="w-3.5 h-3.5 text-indigo-400" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-[10px] font-mono uppercase tracking-widest text-indigo-400">
                              Contract Vault
                            </h4>
                            <p className="text-[9px] font-mono text-neutral-500 mt-1 uppercase tracking-widest">
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
