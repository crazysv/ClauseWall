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

export function QuickScanResult({
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
          "analysis_status, analysis_progress, analysis_step, clauses_analyzed, total_clauses, overall_risk_score"
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
        color: "text-purple-600",
        bg: "bg-purple-50",
        border: "border-purple-200 border-t-8 border-t-purple-500 rounded-xl",
        glow: "shadow-md shadow-purple-500/10",
        label: "CRITICAL RISK",
        sublabel: "Do NOT sign this contract",
        icon: <Scale className="h-12 w-12 text-purple-600" />,
        emoji: "⛔",
      };
    if (score >= 60)
      return {
        color: "text-rose-600",
        bg: "bg-rose-50",
        border: "border-rose-200 border-t-8 border-t-rose-500 rounded-xl",
        glow: "shadow-md shadow-rose-500/10",
        label: "HIGH RISK",
        sublabel: "Significant issues found",
        icon: <XCircle className="h-12 w-12 text-rose-600" />,
        emoji: "🔴",
      };
    if (score >= 30)
      return {
        color: "text-amber-600",
        bg: "bg-amber-50",
        border: "border-amber-200 border-t-8 border-t-amber-500 rounded-xl",
        glow: "shadow-md shadow-amber-500/10",
        label: "MEDIUM RISK",
        sublabel: "Some concerns to review",
        icon: <AlertTriangle className="h-12 w-12 text-amber-600" />,
        emoji: "🟡",
      };
    return {
      color: "text-emerald-600",
      bg: "bg-emerald-50",
      border: "border-emerald-200 border-t-8 border-t-emerald-500 rounded-xl",
      glow: "shadow-md shadow-emerald-500/10",
      label: "LOW RISK",
      sublabel: "Looks mostly fair",
      icon: <CheckCircle2 className="h-12 w-12 text-emerald-600" />,
      emoji: "🟢",
    };
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case "illegal":
        return <Scale className="h-5 w-5 text-purple-600" />;
      case "dangerous":
        return <XCircle className="h-5 w-5 text-rose-600" />;
      case "warning":
        return <AlertTriangle className="h-5 w-5 text-amber-600" />;
      default:
        return <AlertTriangle className="h-5 w-5 text-amber-600" />;
    }
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case "illegal":
        return "bg-purple-100 text-purple-700 border-purple-200 border-t-8 border-t-purple-500 rounded-xl";
      case "dangerous":
        return "bg-rose-100 text-rose-700 border-rose-200 border-t-8 border-t-rose-500 rounded-xl";
      case "warning":
        return "bg-amber-100 text-amber-700 border-amber-200 border-t-8 border-t-amber-500 rounded-xl";
      default:
        return "bg-amber-100 text-amber-700 border-amber-200 border-t-8 border-t-amber-500 rounded-xl";
    }
  };

  const getStepIcon = (step: string) => {
    if (step.includes("Extracting")) return <FileText className="h-4 w-4" />;
    if (step.includes("Analyzing clause"))
      return <Brain className="h-4 w-4" />;
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
          color: "text-purple-700",
          bg: "bg-purple-50",
          border: "border-purple-200 border-t-8 border-t-purple-500 rounded-xl",
          label: "CRITICAL",
        };
      case "dangerous":
        return {
          color: "text-rose-700",
          bg: "bg-rose-50",
          border: "border-rose-200 border-t-8 border-t-rose-500 rounded-xl",
          label: "HIGH RISK",
        };
      case "warning":
        return {
          color: "text-amber-700",
          bg: "bg-amber-50",
          border: "border-amber-200 border-t-8 border-t-amber-500 rounded-xl",
          label: "CAUTION",
        };
      default:
        return {
          color: "text-emerald-700",
          bg: "bg-emerald-50",
          border: "border-emerald-200 border-t-8 border-t-emerald-500 rounded-xl",
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
    mlResult?.clauseResults
      .filter((c) => c.riskLevel !== "safe")
      .slice(0, 5) ?? [];

  return (
    <div className="space-y-6">
      {/* ============================================ */}
      {/* 1. TRAFFIC LIGHT BANNER                      */}
      {/* ============================================ */}
      <Card
        className={`bg-white dark:bg-card shadow-sm dark:shadow-slate-900/20 border border-slate-200 dark:border-slate-700 rounded-xl ${traffic.border} shadow-lg ${traffic.glow} overflow-hidden`}
      >
        <CardContent className="p-0">
          <div className={`${traffic.bg} p-4 md:p-6 lg:p-8 text-center`}>
            {/* Preliminary badge — ML only mode */}
            {isPreliminary && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-3"
              >
                <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/30 gap-1.5 px-3 py-1">
                  <Zap className="h-3.5 w-3.5" />
                  PRELIMINARY — On-device AI scan
                </Badge>
              </motion.div>
            )}

            <div className="flex justify-center mb-4">{traffic.icon}</div>
            <div className="flex items-center justify-center gap-3 mb-2">
              <span className="text-xl md:text-lg md:text-xl lg:text-2xl lg:text-3xl">{traffic.emoji}</span>
              <h2 className={`text-xl md:text-lg md:text-xl lg:text-2xl lg:text-3xl font-bold ${traffic.color}`}>
                {traffic.label}
              </h2>
              <span className="text-xl md:text-lg md:text-xl lg:text-2xl lg:text-3xl">{traffic.emoji}</span>
            </div>
            <p className="text-slate-500 dark:text-slate-400 font-medium text-lg">{traffic.sublabel}</p>
            <div className="mt-4 flex items-center justify-center gap-2">
              <span className={`text-xl md:text-lg md:text-xl lg:text-2xl lg:text-3xl sm:text-lg md:text-xl lg:text-2xl md:text-xl md:text-lg md:text-xl lg:text-2xl lg:text-3xl lg:text-4xl text-balance md:text-5xl text-balance font-bold ${traffic.color}`}>
                {animatedScore}
              </span>
              <span className="text-lg md:text-xl lg:text-2xl text-slate-500 dark:text-slate-400 font-medium">/100</span>
            </div>
            <div className="mt-2 flex items-center justify-center gap-3 text-sm text-slate-500 dark:text-slate-400 font-medium">
              <span>📄 {displayDocType}</span>
              <span>•</span>
              <span>{displayClauses} clauses detected</span>
              {isPreliminary && mlResult && (
                <>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Cpu className="h-3 w-3 text-amber-400" />
                    {mlResult.inferenceTimeMs.toFixed(0)}ms
                  </span>
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

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
            <Card className="bg-white dark:bg-card shadow-sm dark:shadow-slate-900/20 border border-slate-200 dark:border-slate-700 rounded-xl-indigo-200 border-t-4 border-t-indigo-500 rounded-xl">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Loader2 className="h-5 w-5 text-indigo-600 animate-spin" />
                    <div className="absolute inset-0 bg-indigo-100 blur-md rounded-full" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">
                      Enhancing with AI analysis...
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                      Verifying against 750+ Indian legal rules • 3-5 seconds
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ============================================ */}
      {/* 3. RED FLAGS / ML PRELIMINARY FLAGS           */}
      {/* ============================================ */}
      <AnimatePresence mode="wait">
        {/* Quick Scan red flags — FULL VERSION */}
        {result && result.red_flags.length > 0 && (
          <motion.div
            key="quick-flags"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="bg-white dark:bg-card shadow-sm dark:shadow-slate-900/20 border border-slate-200 dark:border-slate-700 rounded-xl">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  🚩 Red Flags Found
                </h3>
                <div className="space-y-3">
                  {result.red_flags.map((flag, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.08 }}
                      className="flex items-start gap-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                    >
                      <div className="mt-0.5">
                        {getSeverityIcon(flag.severity)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <Badge className={getSeverityBadge(flag.severity)}>
                            {flag.severity.toUpperCase()}
                          </Badge>
                          <span className="font-medium text-sm">
                            {flag.title}
                          </span>
                        </div>
                        <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
                          {flag.explanation}
                        </p>
                        {flag.law_reference && (
                          <p className="text-xs text-indigo-600 mt-1 flex items-center gap-1">
                            📖 {flag.law_reference}
                          </p>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* ML Preliminary flags — COMPACT VERSION */}
        {isPreliminary && preliminaryFlags.length > 0 && (
          <motion.div
            key="ml-flags"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="bg-white dark:bg-card shadow-sm dark:shadow-slate-900/20 border border-slate-200 dark:border-slate-700 rounded-xl">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-1 flex items-center gap-2">
                  🚩 Preliminary Flags
                  <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/30 text-[10px] gap-1">
                    <Cpu className="h-2.5 w-2.5" />
                    ON-DEVICE
                  </Badge>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mb-4">
                  Based on ML classification • Detailed explanations loading...
                </p>
                <div className="space-y-2">
                  {preliminaryFlags.map((clause, i) => {
                    const config = getMLRiskConfig(clause.riskLevel);
                    const confPercent = Math.round(clause.confidence * 100);

                    return (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.06 }}
                        className={`flex items-start gap-3 p-3 rounded-lg ${config.bg} border ${config.border}`}
                      >
                        <div className={`mt-0.5 ${config.color}`}>
                          {getSeverityIcon(clause.riskLevel)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge
                              variant="outline"
                              className={`text-[10px] ${config.color} ${config.border}`}
                            >
                              {config.label}
                            </Badge>
                            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                              {confPercent}% confident
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium leading-relaxed line-clamp-2">
                            {clause.truncatedText}
                          </p>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
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
            <Card className="bg-white dark:bg-card shadow-sm dark:shadow-slate-900/20 border border-slate-200 dark:border-slate-700 rounded-xl-emerald-200">
              <CardContent className="p-6 text-center">
                <CheckCircle2 className="h-8 w-8 text-emerald-700 mx-auto mb-2" />
                <p className="text-sm font-medium text-emerald-700">
                  Preliminary scan looks good!
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1">
                  AI verification in progress to confirm...
                </p>
              </CardContent>
            </Card>
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
            <Card className="bg-white dark:bg-card shadow-sm dark:shadow-slate-900/20 border border-slate-200 dark:border-slate-700 rounded-xl">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  ✅ What Looks Good
                </h3>
                <div className="space-y-2">
                  {result.safe_highlights.map((highlight, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-2 text-sm text-emerald-700"
                    >
                      <CheckCircle2 className="h-4 w-4 shrink-0" />
                      {highlight}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ) : (
          isPreliminary && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <Card className="bg-white dark:bg-card shadow-sm dark:shadow-slate-900/20 border border-slate-200 dark:border-slate-700 rounded-xl">
                <CardContent className="p-6">
                  <Skeleton className="h-5 w-40 mb-3" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                  </div>
                </CardContent>
              </Card>
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
          >
            <Card className="bg-white dark:bg-card shadow-sm dark:shadow-slate-900/20 border border-slate-200 dark:border-slate-700 rounded-xl">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                  💬 Quick Verdict
                </h3>
                <p className="text-slate-500 dark:text-slate-400 font-medium italic">
                  &quot;{result.one_line_verdict}&quot;
                </p>
              </CardContent>
            </Card>
          </motion.div>
        ) : (
          isPreliminary && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <Card className="bg-white dark:bg-card shadow-sm dark:shadow-slate-900/20 border border-slate-200 dark:border-slate-700 rounded-xl">
                <CardContent className="p-6">
                  <Skeleton className="h-5 w-32 mb-2" />
                  <Skeleton className="h-4 w-full" />
                </CardContent>
              </Card>
            </motion.div>
          )
        )}
      </AnimatePresence>

      {/* ============================================ */}
      {/* 6. ML ATTRIBUTION — when both ML + Quick Scan */}
      {/* ============================================ */}
      {hasML && result && (
        <div className="flex items-center justify-center gap-4 text-xs text-slate-500 dark:text-slate-400 font-medium">
          <span className="flex items-center gap-1">
            <Zap className="h-3 w-3 text-amber-400" />
            Pre-scanned on-device in {mlResult!.inferenceTimeMs.toFixed(0)}ms
          </span>
          <span className="flex items-center gap-1">
            <Lock className="h-3 w-3 text-emerald-700" />
            No data left your device
          </span>
        </div>
      )}

      {/* ML-only privacy badge */}
      {isPreliminary && (
        <div className="flex items-center justify-center gap-4 text-xs text-slate-500 dark:text-slate-400 font-medium">
          <span className="flex items-center gap-1">
            <Cpu className="h-3 w-3 text-amber-400" />
            TF.js v{mlResult!.modelVersion}
          </span>
          <span className="flex items-center gap-1">
            <Lock className="h-3 w-3 text-emerald-700" />
            No data left your device
          </span>
          <span className="flex items-center gap-1">
            <Brain className="h-3 w-3 text-indigo-600" />
            {mlResult!.featureCount} features
          </span>
        </div>
      )}

      {/* ============================================ */}
      {/* 7. FULL ANALYSIS PROGRESS                     */}
      {/* ============================================ */}
      {documentId && (
        <Card
          className={`bg-white dark:bg-card shadow-sm dark:shadow-slate-900/20 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden transition-all duration-500 ${ isCompleted ? "border-emerald-200 border-t-8 border-t-emerald-500 rounded-xl shadow-lg shadow-green-500/10" : isFailed ? "border-rose-200 border-t-8 border-t-rose-500 rounded-xl shadow-lg shadow-rose-100" : "border-indigo-200 border-t-4 border-t-indigo-500 rounded-xl" }`}
        >
          <CardContent className="p-6">
            <AnimatePresence mode="wait">
              {isAnalyzing && (
                <motion.div
                  key="analyzing"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="relative">
                      <Loader2 className="h-6 w-6 text-indigo-600 animate-spin" />
                      <div className="absolute inset-0 bg-indigo-100 blur-md rounded-full" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold">
                        Full Analysis in Progress
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                        Verifying against 750+ Indian legal rules
                      </p>
                    </div>
                  </div>

                  <div className="mb-3">
                    <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 font-medium mb-1.5">
                      <span className="flex items-center gap-1.5">
                        {getStepIcon(progressData.step)}
                        <span className="truncate max-w-[250px]">
                          {progressData.step}
                        </span>
                      </span>
                      <span className="font-mono font-medium text-indigo-600">
                        {progressData.progress}%
                      </span>
                    </div>
                    <div className="relative">
                      <Progress
                        value={progressData.progress}
                        className="h-2.5"
                      />
                      <motion.div
                        className="absolute top-0 h-2.5 bg-gradient-to-r from-transparent via-indigo-400/50 to-transparent rounded-full"
                        style={{ width: "20%" }}
                        animate={{ left: ["0%", "80%", "0%"] }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          ease: "easeInOut",
                        }}
                      />
                    </div>
                  </div>

                  {progressData.total_clauses > 0 && (
                    <div className="flex items-center justify-between text-sm mb-4 p-3 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl">
                      <div className="flex items-center gap-2">
                        <Brain className="h-4 w-4 text-indigo-600" />
                        <span className="text-slate-500 dark:text-slate-400 font-medium">
                          Clauses analyzed:
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <motion.span
                          key={progressData.clauses_analyzed}
                          initial={{ scale: 1.3, color: "#4f46e5" }}
                          animate={{ scale: 1, color: "#ffffff" }}
                          className="font-bold"
                        >
                          {progressData.clauses_analyzed}
                        </motion.span>
                        <span className="text-slate-500 dark:text-slate-400 font-medium">
                          / {progressData.total_clauses}
                        </span>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {[
                      {
                        icon: <Scale className="h-3 w-3" />,
                        text: "Legal citations",
                      },
                      {
                        icon: <Shield className="h-3 w-3" />,
                        text: "Fair alternatives",
                      },
                      {
                        icon: <FileText className="h-3 w-3" />,
                        text: "Negotiation scripts",
                      },
                      {
                        icon: <Database className="h-3 w-3" />,
                        text: "Penalty info",
                      },
                    ].map((item, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 font-medium p-2 rounded bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                      >
                        <span className="text-indigo-600">{item.icon}</span>
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
                  <div className="flex items-center gap-3 mb-4">
                    <div className="relative">
                      <ShieldCheck className="h-7 w-7 text-emerald-600" />
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.2 }}
                      >
                        <Sparkles className="h-3.5 w-3.5 text-emerald-700 absolute -top-1 -right-1" />
                      </motion.div>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-emerald-700">
                        ✅ Full Report Ready!
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                        All {progressData.total_clauses} clauses verified
                      </p>
                    </div>
                  </div>

                  {progressData.overall_risk_score !== null && (
                    <div className="flex items-center gap-6 mb-5 p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl">
                      <div>
                        <span className="text-xs text-slate-500 dark:text-slate-400 font-medium block mb-1">
                          Verified Score
                        </span>
                        <span
                          className={`text-xl md:text-lg md:text-xl lg:text-2xl lg:text-3xl font-bold ${ getTrafficLight(progressData.overall_risk_score) .color }`}
                        >
                          {progressData.overall_risk_score}/100
                        </span>
                      </div>
                      <div>
                        <span className="text-xs text-slate-500 dark:text-slate-400 font-medium block mb-1">
                          Clauses Analyzed
                        </span>
                        <span className="text-xl md:text-lg md:text-xl lg:text-2xl lg:text-3xl font-bold">
                          {progressData.total_clauses}
                        </span>
                      </div>
                    </div>
                  )}

                  <Link href={`/results/${documentId}`} scroll={true}>
                    <Button className="w-full bg-emerald-600 hover:bg-emerald-700 gap-2 py-6 text-lg shadow-lg shadow-md shadow-emerald-500/10 group">
                      <FileText className="h-5 w-5" />
                      View Full Report
                      <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </Link>

                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium text-center mt-3">
                    ⚖️ Verified citations • Negotiation scripts • Penalty info •
                    Fair alternatives
                  </p>
                </motion.div>
              )}

              {isFailed && (
                <motion.div
                  key="failed"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <ShieldAlert className="h-6 w-6 text-rose-700" />
                    <h3 className="text-lg font-semibold text-rose-700">
                      Full Analysis Failed
                    </h3>
                  </div>
                  <p className="text-sm text-slate-500 dark:text-slate-400 font-medium mb-4">
                    The detailed analysis encountered an error. The scan results
                    above are still valid.
                  </p>
                  <Button
                    variant="outline"
                    onClick={onReset}
                    className="gap-2"
                  >
                    <Upload className="h-4 w-4" />
                    Try Again
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>
      )}

      {/* ============================================ */}
      {/* 8. ACTIONS                                    */}
      {/* ============================================ */}
      <div className="flex justify-center gap-4">
        <Button
          variant="outline"
          size="lg"
          onClick={onReset}
          className="gap-2"
        >
          <Upload className="h-5 w-5" />
          Analyze Another Contract
        </Button>
      </div>

      {/* ============================================ */}
      {/* 9. DISCLAIMER                                 */}
      {/* ============================================ */}
      <p className="text-xs text-slate-500 dark:text-slate-400 font-medium text-center">
        🤖 Quick scan uses AI analysis. Full report includes verification
        against our legal database for higher accuracy.
      </p>
    </div>
  );
}