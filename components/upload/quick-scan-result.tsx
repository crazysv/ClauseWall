"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Shield,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Scale,
  Loader2,
  ArrowRight,
  Upload,
  Sparkles,
  FileText,
  Database,
  Brain,
  CheckCheck,
  Clock,
  Cpu,
  Lock,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { createClient } from "@/lib/supabase/client";
import type { QuickAnalysisResult } from "@/lib/bot/quick-analyzer";
import type { MLScanResult, MLClauseResult } from "@/lib/ml/types";
import type { RiskLevel } from "@/types";

// CHANGED: result is now nullable, mlResult is new
interface QuickScanResultProps {
  result: QuickAnalysisResult | null;
  mlResult?: MLScanResult | null;
  documentId: string | null;
  onReset: () => void;
}

interface ProgressData {
  status: "pending" | "analyzing" | "completed" | "failed";
  progress: number;
  step: string;
  clauses_analyzed: number;
  total_clauses: number;
  overall_risk_score: number | null;
}

export default function QuickScanResult({
  result,
  mlResult,
  documentId,
  onReset,
}: QuickScanResultProps) {
  const [progressData, setProgressData] = useState<ProgressData>({
    status: "analyzing",
    progress: 5,
    step: "Starting analysis...",
    clauses_analyzed: 0,
    total_clauses: 0,
    overall_risk_score: null,
  });

  // CHANGED: Animated score that transitions smoothly between ML → Quick Scan
  const [animatedScore, setAnimatedScore] = useState(0);
  const prevScoreRef = useRef(0);

  const supabase = createClient();

  // --- Computed display values ---
  const displayScore = result?.risk_score ?? mlResult?.overallScore ?? 0;
  const displayClauses =
    result?.total_clauses_found ?? mlResult?.totalClauses ?? 0;
  const displayDocType = result?.document_type_detected ?? "Analyzing...";
  const isPreliminary = !result && !!mlResult;
  const hasML = !!mlResult;

  // --- Animate score (handles ML→QuickScan transition) ---
  useEffect(() => {
    const from = prevScoreRef.current;
    const to = displayScore;
    prevScoreRef.current = to;

    if (from === to) {
      setAnimatedScore(to);
      return;
    }

    const duration = 600;
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setAnimatedScore(Math.round(from + (to - from) * eased));

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [displayScore]);

  // --- Poll for full analysis progress ---
  useEffect(() => {
    if (!documentId) return;

    const checkProgress = async () => {
      const { data, error } = await supabase
        .from("documents")
        .select(
          "analysis_status, analysis_progress, analysis_step, clauses_analyzed, total_clauses, overall_risk_score",
        )
        .eq("id", documentId)
        .single();

      if (data && !error) {
        setProgressData({
          status: data.analysis_status || "analyzing",
          progress: data.analysis_progress || 5,
          step: data.analysis_step || "Processing...",
          clauses_analyzed: data.clauses_analyzed || 0,
          total_clauses: data.total_clauses || 0,
          overall_risk_score: data.overall_risk_score,
        });

        if (
          data.analysis_status === "completed" ||
          data.analysis_status === "failed"
        ) {
          return true;
        }
      }
      return false;
    };

    checkProgress();

    const interval = setInterval(async () => {
      const shouldStop = await checkProgress();
      if (shouldStop) clearInterval(interval);
    }, 1500);

    return () => clearInterval(interval);
  }, [documentId]);

  // --- Helper functions ---

  const getTrafficLight = (score: number) => {
    if (score >= 80)
      return {
        color: "text-red-500",
        bg: "bg-red-950/10",
        border: "border border-red-900/40 shadow-[0_0_30px_rgba(220,38,38,0.15)]",
        label: "CRITICAL RISK",
        sublabel: "Do NOT sign this contract",
        icon: <Scale className="h-12 w-12 text-red-500" />,
        emoji: "⛔",
      };
    if (score >= 60)
      return {
        color: "text-red-400",
        bg: "bg-red-950/10",
        border: "border border-red-900/30",
        label: "HIGH RISK",
        sublabel: "Significant issues found",
        icon: <XCircle className="h-12 w-12 text-red-400" />,
        emoji: "🔴",
      };
    if (score >= 30)
      return {
        color: "text-amber-500",
        bg: "bg-amber-950/10",
        border: "border border-amber-900/30",
        label: "MEDIUM RISK",
        sublabel: "Some concerns to review",
        icon: <AlertTriangle className="h-12 w-12 text-amber-500" />,
        emoji: "🟡",
      };
    return {
      color: "text-emerald-500",
      bg: "bg-emerald-950/10",
      border: "border border-emerald-900/30",
      label: "LOW RISK",
      sublabel: "Looks mostly fair",
      icon: <CheckCircle2 className="h-12 w-12 text-emerald-500" />,
      emoji: "🟢",
    };
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case "illegal":
        return <Scale className="h-5 w-5 text-red-500" />;
      case "dangerous":
        return <XCircle className="h-5 w-5 text-red-400" />;
      case "warning":
        return <AlertTriangle className="h-5 w-5 text-amber-500" />;
      default:
        return <AlertTriangle className="h-5 w-5 text-amber-500" />;
    }
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case "illegal":
        return "bg-red-950/30 text-red-500 border border-red-900/50 font-mono text-[10px] uppercase tracking-widest";
      case "dangerous":
        return "bg-red-950/30 text-red-400 border border-red-900/50 font-mono text-[10px] uppercase tracking-widest";
      case "warning":
        return "bg-amber-950/30 text-amber-500 border border-amber-900/50 font-mono text-[10px] uppercase tracking-widest";
      default:
        return "bg-amber-950/30 text-amber-500 border border-amber-900/50 font-mono text-[10px] uppercase tracking-widest";
    }
  };

  const getStepIcon = (step: string) => {
    if (step.includes("Extracting")) return <FileText className="h-4 w-4" />;
    if (step.includes("Analyzing clause")) return <Brain className="h-4 w-4" />;
    if (step.includes("Saving")) return <Database className="h-4 w-4" />;
    if (step.includes("community")) return <Database className="h-4 w-4" />;
    if (step.includes("Calculating")) return <Scale className="h-4 w-4" />;
    if (step.includes("complete")) return <CheckCheck className="h-4 w-4" />;
    return <Clock className="h-4 w-4" />;
  };

  const getMLRiskConfig = (risk: RiskLevel) => {
    switch (risk) {
      case "illegal":
        return {
          color: "text-red-500",
          bg: "bg-[#0a0a0a]",
          border: "border border-red-900/50",
          label: "CRITICAL",
        };
      case "dangerous":
        return {
          color: "text-red-400",
          bg: "bg-[#0a0a0a]",
          border: "border border-red-900/50",
          label: "HIGH RISK",
        };
      case "warning":
        return {
          color: "text-amber-500",
          bg: "bg-[#0a0a0a]",
          border: "border border-amber-900/50",
          label: "CAUTION",
        };
      default:
        return {
          color: "text-emerald-500",
          bg: "bg-[#0a0a0a]",
          border: "border border-emerald-900/50",
          label: "LOW RISK",
        };
    }
  };

  // Early return if nothing to show
  if (!result && !mlResult) return null;

  const traffic = getTrafficLight(displayScore);
  const isAnalyzing =
    progressData.status === "analyzing" || progressData.status === "pending";
  const isCompleted = progressData.status === "completed";
  const isFailed = progressData.status === "failed";

  // ML clauses that are NOT safe — for preliminary display
  const preliminaryFlags =
    mlResult?.clauseResults.filter((c) => c.riskLevel !== "safe").slice(0, 5) ??
    [];

  return (
    <div className="space-y-6">
      {/* ============================================ */}
      {/* 1. TRAFFIC LIGHT BANNER                      */}
      {/* ============================================ */}
      <div className={`bg-[#0a0a0a] rounded-sm overflow-hidden relative ${traffic.border}`}>
        <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-red-500/20 to-transparent" />
        <div className="p-0">
          <div className={`${traffic.bg} p-8 text-center`}>
            {/* Preliminary badge — ML only mode */}
            {isPreliminary && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-4 flex justify-center"
              >
                <div className="flex items-center gap-2 bg-[#0e0e0e] text-cyan-400 font-mono text-[10px] tracking-widest uppercase border border-cyan-900/50 px-3 py-1.5 rounded-sm">
                  <Zap className="h-3.5 w-3.5" />
                  PRELIMINARY — On-device AI scan
                </div>
              </motion.div>
            )}

            <div className="flex justify-center mb-4">{traffic.icon}</div>
            <div className="flex items-center justify-center gap-3 mb-2">
              <h2 className={`text-sm font-mono tracking-widest uppercase ${traffic.color}`}>
                {traffic.label}
              </h2>
            </div>
            <p className="text-base font-bold text-neutral-300">
              {traffic.sublabel}
            </p>
            <div className="mt-4 flex items-center justify-center gap-2 drop-shadow-[0_0_15px_rgba(255,255,255,0.1)]">
              <span
                className={`text-7xl font-bold tracking-tighter ${traffic.color}`}
              >
                {animatedScore}
              </span>
              <span className="text-2xl font-bold text-neutral-600 mt-4">
                /100
              </span>
            </div>
            <div className="mt-4 flex items-center justify-center gap-3 text-[11px] font-mono tracking-widest uppercase text-neutral-500">
              <span>📄 {displayDocType}</span>
              <span className="text-neutral-800">•</span>
              <span>{displayClauses} clauses</span>
              {isPreliminary && mlResult && (
                <>
                  <span className="text-neutral-800">•</span>
                  <span className="flex items-center gap-1 text-amber-500/70">
                    <Cpu className="h-3 w-3" />
                    {mlResult.inferenceTimeMs.toFixed(0)}ms
                  </span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ============================================ */}
      {/* 2. ENHANCING INDICATOR — ML only mode         */}
      {/* ============================================ */}
      <AnimatePresence>
        {isPreliminary && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10, height: 0, marginBottom: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="bg-[#050505] border border-cyan-900/30 shadow-[0_0_20px_rgba(6,182,212,0.05)] rounded-sm p-4 relative overflow-hidden">
              <div className="absolute left-0 top-0 bottom-0 w-[1px] bg-gradient-to-b from-transparent via-cyan-500/50 to-transparent" />
              <div className="flex items-center gap-4 px-2">
                <div className="relative">
                  <Loader2 className="h-5 w-5 text-cyan-500 animate-spin" />
                  <div className="absolute inset-0 bg-cyan-500/20 blur-md rounded-full" />
                </div>
                <div className="flex-1">
                  <p className="text-[11px] font-mono tracking-widest uppercase text-cyan-400 mb-0.5">
                    Engaging Deep Verification...
                  </p>
                  <p className="text-[10px] uppercase tracking-widest font-mono text-neutral-600">
                    Comparing against 750+ localized rules
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ============================================ */}
      {/* 3. RED FLAGS / ML PRELIMINARY FLAGS           */}
      {/* ============================================ */}
      <AnimatePresence mode="wait">
        {result && result.red_flags.length > 0 && (
          <motion.div
            key="quick-flags"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="bg-[#0a0a0a] border border-neutral-800 rounded-sm mt-6 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-red-500/30 to-transparent" />
              <div className="p-6">
                <h3 className="text-[11px] font-mono uppercase tracking-widest text-red-500 mb-6 flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4" /> 🚩 RED FLAGS FOUND
                </h3>
                <div className="space-y-4">
                  {result.red_flags.map((flag, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.08 }}
                      className="flex items-start gap-4 p-5 bg-[#050505] border border-red-900/40 rounded-sm shadow-[0_0_15px_rgba(220,38,38,0.05)] relative"
                    >
                      <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-red-600/50" />
                      <div className="mt-0.5">
                        {getSeverityIcon(flag.severity)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2 flex-wrap">
                          <span className={getSeverityBadge(flag.severity) + " px-2 py-0.5 rounded-sm"}>
                            {flag.severity.toUpperCase()}
                          </span>
                          <span className="font-mono uppercase tracking-widest text-[11px] text-neutral-300">
                            {flag.title}
                          </span>
                        </div>
                        <p className="text-sm font-medium text-neutral-400 leading-relaxed">
                          {flag.explanation}
                        </p>
                        {flag.law_reference && (
                          <p className="text-[10px] uppercase tracking-widest font-mono text-cyan-500/80 mt-3 flex items-center gap-1.5">
                            <Database className="w-3 h-3" /> {flag.law_reference}
                          </p>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {isPreliminary && preliminaryFlags.length > 0 && (
          <motion.div
            key="ml-flags"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
          >
            <div className="bg-[#0a0a0a] border border-neutral-800 rounded-sm mt-6 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-amber-500/30 to-transparent" />
              <div className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-[11px] font-mono uppercase tracking-widest text-amber-500 flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4" /> 🚩 PRELIMINARY FLAGS
                  </h3>
                  <div className="bg-[#0e0e0e] text-amber-500/80 font-mono text-[9px] uppercase tracking-widest border border-amber-900/30 px-2 py-1 rounded-sm flex items-center gap-1.5">
                    <Cpu className="h-2.5 w-2.5" />
                    ON-DEVICE
                  </div>
                </div>
                <p className="text-[10px] font-mono tracking-widest text-neutral-600 mb-6 uppercase">
                  Based on ML classification • Detailed explanations loading...
                </p>
                <div className="space-y-3">
                  {preliminaryFlags.map((clause, i) => {
                    const config = getMLRiskConfig(clause.riskLevel);
                    const confPercent = Math.round(clause.confidence * 100);

                    return (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.06 }}
                        className={`flex items-start gap-4 p-4 bg-[#050505] rounded-sm relative ${config.border}`}
                      >
                        <div className={`mt-0.5 ${config.color}`}>
                          {getSeverityIcon(clause.riskLevel)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-2">
                            <span
                              className={`text-[9px] px-2 py-0.5 rounded-sm font-mono uppercase tracking-widest ${config.color} ${config.border} bg-[#0e0e0e]`}
                            >
                              {config.label}
                            </span>
                            <span className="text-[9px] font-mono uppercase tracking-widest text-neutral-500">
                              {confPercent}% Match
                            </span>
                          </div>
                          <p className="text-xs text-neutral-400 leading-relaxed line-clamp-2">
                            {clause.truncatedText}
                          </p>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* ML all safe — preliminary shows positive message */}
        {isPreliminary && preliminaryFlags.length === 0 && (
          <motion.div
            key="ml-safe"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <div className="bg-[#050505] border border-emerald-900/30 rounded-sm mt-6 p-8 text-center relative overflow-hidden">
              <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-emerald-500/30 to-transparent" />
              <CheckCircle2 className="h-10 w-10 text-emerald-500 mx-auto mb-4" />
              <p className="text-[11px] font-mono tracking-widest uppercase text-emerald-400 mb-1">
                PRELIMINARY SCAN NOMINAL
              </p>
              <p className="text-[10px] font-mono tracking-widest text-neutral-600 uppercase">
                AI verification in progress to confirm...
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ============================================ */}
      {/* 4. SAFE HIGHLIGHTS                            */}
      {/* ============================================ */}
      <AnimatePresence>
        {result?.safe_highlights && result.safe_highlights.length > 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="bg-[#050505] border border-emerald-900/30 rounded-sm p-6 relative overflow-hidden mt-6">
              <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-emerald-500/20 to-transparent" />
              <h3 className="text-[11px] font-mono uppercase tracking-widest text-emerald-500 mb-4 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" /> SAFE PROVISIONS
              </h3>
              <div className="space-y-3">
                {result.safe_highlights.map((highlight, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-3 text-xs text-neutral-400 font-mono tracking-wide"
                  >
                    <span className="text-emerald-500/50 mt-0.5">●</span>
                    {highlight}
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        ) : (
          isPreliminary && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div className="bg-[#050505] border border-neutral-900 rounded-sm p-6 mt-6">
                <Skeleton className="h-4 w-40 mb-4 bg-neutral-900" />
                <div className="space-y-4">
                  <Skeleton className="h-3 w-full bg-neutral-900" />
                  <Skeleton className="h-3 w-3/4 bg-neutral-900" />
                </div>
              </div>
            </motion.div>
          )
        )}
      </AnimatePresence>

      {/* ============================================ */}
      {/* 5. VERDICT                                    */}
      {/* ============================================ */}
      <AnimatePresence>
        {result?.one_line_verdict ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6"
          >
            <div className="bg-[#0a0a0a] border border-neutral-800 rounded-sm p-6 bg-[repeating-linear-gradient(45deg,transparent,transparent_10px,rgba(255,255,255,0.01)_10px,rgba(255,255,255,0.01)_20px)]">
              <h3 className="text-[11px] font-mono uppercase tracking-widest text-neutral-500 mb-3 flex items-center gap-2">
                <Brain className="w-4 h-4" /> SYSTEM VERDICT
              </h3>
              <p className="text-cyan-400 font-mono tracking-widest uppercase text-[11px] leading-relaxed">
                &gt; {result.one_line_verdict}
              </p>
            </div>
          </motion.div>
        ) : (
          isPreliminary && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="mt-6"
            >
              <div className="bg-[#0a0a0a] border border-neutral-800 rounded-sm p-6">
                <Skeleton className="h-4 w-32 mb-3 bg-neutral-900" />
                <Skeleton className="h-3 w-full bg-neutral-900" />
              </div>
            </motion.div>
          )
        )}
      </AnimatePresence>

      {/* ============================================ */}
      {/* 6. ML ATTRIBUTION — when both ML + Quick Scan */}
      {/* ============================================ */}
      {hasML && result && (
        <div className="flex flex-wrap items-center justify-center gap-4 text-[10px] uppercase font-mono tracking-widest text-neutral-500 mt-8">
          <span className="flex items-center gap-1.5 border border-neutral-800 bg-[#0e0e0e] px-2 py-1 rounded-sm">
            <Zap className="h-3 w-3 text-cyan-500" />
            ON-DEVICE: {mlResult!.inferenceTimeMs.toFixed(0)}ms
          </span>
          <span className="flex items-center gap-1.5 border border-neutral-800 bg-[#0e0e0e] px-2 py-1 rounded-sm">
            <Lock className="h-3 w-3 text-emerald-500" />
            0 BYTES EXFILTRATED
          </span>
        </div>
      )}

      {/* ML-only privacy badge */}
      {isPreliminary && (
        <div className="flex flex-wrap items-center justify-center gap-4 text-[10px] uppercase font-mono tracking-widest text-neutral-500 mt-8">
          <span className="flex items-center gap-1.5 border border-neutral-800 bg-[#0e0e0e] px-2 py-1 rounded-sm">
            <Cpu className="h-3 w-3 text-cyan-500" />
            TF.js v{mlResult!.modelVersion}
          </span>
          <span className="flex items-center gap-1.5 border border-neutral-800 bg-[#0e0e0e] px-2 py-1 rounded-sm">
            <Lock className="h-3 w-3 text-emerald-500" />
            LOCAL COMPUTE
          </span>
          <span className="flex items-center gap-1.5 border border-neutral-800 bg-[#0e0e0e] px-2 py-1 rounded-sm">
            <Brain className="h-3 w-3 text-cyan-500" />
            {mlResult!.featureCount} VECTORS
          </span>
        </div>
      )}

      {/* ============================================ */}
      {/* 7. FULL ANALYSIS PROGRESS                     */}
      {/* ============================================ */}
      {documentId && (
        <div
          className={`border border-neutral-800 rounded-sm mt-8 transition-all duration-500 overflow-hidden relative shadow-2xl ${isCompleted ? "bg-[#050905] border-emerald-900/30" : isFailed ? "bg-[#090505] border-red-900/30" : "bg-[#0a0a0a]"}`}
        >
          {isCompleted && <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent" />}
          {isFailed && <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-red-500/50 to-transparent" />}
          
          <div className="p-8">
            <AnimatePresence mode="wait">
              {isAnalyzing && (
                <motion.div
                  key="analyzing"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <div className="flex items-center gap-4 mb-6">
                    <div className="relative">
                      <Loader2 className="h-5 w-5 text-cyan-500 animate-spin" />
                      <div className="absolute inset-0 bg-cyan-500/20 blur-md rounded-full" />
                    </div>
                    <div>
                      <h3 className="text-[11px] font-mono tracking-widest uppercase text-cyan-400">
                        DEEP VERIFICATION SEQUENCE
                      </h3>
                      <p className="text-[10px] font-mono tracking-widest uppercase text-neutral-600 mt-1">
                        Cross-referencing legal database
                      </p>
                    </div>
                  </div>

                  <div className="mb-6">
                    <div className="flex justify-between text-[10px] font-mono uppercase tracking-widest text-neutral-500 mb-2">
                      <span className="flex items-center gap-2">
                        {getStepIcon(progressData.step)}
                        <span className="truncate max-w-[250px]">
                          {progressData.step}
                        </span>
                      </span>
                      <span className="text-cyan-500">
                        {progressData.progress}%
                      </span>
                    </div>
                    <div className="relative bg-black border border-neutral-800 rounded-full h-1.5 overflow-hidden">
                      <Progress
                        value={progressData.progress}
                        className="h-full bg-cyan-500/20 [&>div]:bg-cyan-500"
                      />
                    </div>
                  </div>

                  {progressData.total_clauses > 0 && (
                    <div className="flex items-center justify-between text-[11px] font-mono tracking-widest uppercase mb-6 p-4 border border-neutral-800 bg-[#0e0e0e] rounded-sm">
                      <div className="flex items-center gap-2 text-neutral-500">
                        <Brain className="h-3.5 w-3.5 text-cyan-500" />
                        <span>Clauses Processed</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <motion.span
                          key={progressData.clauses_analyzed}
                          initial={{ scale: 1.3, color: "#22d3ee" }}
                          animate={{ scale: 1, color: "#d4d4d8" }}
                          className="font-bold tracking-tight text-sm"
                        >
                          {progressData.clauses_analyzed}
                        </motion.span>
                        <span className="text-neutral-600">
                          / {progressData.total_clauses}
                        </span>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[9px] font-mono tracking-widest uppercase">
                    {[
                      {
                        icon: <Scale className="h-3 w-3" />,
                        text: "CITATIONS",
                      },
                      {
                        icon: <Shield className="h-3 w-3" />,
                        text: "ALTERNATIVES",
                      },
                      {
                        icon: <FileText className="h-3 w-3" />,
                        text: "SCRIPTS",
                      },
                      {
                        icon: <Database className="h-3 w-3" />,
                        text: "PENALTIES",
                      },
                    ].map((item, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-center sm:justify-start gap-2 text-neutral-500 p-2 border border-neutral-900 bg-black/30 rounded-sm"
                      >
                        <span className="text-cyan-500/70">{item.icon}</span>
                        {item.text}
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {isCompleted && (
                <motion.div
                  key="completed"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <div className="flex items-center gap-4 mb-6">
                    <div className="relative">
                      <ShieldCheck className="h-6 w-6 text-emerald-500" />
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.2 }}
                      >
                        <Sparkles className="h-3.5 w-3.5 text-emerald-400 absolute -top-1 -right-1" />
                      </motion.div>
                    </div>
                    <div>
                      <h3 className="text-[11px] font-mono tracking-widest uppercase text-emerald-500">
                        DEEP VERIFICATION COMPLETE
                      </h3>
                      <p className="text-[10px] font-mono tracking-widest uppercase text-neutral-600 mt-1">
                        All {progressData.total_clauses} components verified
                      </p>
                    </div>
                  </div>

                  {progressData.overall_risk_score !== null && (
                    <div className="grid grid-cols-2 gap-4 mb-8">
                      <div className="p-4 border border-neutral-800 bg-[#0a0a0a] rounded-sm text-center">
                        <span className="text-[9px] font-mono tracking-widest uppercase text-neutral-500 block mb-2">
                          Calculated Base Risk
                        </span>
                        <span
                          className={`text-3xl tracking-tighter font-bold ${getTrafficLight(progressData.overall_risk_score).color}`}
                        >
                          {progressData.overall_risk_score}/100
                        </span>
                      </div>
                      <div className="p-4 border border-neutral-800 bg-[#0a0a0a] rounded-sm text-center">
                        <span className="text-[9px] font-mono tracking-widest uppercase text-neutral-500 block mb-2">
                          Vectors Parsed
                        </span>
                        <span className="text-3xl tracking-tighter font-bold text-neutral-300">
                          {progressData.total_clauses}
                        </span>
                      </div>
                    </div>
                  )}

                  <Link href={`/results/${documentId}`} scroll={true} className="block group">
                    <Button className="w-full py-8 text-lg font-bold gap-3 rounded-sm bg-cyan-600 hover:bg-cyan-500 text-white shadow-[0_0_20px_rgba(8,145,178,0.15)] hover:shadow-[0_0_40px_rgba(8,145,178,0.3)] hover:-translate-y-0.5 transition-all duration-300 border-0">
                      <FileText className="h-5 w-5" />
                      ACCESS FORENSIC DOSSIER
                      <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </Link>

                  <p className="text-[9px] font-mono tracking-widest text-neutral-600 text-center mt-6 uppercase">
                    ⚖️ Citations • Negotiation Scripts • Revisions • Anomalies
                  </p>
                </motion.div>
              )}

              {isFailed && (
                <motion.div
                  key="failed"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <div className="flex items-center gap-3 mb-4">
                    <ShieldAlert className="h-5 w-5 text-red-500" />
                    <h3 className="text-[11px] font-mono tracking-widest uppercase text-red-500">
                      SEQUENCE FAILURE
                    </h3>
                  </div>
                  <p className="text-xs font-medium text-neutral-400 mb-6 leading-relaxed">
                    The deep analysis core encountered an irrecoverable error. Preliminary data remains valid.
                  </p>
                  <Button variant="outline" onClick={onReset} className="w-full py-6 bg-transparent border-red-900/50 hover:bg-red-950/30 text-red-400 hover:text-red-300 gap-2 font-mono text-[11px] tracking-widest uppercase rounded-sm">
                    <Upload className="h-4 w-4" />
                    ABORT AND RETRY
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      )}

      {/* ============================================ */}
      {/* 8. ACTIONS                                    */}
      {/* ============================================ */}
      <div className="flex justify-center gap-4 mt-8">
        <Button
          variant="outline"
          size="lg"
          onClick={onReset}
          className="bg-transparent border border-neutral-800 text-neutral-400 hover:text-white hover:bg-[#0e0e0e] hover:border-neutral-700 font-mono text-[10px] uppercase tracking-widest gap-2 py-6 rounded-sm w-full md:w-auto px-8"
        >
          <Upload className="h-4 w-4" />
          UPLOAD NEW EVIDENCE
        </Button>
      </div>

      {/* ============================================ */}
      {/* 9. DISCLAIMER                                 */}
      {/* ============================================ */}
      <p className="text-[9px] font-mono tracking-widest uppercase text-neutral-600 text-center mt-6">
        ROUTINE SCANS UTILIZE PRELIMINARY ON-DEVICE MODELS. FULL RESOLUTION REQUIRES DATABASE VERIFICATION.
      </p>
    </div>
  );
}
