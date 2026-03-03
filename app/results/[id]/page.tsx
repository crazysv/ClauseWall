"use client";

import VerificationBadge from "@/components/results/verification-badge";
import { ShieldCheck, ShieldAlert, Bot } from "lucide-react";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  Shield,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  FileText,
  Download,
  Share2,
  Flag,
  ChevronDown,
  ChevronUp,
  Loader2,
  RefreshCw,
  Scale,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { createClient } from "@/lib/supabase/client";
import {
  getRiskLevel,
  getRiskLabel,
  getStateName,
  getDocumentTypeLabel,
  RISK_COLORS,
} from "@/lib/utils/constants";
import type { Document, Clause } from "@/types";
import { toast } from "sonner";

export default function ResultsPage() {
  const params = useParams();
  const documentId = params.id as string;

  const [document, setDocument] = useState<Document | null>(null);
  const [clauses, setClauses] = useState<Clause[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expandedClauses, setExpandedClauses] = useState<Set<string>>(new Set());
  const [refreshing, setRefreshing] = useState(false);

  const [verificationResults, setVerificationResults] = useState<Record<string, any>>({});
  const [verificationStats, setVerificationStats] = useState<any>(null);
  const [verifying, setVerifying] = useState(false);

  const supabase = createClient();

  // Fetch document and clauses
  const fetchData = async () => {
    try {
      // Fetch document
      const { data: doc, error: docError } = await supabase
        .from("documents")
        .select("*")
        .eq("id", documentId)
        .single();

      if (docError || !doc) {
        setError("Document not found");
        setLoading(false);
        return;
      }

      setDocument(doc as Document);

      // Fetch clauses if analysis is complete
      if (doc.analysis_status === "completed") {
        const { data: clauseData, error: clauseError } = await supabase
          .from("clauses")
          .select("*")
          .eq("document_id", documentId)
          .order("clause_number", { ascending: true });

        if (!clauseError && clauseData) {
          setClauses(clauseData as Clause[]);
        }
      }

      setLoading(false);
    } catch (err) {
      setError("Failed to load results");
      setLoading(false);
    }
  };

const verifyClausesWithDB = async () => {
  if (!document || clauses.length === 0) return;
  
  setVerifying(true);
  try {
    const response = await fetch("/api/verify-clauses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        documentId,
        jurisdiction: document.jurisdiction,
        documentType: document.document_type,
      }),
    });

    const data = await response.json();

    if (response.ok) {
      setVerificationResults(data.results);
      setVerificationStats(data.stats);
      toast.success(
        `Verification complete! ${data.stats.verified} citations verified.`
      );
    } else {
      toast.error("Verification failed");
    }
  } catch (err) {
    toast.error("Failed to verify citations");
  } finally {
    setVerifying(false);
  }
};

  useEffect(() => {
    fetchData();
  }, [documentId]);

  // Poll for updates if still analyzing
  useEffect(() => {
    if (document?.analysis_status === "analyzing" || document?.analysis_status === "pending") {
    const interval = setInterval(fetchData, 3000);
    return () => clearInterval(interval);
  }
  }, [document?.analysis_status]);

  // Trigger verification when clauses are loaded
  useEffect(() => {
    if (document && clauses.length > 0 && Object.keys(verificationResults).length === 0 && !verifying) {
      verifyClausesWithDB();
    }
  }, [document, clauses]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
    toast.success("Results refreshed");
  };

  const toggleClause = (clauseId: string) => {
    const newExpanded = new Set(expandedClauses);
    if (newExpanded.has(clauseId)) {
      newExpanded.delete(clauseId);
    } else {
      newExpanded.add(clauseId);
    }
    setExpandedClauses(newExpanded);
  };

  const expandAll = () => {
    setExpandedClauses(new Set(clauses.map((c) => c.id)));
  };

  const collapseAll = () => {
    setExpandedClauses(new Set());
  };

  // Get risk color and icon
  const getRiskIcon = (level: string) => {
    switch (level) {
      case "safe":
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case "warning":
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case "dangerous":
        return <XCircle className="h-4 w-4 text-red-500" />;
      case "illegal":
        return <Scale className="h-4 w-4 text-purple-500" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getRiskBorderClass = (level: string) => {
    switch (level) {
      case "safe":
        return "border-l-green-500";
      case "warning":
        return "border-l-yellow-500";
      case "dangerous":
        return "border-l-red-500";
      case "illegal":
        return "border-l-purple-500";
      default:
        return "border-l-yellow-500";
    }
  };

  const getRiskBadgeClass = (level: string) => {
    switch (level) {
      case "safe":
        return "bg-green-500/20 text-green-400 border-green-500/30";
      case "warning":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
      case "dangerous":
        return "bg-red-500/20 text-red-400 border-red-500/30";
      case "illegal":
        return "bg-purple-500/20 text-purple-400 border-purple-500/30";
      default:
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="h-12 w-12 text-blue-500 animate-spin" />
        <p className="text-muted-foreground">Loading results...</p>
      </div>
    );
  }

  // Error state
  if (error || !document) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <XCircle className="h-12 w-12 text-red-500" />
        <p className="text-red-400">{error || "Document not found"}</p>
        <Link href="/upload">
          <Button>Upload New Document</Button>
        </Link>
      </div>
    );
  }

  // Analyzing state
  if (document.analysis_status === "pending" || document.analysis_status === "analyzing") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 px-4">
        <div className="relative">
          <Loader2 className="h-16 w-16 text-blue-500 animate-spin" />
          <div className="absolute inset-0 h-16 w-16 bg-blue-500/20 blur-xl rounded-full animate-pulse" />
        </div>
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Analyzing Your Contract</h2>
          <p className="text-muted-foreground max-w-md">
            Our AI is reviewing each clause under Indian law. This typically takes 30-60 seconds
            depending on the document length.
          </p>
        </div>
        <div className="w-64">
          <Progress value={33} className="h-2" />
        </div>
        <p className="text-sm text-muted-foreground">
          Status: {document.analysis_status === "pending" ? "Queued" : "Processing"}...
        </p>
      </div>
    );
  }

  // Failed state
  if (document.analysis_status === "failed") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 px-4">
        <XCircle className="h-12 w-12 text-red-500" />
        <h2 className="text-2xl font-bold text-red-400">Analysis Failed</h2>
        <p className="text-muted-foreground text-center max-w-md">
          {document.summary || "Something went wrong during analysis. Please try again."}
        </p>
        <Link href="/upload">
          <Button>Try Again</Button>
        </Link>
      </div>
    );
  }

  // Results view
  const riskLevel = getRiskLevel(document.overall_risk_score);
  const riskColor = RISK_COLORS[riskLevel];

  return (
    <div className="relative px-4 sm:px-6 lg:px-8 py-8">
      {/* Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-5xl">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 text-muted-foreground text-sm mb-2">
              <FileText className="h-4 w-4" />
              <span>{document.original_filename || "Analyzed Document"}</span>
              <span>•</span>
              <span>{getDocumentTypeLabel(document.document_type)}</span>
              <span>•</span>
              <span>{getStateName(document.jurisdiction)}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold">Analysis Results</h1>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={refreshing}
              className="gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            <Link href={`/letter/${documentId}`}>
              <Button size="sm" className="gap-2 bg-blue-600 hover:bg-blue-700">
                <FileText className="h-4 w-4" />
                Generate Notice
              </Button>
            </Link>
          </div>
        </div>

        {/* Score Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          {/* Main Score */}
          <Card className="glass border-white/5 md:col-span-2 glow-blue">
            <CardContent className="p-6 flex items-center gap-6">
              <div
                className="relative h-24 w-24 rounded-full flex items-center justify-center"
                style={{
                  background: `conic-gradient(${riskColor} ${document.overall_risk_score}%, transparent 0)`,
                }}
              >
                <div className="absolute inset-2 bg-background rounded-full flex items-center justify-center">
                  <span className="text-3xl font-bold" style={{ color: riskColor }}>
                    {document.overall_risk_score}
                  </span>
                </div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Overall Risk Score</p>
                <p className="text-xl font-bold" style={{ color: riskColor }}>
                  {getRiskLabel(riskLevel)}
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  {document.total_clauses} clauses analyzed
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Stats */}
          <Card className="glass border-white/5">
            <CardContent className="p-6 flex flex-col justify-center h-full">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-500">{document.safe_count}</p>
                  <p className="text-xs text-muted-foreground">Safe</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-yellow-500">{document.warning_count}</p>
                  <p className="text-xs text-muted-foreground">Warning</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-red-500">{document.dangerous_count}</p>
                  <p className="text-xs text-muted-foreground">Dangerous</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-purple-500">{document.illegal_count}</p>
                  <p className="text-xs text-muted-foreground">Illegal</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Entity */}
          <Card className="glass border-white/5">
            <CardContent className="p-6 flex flex-col justify-center h-full">
              <p className="text-sm text-muted-foreground mb-2">Identified Entity</p>
              <p className="font-semibold truncate">
                {document.entity_name || "Not identified"}
              </p>
              {document.entity_name && (
                <Button variant="ghost" size="sm" className="mt-3 gap-2 text-red-400">
                  <Flag className="h-3 w-3" />
                  Flag Entity
                </Button>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Summary */}
        {document.summary && (
          <Card className="glass border-white/5 mb-8">
            <CardContent className="p-6">
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <Shield className="h-4 w-4 text-blue-400" />
                Summary
              </h3>
              <p className="text-muted-foreground leading-relaxed">{document.summary}</p>
            </CardContent>
          </Card>
        )}

        {/* Verification Stats */}
        {verificationStats && (
        <Card className="glass border-white/5 mb-8">
    <CardContent className="p-6">
      <h3 className="font-semibold mb-3 flex items-center gap-2">
        <ShieldCheck className="h-4 w-4 text-green-400" />
        Legal Database Verification
      </h3>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="text-center p-3 rounded-lg bg-green-500/10">
          <p className="text-2xl font-bold text-green-400">{verificationStats.verified}</p>
          <p className="text-xs text-muted-foreground">Verified ✓</p>
        </div>
        <div className="text-center p-3 rounded-lg bg-yellow-500/10">
          <p className="text-2xl font-bold text-yellow-400">{verificationStats.partial}</p>
          <p className="text-xs text-muted-foreground">Partial</p>
        </div>
        <div className="text-center p-3 rounded-lg bg-blue-500/10">
          <p className="text-2xl font-bold text-blue-400">{verificationStats.ai_suggested}</p>
          <p className="text-xs text-muted-foreground">AI-Only</p>
        </div>
        <div className="text-center p-3 rounded-lg bg-white/5">
          <p className="text-2xl font-bold text-foreground">{verificationStats.verification_rate}%</p>
          <p className="text-xs text-muted-foreground">Match Rate</p>
        </div>
      </div>
      {verifying && (
        <p className="text-xs text-muted-foreground mt-3 flex items-center gap-2">
          <Loader2 className="h-3 w-3 animate-spin" />
          Verifying citations against legal database...
        </p>
      )}
    </CardContent>
  </Card>
        )}

        {/* Clauses */}
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-bold">Clause Analysis</h2>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={expandAll}>
              Expand All
            </Button>
            <Button variant="ghost" size="sm" onClick={collapseAll}>
              Collapse All
            </Button>
          </div>
        </div>

        <div className="space-y-4">
          {clauses.map((clause) => {
            const isExpanded = expandedClauses.has(clause.id);

            return (
              <Card
                key={clause.id}
                className={`glass border-white/5 border-l-4 ${getRiskBorderClass(clause.risk_level)}`}
              >
                <CardContent className="p-4">
                  {/* Header */}
                  <div
                    className="flex items-start justify-between cursor-pointer"
                    onClick={() => toggleClause(clause.id)}
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        {getRiskIcon(clause.risk_level)}
                        <Badge className={getRiskBadgeClass(clause.risk_level)}>
                          {getRiskLabel(clause.risk_level as any)}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          Score: {clause.risk_score}/100
                        </span>
                        <Badge variant="outline" className="text-xs">
                          {clause.clause_type}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2 italic">
                        &quot;{clause.original_text.substring(0, 200)}
                        {clause.original_text.length > 200 ? "..." : ""}&quot;
                      </p>
                    </div>
                    <Button variant="ghost" size="sm">
                      {isExpanded ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </Button>
                  </div>

                  {/* Expanded Content */}
                  {isExpanded && (
                    <div className="mt-4 pt-4 border-t border-white/5 space-y-4">
                      {/* Full Text */}
                      <div>
                        <p className="text-sm font-medium mb-1">Full Clause Text</p>
                        <p className="text-sm text-muted-foreground bg-white/5 p-3 rounded-lg">
                          {clause.original_text}
                        </p>
                      </div>

                      {/* Explanation */}
                      <div>
                        <p className="text-sm font-medium mb-1">Analysis</p>
                        <p className="text-sm text-muted-foreground">{clause.explanation}</p>
                      </div>

                      {/* Legal Citation */}
                      {clause.legal_citation && (
                        <div>
                          <p className="text-sm font-medium mb-1 text-blue-400">⚖️ Legal Reference</p>
                          <p className="text-sm text-blue-300">{clause.legal_citation}</p>
                        </div>
                      )}

                      {/* Fair Alternative */}
                      {clause.fair_alternative && (
                        <div>
                          <p className="text-sm font-medium mb-1 text-green-400">
                            ✅ Fair Alternative
                          </p>
                          <p className="text-sm text-green-300 bg-green-500/10 p-3 rounded-lg">
                            {clause.fair_alternative}
                          </p>
                        </div>
                      )}

                      {/* Red Flags */}
                      {clause.red_flags && clause.red_flags.length > 0 && (
                        <div>
                          <p className="text-sm font-medium mb-1 text-red-400">🚩 Red Flags</p>
                          <ul className="list-disc list-inside text-sm text-red-300 space-y-1">
                            {clause.red_flags.map((flag, i) => (
                              <li key={i}>{flag}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {/* Verification Badge */}
                      <VerificationBadge
                        verification={verificationResults[clause.id] || null}
                      />
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Bottom Actions */}
        <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
          <Link href={`/letter/${documentId}`}>
            <Button size="lg" className="gap-2 bg-blue-600 hover:bg-blue-700">
              <FileText className="h-5 w-5" />
              Generate Legal Notice
            </Button>
          </Link>
          <Button variant="outline" size="lg" className="gap-2">
            <Download className="h-5 w-5" />
            Download Report
          </Button>
          <Button variant="outline" size="lg" className="gap-2">
            <Share2 className="h-5 w-5" />
            Share Results
          </Button>
        </div>
      </div>
    </div>
  );
}