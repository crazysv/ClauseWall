"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Shield,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  FileText,
  Download,
  Share2,
  Flag,
  Loader2,
  RefreshCw,
  Scale,
  Swords,
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
import ClauseCard from "@/components/results/clause-card";

interface HybridClause extends Clause {
  verification_source?: "database" | "ai";
  confidence?: "verified" | "partial" | "ai_suggested";
  matched_rule_id?: string | null;
  negotiation_script?: string | null;
  penalty_info?: string | null;
}

export default function ResultsPage() {
  const params = useParams();
  const documentId = params.id as string;

  const [document, setDocument] = useState<Document | null>(null);
  const [clauses, setClauses] = useState<HybridClause[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expandedClauses, setExpandedClauses] = useState<Set<string>>(new Set());
  const [refreshing, setRefreshing] = useState(false);
  const [filterRisk, setFilterRisk] = useState<string>("all");

  const supabase = createClient();

  const verificationStats = {
    verified: clauses.filter((c) => c.confidence === "verified").length,
    partial: clauses.filter((c) => c.confidence === "partial").length,
    ai_suggested: clauses.filter(
      (c) => c.confidence === "ai_suggested" || !c.confidence
    ).length,
    verification_rate:
      clauses.length > 0
        ? Math.round(
            (clauses.filter((c) => c.confidence === "verified").length /
              clauses.length) *
              100
          )
        : 0,
  };

  const fetchData = async () => {
    try {
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

      if (doc.analysis_status === "completed") {
        const { data: clauseData, error: clauseError } = await supabase
          .from("clauses")
          .select("*")
          .eq("document_id", documentId)
          .order("clause_number", { ascending: true });

        if (!clauseError && clauseData) {
          setClauses(clauseData as HybridClause[]);
        }
      }

      setLoading(false);
    } catch (err) {
      setError("Failed to load results");
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [documentId]);

  useEffect(() => {
    if (
      document?.analysis_status === "analyzing" ||
      document?.analysis_status === "pending"
    ) {
      const interval = setInterval(fetchData, 3000);
      return () => clearInterval(interval);
    }
  }, [document?.analysis_status]);

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
    setExpandedClauses(new Set(filteredClauses.map((c) => c.id)));
  };

  const collapseAll = () => {
    setExpandedClauses(new Set());
  };

  // Filter clauses
  const filteredClauses =
    filterRisk === "all"
      ? clauses
      : clauses.filter((c) => c.risk_level === filterRisk);

  // Loading state
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="h-12 w-12 text-blue-500 animate-spin" />
        <p className="text-muted-foreground">Loading results...</p>
      </div>
    );
  }

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

  if (
    document.analysis_status === "pending" ||
    document.analysis_status === "analyzing"
  ) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 px-4">
        <div className="relative">
          <Loader2 className="h-16 w-16 text-blue-500 animate-spin" />
          <div className="absolute inset-0 h-16 w-16 bg-blue-500/20 blur-xl rounded-full animate-pulse" />
        </div>
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Analyzing Your Contract</h2>
          <p className="text-muted-foreground max-w-md">
            Checking against 750+ verified Indian legal rules. This typically
            takes 30-60 seconds.
          </p>
        </div>
        <div className="w-64">
          <Progress value={33} className="h-2" />
        </div>
      </div>
    );
  }

  if (document.analysis_status === "failed") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 px-4">
        <XCircle className="h-12 w-12 text-red-500" />
        <h2 className="text-2xl font-bold text-red-400">Analysis Failed</h2>
        <p className="text-muted-foreground text-center max-w-md">
          {document.summary || "Something went wrong. Please try again."}
        </p>
        <Link href="/upload">
          <Button>Try Again</Button>
        </Link>
      </div>
    );
  }

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
          <Card className="bg-gray-900/50 border-gray-800 md:col-span-2">
            <CardContent className="p-6 flex items-center gap-6">
              <div
                className="relative h-24 w-24 rounded-full flex items-center justify-center flex-shrink-0"
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
          <Card className="bg-gray-900/50 border-gray-800">
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
          <Card className="bg-gray-900/50 border-gray-800">
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
          <Card className="bg-gray-900/50 border-gray-800 mb-8">
            <CardContent className="p-6">
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <Shield className="h-4 w-4 text-blue-400" />
                Summary
              </h3>
              <p className="text-muted-foreground leading-relaxed text-sm">
                {document.summary}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Verification Stats */}
        <Card className="bg-gray-900/50 border-gray-800 mb-8">
          <CardContent className="p-6">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-green-400" />
              Legal Database Verification
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
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
                <p className="text-2xl font-bold">{verificationStats.verification_rate}%</p>
                <p className="text-xs text-muted-foreground">Verified Rate</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Clause Header + Filters */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <h2 className="text-xl font-bold">Clause Analysis</h2>
          <div className="flex items-center gap-2 flex-wrap">
            {/* Risk Filter */}
            {[
              { value: "all", label: "All", count: clauses.length },
              { value: "illegal", label: "Illegal", count: document.illegal_count, color: "text-purple-400" },
              { value: "dangerous", label: "Dangerous", count: document.dangerous_count, color: "text-red-400" },
              { value: "warning", label: "Warning", count: document.warning_count, color: "text-yellow-400" },
              { value: "safe", label: "Safe", count: document.safe_count, color: "text-green-400" },
            ].map((filter) => (
              <button
                key={filter.value}
                onClick={() => setFilterRisk(filter.value)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                  filterRisk === filter.value
                    ? "bg-white/10 border-white/20 text-white"
                    : "bg-white/[0.02] border-white/5 text-gray-500 hover:text-gray-300"
                }`}
              >
                <span className={filter.color}>{filter.count}</span>{" "}
                {filter.label}
              </button>
            ))}

            <span className="text-gray-700">|</span>

            <button
              onClick={expandAll}
              className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
            >
              Expand All
            </button>
            <button
              onClick={collapseAll}
              className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
            >
              Collapse All
            </button>
          </div>
        </div>

        {/* Clause Cards */}
        <div className="space-y-3">
          {filteredClauses.map((clause, index) => (
            <motion.div
              key={clause.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.03 }}
            >
              <ClauseCard
                clause={clause}
                isExpanded={expandedClauses.has(clause.id)}
                onToggle={() => toggleClause(clause.id)}
                jurisdiction={document.jurisdiction}
              />
            </motion.div>
          ))}
        </div>

        {/* No results for filter */}
        {filteredClauses.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <p>No {filterRisk} clauses found.</p>
            <button
              onClick={() => setFilterRisk("all")}
              className="text-blue-400 text-sm mt-2 hover:underline"
            >
              Show all clauses
            </button>
          </div>
        )}

        {/* Bottom Actions */}
        <div className="mt-10 flex flex-col sm:flex-row gap-3 justify-center">
        <Link href={`/negotiate/${documentId}`}>
        <Button size="lg" className="gap-2 bg-purple-600 hover:bg-purple-700 w-full sm:w-auto">
        <Swords className="h-5 w-5" />
        Negotiation Playbook
        </Button>
        </Link>
        <Link href={`/letter/${documentId}`}>
        <Button size="lg" className="gap-2 bg-blue-600 hover:bg-blue-700 w-full sm:w-auto">
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