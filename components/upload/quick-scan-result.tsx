"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
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

export default function QuickScanResult({
  result,
  documentId,
  onReset,
}: QuickScanResultProps) {
  const [fullAnalysisStatus, setFullAnalysisStatus] = useState<
    "pending" | "analyzing" | "completed" | "failed"
  >("analyzing");
  const [fullAnalysisScore, setFullAnalysisScore] = useState<number | null>(null);
  const [totalClauses, setTotalClauses] = useState<number | null>(null);

  const supabase = createClient();

  // Poll for full analysis completion
  useEffect(() => {
    if (!documentId) return;

    const checkStatus = async () => {
      const { data } = await supabase
        .from("documents")
        .select("analysis_status, overall_risk_score, total_clauses")
        .eq("id", documentId)
        .single();

      if (data) {
        setFullAnalysisStatus(data.analysis_status);
        if (data.analysis_status === "completed") {
          setFullAnalysisScore(data.overall_risk_score);
          setTotalClauses(data.total_clauses);
        }
      }
    };

    // Check immediately
    checkStatus();

    // Then poll every 3 seconds
    const interval = setInterval(checkStatus, 3000);

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

  const traffic = getTrafficLight(result.risk_score);

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

      {/* Full Analysis Status */}
      <Card
        className={`glass border overflow-hidden ${
          fullAnalysisStatus === "completed"
            ? "border-green-500/30 shadow-lg shadow-green-500/10"
            : "border-white/5"
        }`}
      >
        <CardContent className="p-6">
          {fullAnalysisStatus === "analyzing" ||
          fullAnalysisStatus === "pending" ? (
            <div>
              <div className="flex items-center gap-3 mb-3">
                <Loader2 className="h-5 w-5 text-blue-400 animate-spin" />
                <h3 className="text-lg font-semibold">
                  Full Analysis in Progress...
                </h3>
              </div>
              <p className="text-sm text-muted-foreground mb-3">
                Checking each clause against 750+ verified Indian legal rules.
                This takes 30-60 seconds.
              </p>
              <Progress value={40} className="h-2" />
              <p className="text-xs text-muted-foreground mt-2">
                ⚖️ Includes: Verified citations • Negotiation scripts • Penalty
                info • Fair alternatives
              </p>
            </div>
          ) : fullAnalysisStatus === "completed" ? (
            <div>
              <div className="flex items-center gap-3 mb-3">
                <div className="relative">
                  <ShieldCheck className="h-6 w-6 text-green-500" />
                  <Sparkles className="h-3 w-3 text-green-400 absolute -top-1 -right-1" />
                </div>
                <h3 className="text-lg font-semibold text-green-400">
                  ✅ Full Report Ready!
                </h3>
              </div>
              {fullAnalysisScore !== null && (
                <div className="flex items-center gap-4 mb-4 p-3 rounded-lg bg-white/5">
                  <div>
                    <span className="text-sm text-muted-foreground">
                      Verified Score:
                    </span>
                    <span
                      className={`text-2xl font-bold ml-2 ${getTrafficLight(fullAnalysisScore).color}`}
                    >
                      {fullAnalysisScore}/100
                    </span>
                  </div>
                  {totalClauses && (
                    <div>
                      <span className="text-sm text-muted-foreground">
                        Clauses Analyzed:
                      </span>
                      <span className="text-2xl font-bold ml-2">
                        {totalClauses}
                      </span>
                    </div>
                  )}
                </div>
              )}
              <Link href={`/results/${documentId}`}>
                <Button className="w-full bg-green-600 hover:bg-green-700 gap-2 py-5 text-lg shadow-lg shadow-green-500/20">
                  <FileText className="h-5 w-5" />
                  View Full Report
                  <ArrowRight className="h-5 w-5" />
                </Button>
              </Link>
              <p className="text-xs text-muted-foreground text-center mt-3">
                ⚖️ Verified citations • Negotiation scripts • Penalty info •
                Fair alternatives
              </p>
            </div>
          ) : (
            <div>
              <div className="flex items-center gap-3 mb-3">
                <ShieldAlert className="h-5 w-5 text-red-400" />
                <h3 className="text-lg font-semibold text-red-400">
                  Full Analysis Failed
                </h3>
              </div>
              <p className="text-sm text-muted-foreground">
                The detailed analysis encountered an error. The quick scan
                results above are still valid.
              </p>
            </div>
          )}
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