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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { createClient } from "@/lib/supabase/client";
import type { QuickAnalysisResult } from "@/lib/bot/quick-analyzer";

interface QuickScanResultProps {
  result: QuickAnalysisResult;
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

  const supabase = createClient();
  const pollCount = useRef(0);

  // Poll for real-time progress updates
  useEffect(() => {
    if (!documentId) return;

    const checkProgress = async () => {
      pollCount.current++;

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

        // Stop polling once completed or failed
        if (data.analysis_status === "completed" || data.analysis_status === "failed") {
          return true; // Signal to stop polling
        }
      }

      return false; // Continue polling
    };

    // Check immediately
    checkProgress();

    // Poll every 1.5 seconds for smooth updates
    const interval = setInterval(async () => {
      const shouldStop = await checkProgress();
      if (shouldStop) {
        clearInterval(interval);
      }
    }, 1500);

    // Cleanup
    return () => clearInterval(interval);
  }, [documentId]);

  // Traffic light config
  const getTrafficLight = (score: number) => {
    if (score >= 80)
      return {
        color: "text-purple-500",
        bg: "bg-purple-500/10",
        border: "border-purple-500/30",
        glow: "shadow-purple-500/20",
        label: "CRITICAL RISK",
        sublabel: "Do NOT sign this contract",
        icon: <Scale className="h-12 w-12 text-purple-500" />,
        emoji: "⛔",
      };
    if (score >= 60)
      return {
        color: "text-red-500",
        bg: "bg-red-500/10",
        border: "border-red-500/30",
        glow: "shadow-red-500/20",
        label: "HIGH RISK",
        sublabel: "Significant issues found",
        icon: <XCircle className="h-12 w-12 text-red-500" />,
        emoji: "🔴",
      };
    if (score >= 30)
      return {
        color: "text-yellow-500",
        bg: "bg-yellow-500/10",
        border: "border-yellow-500/30",
        glow: "shadow-yellow-500/20",
        label: "MEDIUM RISK",
        sublabel: "Some concerns to review",
        icon: <AlertTriangle className="h-12 w-12 text-yellow-500" />,
        emoji: "🟡",
      };
    return {
      color: "text-green-500",
      bg: "bg-green-500/10",
      border: "border-green-500/30",
      glow: "shadow-green-500/20",
      label: "LOW RISK",
      sublabel: "Looks mostly fair",
      icon: <CheckCircle2 className="h-12 w-12 text-green-500" />,
      emoji: "🟢",
    };
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case "illegal":
        return <Scale className="h-5 w-5 text-purple-500" />;
      case "dangerous":
        return <XCircle className="h-5 w-5 text-red-500" />;
      case "warning":
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      default:
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
    }
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case "illegal":
        return "bg-purple-500/20 text-purple-400 border-purple-500/30";
      case "dangerous":
        return "bg-red-500/20 text-red-400 border-red-500/30";
      case "warning":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
      default:
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
    }
  };

  // Get step icon based on current step
  const getStepIcon = (step: string) => {
    if (step.includes("Extracting")) return <FileText className="h-4 w-4" />;
    if (step.includes("Analyzing clause")) return <Brain className="h-4 w-4" />;
    if (step.includes("Saving")) return <Database className="h-4 w-4" />;
    if (step.includes("community")) return <Database className="h-4 w-4" />;
    if (step.includes("Calculating")) return <Scale className="h-4 w-4" />;
    if (step.includes("complete")) return <CheckCheck className="h-4 w-4" />;
    return <Clock className="h-4 w-4" />;
  };

  const traffic = getTrafficLight(result.risk_score);
  const isAnalyzing = progressData.status === "analyzing" || progressData.status === "pending";
  const isCompleted = progressData.status === "completed";
  const isFailed = progressData.status === "failed";

  return (
    <div className="space-y-6">
      {/* Traffic Light Banner */}
      <Card
        className={`glass border ${traffic.border} shadow-lg ${traffic.glow} overflow-hidden`}
      >
        <CardContent className="p-0">
          <div className={`${traffic.bg} p-8 text-center`}>
            <div className="flex justify-center mb-4">{traffic.icon}</div>
            <div className="flex items-center justify-center gap-3 mb-2">
              <span className="text-3xl">{traffic.emoji}</span>
              <h2 className={`text-3xl font-bold ${traffic.color}`}>
                {traffic.label}
              </h2>
              <span className="text-3xl">{traffic.emoji}</span>
            </div>
            <p className="text-muted-foreground text-lg">{traffic.sublabel}</p>
            <div className="mt-4 flex items-center justify-center gap-2">
              <span className={`text-5xl font-bold ${traffic.color}`}>
                {result.risk_score}
              </span>
              <span className="text-2xl text-muted-foreground">/100</span>
            </div>
            <div className="mt-2 flex items-center justify-center gap-3 text-sm text-muted-foreground">
              <span>📄 {result.document_type_detected}</span>
              <span>•</span>
              <span>{result.total_clauses_found} clauses detected</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Red Flags */}
      {result.red_flags.length > 0 && (
        <Card className="glass border-white/5">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              🚩 Red Flags Found
            </h3>
            <div className="space-y-3">
              {result.red_flags.map((flag, i) => (
                <div
                  key={i}
                  className="flex items-start gap-3 p-4 rounded-xl bg-white/[0.03] border border-white/5"
                >
                  <div className="mt-0.5">{getSeverityIcon(flag.severity)}</div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <Badge className={getSeverityBadge(flag.severity)}>
                        {flag.severity.toUpperCase()}
                      </Badge>
                      <span className="font-medium text-sm">{flag.title}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {flag.explanation}
                    </p>
                    {flag.law_reference && (
                      <p className="text-xs text-blue-400 mt-1 flex items-center gap-1">
                        📖 {flag.law_reference}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Safe Highlights */}
      {result.safe_highlights.length > 0 && (
        <Card className="glass border-white/5">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              ✅ What Looks Good
            </h3>
            <div className="space-y-2">
              {result.safe_highlights.map((highlight, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 text-sm text-green-400"
                >
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                  {highlight}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Verdict */}
      <Card className="glass border-white/5">
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
            💬 Quick Verdict
          </h3>
          <p className="text-muted-foreground italic">
            &quot;{result.one_line_verdict}&quot;
          </p>
        </CardContent>
      </Card>

      {/* Real-Time Full Analysis Status */}
      <Card
        className={`glass border overflow-hidden transition-all duration-500 ${
          isCompleted
            ? "border-green-500/30 shadow-lg shadow-green-500/10"
            : isFailed
            ? "border-red-500/30 shadow-lg shadow-red-500/10"
            : "border-blue-500/20"
        }`}
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
                {/* Header */}
                <div className="flex items-center gap-3 mb-4">
                  <div className="relative">
                    <Loader2 className="h-6 w-6 text-blue-400 animate-spin" />
                    <div className="absolute inset-0 bg-blue-400/20 blur-md rounded-full" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">Full Analysis in Progress</h3>
                    <p className="text-xs text-muted-foreground">
                      Verifying against 750+ Indian legal rules
                    </p>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mb-3">
                  <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
                    <span className="flex items-center gap-1.5">
                      {getStepIcon(progressData.step)}
                      <span className="truncate max-w-[250px]">{progressData.step}</span>
                    </span>
                    <span className="font-mono font-medium text-blue-400">
                      {progressData.progress}%
                    </span>
                  </div>
                  <div className="relative">
                    <Progress value={progressData.progress} className="h-2.5" />
                    {/* Animated glow on progress */}
                    <motion.div
                      className="absolute top-0 h-2.5 bg-gradient-to-r from-transparent via-blue-400/50 to-transparent rounded-full"
                      style={{ width: "20%" }}
                      animate={{
                        left: ["0%", "80%", "0%"],
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut",
                      }}
                    />
                  </div>
                </div>

                {/* Clause Progress */}
                {progressData.total_clauses > 0 && (
                  <div className="flex items-center justify-between text-sm mb-4 p-3 rounded-lg bg-white/5">
                    <div className="flex items-center gap-2">
                      <Brain className="h-4 w-4 text-blue-400" />
                      <span className="text-muted-foreground">Clauses analyzed:</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <motion.span
                        key={progressData.clauses_analyzed}
                        initial={{ scale: 1.3, color: "#60a5fa" }}
                        animate={{ scale: 1, color: "#ffffff" }}
                        className="font-bold"
                      >
                        {progressData.clauses_analyzed}
                      </motion.span>
                      <span className="text-muted-foreground">
                        / {progressData.total_clauses}
                      </span>
                    </div>
                  </div>
                )}

                {/* What's Included */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {[
                    { icon: <Scale className="h-3 w-3" />, text: "Legal citations" },
                    { icon: <Shield className="h-3 w-3" />, text: "Fair alternatives" },
                    { icon: <FileText className="h-3 w-3" />, text: "Negotiation scripts" },
                    { icon: <Database className="h-3 w-3" />, text: "Penalty info" },
                  ].map((item, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-1.5 text-muted-foreground p-2 rounded bg-white/[0.02]"
                    >
                      <span className="text-blue-400">{item.icon}</span>
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
                    <ShieldCheck className="h-7 w-7 text-green-500" />
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.2 }}
                    >
                      <Sparkles className="h-3.5 w-3.5 text-green-400 absolute -top-1 -right-1" />
                    </motion.div>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-green-400">
                      ✅ Full Report Ready!
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      All {progressData.total_clauses} clauses verified
                    </p>
                  </div>
                </div>

                {/* Verified Score */}
                {progressData.overall_risk_score !== null && (
                  <div className="flex items-center gap-6 mb-5 p-4 rounded-xl bg-white/5">
                    <div>
                      <span className="text-xs text-muted-foreground block mb-1">
                        Verified Score
                      </span>
                      <span
                        className={`text-3xl font-bold ${
                          getTrafficLight(progressData.overall_risk_score).color
                        }`}
                      >
                        {progressData.overall_risk_score}/100
                      </span>
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground block mb-1">
                        Clauses Analyzed
                      </span>
                      <span className="text-3xl font-bold">
                        {progressData.total_clauses}
                      </span>
                    </div>
                  </div>
                )}

                {/* CTA Button */}
                <Link href={`/results/${documentId}`}>
                  <Button className="w-full bg-green-600 hover:bg-green-700 gap-2 py-6 text-lg shadow-lg shadow-green-500/20 group">
                    <FileText className="h-5 w-5" />
                    View Full Report
                    <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>

                <p className="text-xs text-muted-foreground text-center mt-3">
                  ⚖️ Verified citations • Negotiation scripts • Penalty info • Fair alternatives
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
                  <ShieldAlert className="h-6 w-6 text-red-400" />
                  <h3 className="text-lg font-semibold text-red-400">
                    Full Analysis Failed
                  </h3>
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  The detailed analysis encountered an error. The quick scan results above are still valid.
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

      {/* Actions */}
      <div className="flex justify-center gap-4">
        <Button variant="outline" size="lg" onClick={onReset} className="gap-2">
          <Upload className="h-5 w-5" />
          Analyze Another Contract
        </Button>
      </div>

      {/* Disclaimer */}
      <p className="text-xs text-muted-foreground text-center">
        🤖 Quick scan uses AI analysis. Full report includes verification
        against our legal database for higher accuracy.
      </p>
    </div>
  );
}