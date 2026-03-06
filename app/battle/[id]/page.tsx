"use client";

import { useEffect, useState, useMemo } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  BarChart3,
  AlertTriangle,
  Loader2,
  XCircle,
  Info,
  Share2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";
import {
  getStateName,
  getDocumentTypeLabel,
} from "@/lib/utils/constants";
import {
  getAvailableScopes,
  getBattleData,
  getBattleScores,
} from "@/lib/battle/aggregator";
import type { BattleData, BattleScores, BattleScope, ClauseComparison, ScoreComparison } from "@/lib/battle/types";
import type { Document, Clause } from "@/types";
import { toast } from "sonner";

const SEVERITY_COLORS = {
  critical: { bg: "rgba(168, 85, 247, 0.15)", border: "#A855F7", text: "#A855F7" },
  worse: { bg: "rgba(239, 68, 68, 0.15)", border: "#EF4444", text: "#EF4444" },
  average: { bg: "rgba(234, 179, 8, 0.15)", border: "#EAB308", text: "#EAB308" },
  better: { bg: "rgba(34, 197, 94, 0.15)", border: "#22C55E", text: "#22C55E" },
};

const RISK_BAR_COLORS: Record<string, string> = {
  safe: "#22C55E",
  warning: "#EAB308",
  dangerous: "#EF4444",
  illegal: "#A855F7",
};

export default function BattlePage() {
  const params = useParams();
  const documentId = params.id as string;

  const [doc, setDoc] = useState<Document | null>(null);
  const [clauses, setClauses] = useState<Clause[]>([]);
  const [loading, setLoading] = useState(true);
  const [battleLoading, setBattleLoading] = useState(false);
  const [error, setError] = useState("");

  const [scope, setScope] = useState<"state" | "india">("state");
  const [stateScope, setStateScope] = useState<BattleScope | null>(null);
  const [indiaScope, setIndiaScope] = useState<BattleScope | null>(null);

  const [battleData, setBattleData] = useState<BattleData | null>(null);
  const [battleScores, setBattleScores] = useState<BattleScores | null>(null);
  const [insufficient, setInsufficient] = useState(false);

  const supabase = createClient();

  // Fetch document + clauses
  useEffect(() => {
    async function fetchDoc() {
      const { data: docData } = await supabase
        .from("documents")
        .select("*")
        .eq("id", documentId)
        .single();

      if (!docData) {
        setError("Document not found");
        setLoading(false);
        return;
      }

      setDoc(docData as Document);

      const { data: clauseData } = await supabase
        .from("clauses")
        .select("*")
        .eq("document_id", documentId)
        .order("clause_number", { ascending: true });

      setClauses((clauseData || []) as Clause[]);

      // Check available scopes
      const scopes = await getAvailableScopes(
        supabase,
        docData.document_type,
        docData.jurisdiction
      );

      setStateScope(scopes.state);
      setIndiaScope(scopes.india);

      // Auto-select best scope
      if (scopes.state.available) {
        setScope("state");
      } else if (scopes.india.available) {
        setScope("india");
      } else {
        setInsufficient(true);
      }

      setLoading(false);
    }

    fetchDoc();
  }, [documentId]);

  // Fetch battle data when scope changes
  useEffect(() => {
    if (!doc || !clauses.length || insufficient) return;

    async function fetchBattle() {
      setBattleLoading(true);
      setBattleData(null);
      setBattleScores(null);

      // Try extracted values first
      const valueData = await getBattleData(supabase, doc!, clauses, scope);

      if (valueData && valueData.comparisons.length > 0) {
        setBattleData(valueData);
      }

      // Always get score-based comparison as fallback/supplement
      const scoreData = await getBattleScores(supabase, doc!, clauses, scope);
      if (scoreData) {
        setBattleScores(scoreData);
      }

      setBattleLoading(false);
    }

    fetchBattle();
  }, [doc, clauses, scope, insufficient]);

  // Active data
  const activeData = battleData || battleScores;
  const hasValueComparisons = battleData && battleData.comparisons.length > 0;

  // Loading
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="h-12 w-12 text-purple-500 animate-spin" />
        <p className="text-muted-foreground">Loading battle data...</p>
      </div>
    );
  }

  // Error
  if (error || !doc) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <XCircle className="h-12 w-12 text-red-500" />
        <p className="text-red-400">{error || "Document not found"}</p>
        <Link href="/upload"><Button>Upload Contract</Button></Link>
      </div>
    );
  }

  // Insufficient data
  if (insufficient) {
    return (
      <div className="px-4 sm:px-6 lg:px-8 py-8 max-w-3xl mx-auto">
        <Link href={`/results/${documentId}`} className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white mb-8">
          <ArrowLeft className="h-4 w-4" /> Back to Results
        </Link>
        <Card className="bg-gray-900/50 border-gray-800">
          <CardContent className="p-8 text-center">
            <BarChart3 className="h-12 w-12 text-gray-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Not Enough Data Yet</h2>
            <p className="text-muted-foreground mb-4 max-w-md mx-auto">
              We need at least 10 analyzed {getDocumentTypeLabel(doc.document_type).toLowerCase()} contracts 
              to show meaningful comparisons. Currently we have{" "}
              {indiaScope?.count || 0} across India.
            </p>
            <p className="text-sm text-gray-500 mb-6">
              Help us grow! Share ClauseWall with friends who have contracts to analyze.
            </p>
            <div className="flex gap-3 justify-center">
              <Link href={`/results/${documentId}`}>
                <Button variant="outline">Back to Results</Button>
              </Link>
              <Button
                onClick={() => {
                  navigator.clipboard.writeText(window.location.origin);
                  toast.success("Link copied!");
                }}
                className="gap-2"
              >
                <Share2 className="h-4 w-4" />
                Share ClauseWall
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8 max-w-4xl mx-auto">
      {/* Back link */}
      <Link
        href={`/results/${documentId}`}
        className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white mb-6 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Results
      </Link>

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <BarChart3 className="h-6 w-6 text-purple-400" />
          <h1 className="text-2xl sm:text-3xl font-bold">Contract Battle</h1>
        </div>
        <p className="text-muted-foreground">
          Your {getDocumentTypeLabel(doc.document_type)} vs{" "}
          {scope === "state" ? getStateName(doc.jurisdiction) : "All India"} average
        </p>
      </div>

      {/* Scope Toggle */}
      <div className="flex items-center gap-2 mb-8">
        <span className="text-sm text-gray-400 mr-2">Compare against:</span>
        <button
          onClick={() => stateScope?.available && setScope("state")}
          disabled={!stateScope?.available}
          className={`px-4 py-2 rounded-lg text-sm font-medium border transition-all ${
            scope === "state"
              ? "bg-purple-500/20 border-purple-500/50 text-purple-300"
              : stateScope?.available
              ? "bg-white/[0.02] border-white/10 text-gray-400 hover:text-white hover:border-white/20"
              : "bg-white/[0.01] border-white/5 text-gray-600 cursor-not-allowed"
          }`}
        >
          🏠 {stateScope?.label || "State"}{" "}
          <span className="text-xs opacity-60">({stateScope?.count || 0})</span>
        </button>
        <button
          onClick={() => indiaScope?.available && setScope("india")}
          disabled={!indiaScope?.available}
          className={`px-4 py-2 rounded-lg text-sm font-medium border transition-all ${
            scope === "india"
              ? "bg-purple-500/20 border-purple-500/50 text-purple-300"
              : indiaScope?.available
              ? "bg-white/[0.02] border-white/10 text-gray-400 hover:text-white hover:border-white/20"
              : "bg-white/[0.01] border-white/5 text-gray-600 cursor-not-allowed"
          }`}
        >
          🇮🇳 All India{" "}
          <span className="text-xs opacity-60">({indiaScope?.count || 0})</span>
        </button>

        {stateScope && !stateScope.available && scope === "india" && (
          <span className="text-xs text-yellow-500/70 ml-2">
            <AlertTriangle className="h-3 w-3 inline mr-1" />
            Limited data for {stateScope.label}
          </span>
        )}
      </div>

      {/* Battle Loading */}
      {battleLoading && (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <Loader2 className="h-10 w-10 text-purple-400 animate-spin" />
          <p className="text-muted-foreground">Calculating comparisons...</p>
        </div>
      )}

      {/* Battle Content */}
      {!battleLoading && activeData && (
        <>
          {/* Overall Percentile */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="bg-gray-900/50 border-gray-800 mb-8">
              <CardContent className="p-8">
                <div className="flex flex-col sm:flex-row items-center gap-6">
                  {/* Percentile circle */}
                  <div className="relative flex-shrink-0">
                    <div
                      className="h-32 w-32 rounded-full flex items-center justify-center"
                      style={{
                        background: `conic-gradient(${
                          activeData.overallPercentile >= 75
                            ? "#A855F7"
                            : activeData.overallPercentile >= 50
                            ? "#EF4444"
                            : activeData.overallPercentile >= 25
                            ? "#EAB308"
                            : "#22C55E"
                        } ${activeData.overallPercentile}%, rgba(255,255,255,0.05) 0)`,
                      }}
                    >
                      <div className="absolute inset-2 bg-gray-950 rounded-full flex flex-col items-center justify-center">
                        <span className="text-3xl font-bold">{activeData.overallPercentile}%</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-center sm:text-left">
                    <p className="text-lg font-semibold mb-1">
                      Your contract is <span className="text-purple-400">harsher than {activeData.overallPercentile}%</span>
                    </p>
                    <p className="text-sm text-muted-foreground mb-1">
                      of {getDocumentTypeLabel(doc.document_type).toLowerCase()} agreements{" "}
                      {scope === "state" ? `in ${getStateName(doc.jurisdiction)}` : "across India"}
                    </p>
                    <p className="text-xs text-gray-500">
                      Based on {activeData.totalContractsAnalyzed} analyzed contracts
                    </p>
                    <p className="text-sm mt-2 font-medium" style={{
                      color: activeData.overallPercentile >= 75 ? "#A855F7" :
                             activeData.overallPercentile >= 50 ? "#EF4444" :
                             activeData.overallPercentile >= 25 ? "#EAB308" : "#22C55E"
                    }}>
                      {activeData.overallVerdict}
                    </p>
                  </div>
                </div>

                {/* Progress bar version */}
                <div className="mt-6">
                  <div className="flex justify-between text-xs text-gray-500 mb-1.5">
                    <span>Fairest</span>
                    <span>Average</span>
                    <span>Harshest</span>
                  </div>
                  <div className="h-3 bg-gray-800 rounded-full overflow-hidden relative">
                    <div className="absolute inset-0 flex">
                      <div className="w-1/4 bg-green-500/20" />
                      <div className="w-1/4 bg-yellow-500/20" />
                      <div className="w-1/4 bg-red-500/20" />
                      <div className="w-1/4 bg-purple-500/20" />
                    </div>
                    <motion.div
                      className="absolute top-0 bottom-0 w-1 bg-white rounded-full shadow-lg shadow-white/50"
                      initial={{ left: "0%" }}
                      animate={{ left: `${activeData.overallPercentile}%` }}
                      transition={{ duration: 1, ease: "easeOut", delay: 0.3 }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Value Comparisons */}
          {hasValueComparisons && battleData!.comparisons.map((comp, index) => (
            <motion.div
              key={comp.clauseType}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + index * 0.08 }}
            >
              <ComparisonCard comparison={comp} />
            </motion.div>
          ))}

          {/* Score Comparisons (if no value comparisons OR as supplement) */}
          {battleScores && battleScores.scoreComparisons.length > 0 && (
            <>
              {hasValueComparisons && (
                <div className="flex items-center gap-3 my-6">
                  <div className="h-px bg-gray-800 flex-1" />
                  <span className="text-xs text-gray-500">Risk Score Comparison</span>
                  <div className="h-px bg-gray-800 flex-1" />
                </div>
              )}

              {battleScores.scoreComparisons
                .filter((sc) => !hasValueComparisons || !battleData!.comparisons.find((c) => c.clauseType === sc.clauseType))
                .map((comp, index) => (
                  <motion.div
                    key={`score-${comp.clauseType}`}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 + index * 0.06 }}
                  >
                    <ScoreComparisonCard comparison={comp} />
                  </motion.div>
                ))}
            </>
          )}

          {/* Insights */}
          {activeData.insights.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
            >
              <Card className="bg-gray-900/50 border-gray-800 mt-8">
                <CardContent className="p-6">
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <Info className="h-4 w-4 text-blue-400" />
                    Key Insights
                  </h3>
                  <ul className="space-y-2">
                    {activeData.insights.map((insight, i) => (
                      <li key={i} className="text-sm text-gray-300 leading-relaxed">
                        {insight}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Bottom Actions */}
          <div className="mt-8 flex flex-wrap gap-3 justify-center">
            <Link href={`/results/${documentId}`}>
              <Button variant="outline" className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back to Results
              </Button>
            </Link>
            <Link href={`/negotiate/${documentId}`}>
              <Button className="gap-2 bg-purple-600 hover:bg-purple-700">
                ⚔️ Negotiate
              </Button>
            </Link>
            <Button
              variant="outline"
              className="gap-2"
              onClick={() => {
                navigator.clipboard.writeText(window.location.href);
                toast.success("Battle link copied!");
              }}
            >
              <Share2 className="h-4 w-4" />
              Share
            </Button>
          </div>
        </>
      )}
    </div>
  );
}

// ============================================
// VALUE COMPARISON CARD
// ============================================

function ComparisonCard({ comparison: comp }: { comparison: ClauseComparison }) {
  const maxValue = Math.max(
    comp.yourValue,
    comp.avgValue,
    comp.legalLimit || 0
  );
  const scale = maxValue > 0 ? 100 / maxValue : 1;

  const severity = SEVERITY_COLORS[comp.severity];

  return (
    <Card className="bg-gray-900/50 border-gray-800 mb-4">
      <CardContent className="p-5">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h4 className="font-semibold">{comp.clauseLabel}</h4>
          <div className="flex items-center gap-2">
            <span
              className="text-xs px-2 py-0.5 rounded-full font-medium"
              style={{ backgroundColor: severity.bg, color: severity.text, border: `1px solid ${severity.border}30` }}
            >
              {comp.severity === "critical" ? "⛔" : comp.severity === "worse" ? "🔴" : comp.severity === "average" ? "🟡" : "✅"}{" "}
              P{comp.percentile}
            </span>
            <span className="text-xs text-gray-500">{comp.sampleCount} contracts</span>
          </div>
        </div>

        {/* Bars */}
        <div className="space-y-3">
          {/* Your value */}
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-400 w-16 flex-shrink-0">You</span>
            <div className="flex-1 h-7 bg-gray-800/60 rounded-md overflow-hidden relative">
              <motion.div
                className="h-full rounded-md"
                style={{ backgroundColor: RISK_BAR_COLORS[comp.yourRiskLevel] || "#EF4444" }}
                initial={{ width: 0 }}
                animate={{ width: `${Math.max(comp.yourValue * scale, 4)}%` }}
                transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
              />
              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs font-bold text-white mix-blend-difference">
                {comp.yourValue} {comp.yourUnit}
              </span>
            </div>
          </div>

          {/* Average */}
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-400 w-16 flex-shrink-0">Average</span>
            <div className="flex-1 h-7 bg-gray-800/60 rounded-md overflow-hidden relative">
              <motion.div
                className="h-full rounded-md bg-gray-500/60"
                initial={{ width: 0 }}
                animate={{ width: `${Math.max(comp.avgValue * scale, 4)}%` }}
                transition={{ duration: 0.8, ease: "easeOut", delay: 0.35 }}
              />
              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs font-medium text-gray-300">
                {comp.avgValue} {comp.avgUnit}
              </span>
            </div>
          </div>

          {/* Legal limit */}
          {comp.legalLimit != null && (
            <div className="flex items-center gap-3">
              <span className="text-xs text-gray-400 w-16 flex-shrink-0">Legal</span>
              <div className="flex-1 h-7 bg-gray-800/60 rounded-md overflow-hidden relative">
                <motion.div
                  className="h-full rounded-md bg-green-500/40"
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.max(comp.legalLimit * scale, 4)}%` }}
                  transition={{ duration: 0.8, ease: "easeOut", delay: 0.5 }}
                />
                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs font-medium text-green-400">
                  {comp.legalLimit} {comp.legalUnit || comp.yourUnit}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Insight */}
        <p className="text-xs mt-3 leading-relaxed" style={{ color: severity.text }}>
          {comp.insight}
          {comp.statuteCode && (
            <span className="text-gray-500 ml-1">— {comp.statuteCode}</span>
          )}
        </p>
      </CardContent>
    </Card>
  );
}

// ============================================
// SCORE COMPARISON CARD (Fallback)
// ============================================

function ScoreComparisonCard({ comparison: comp }: { comparison: ScoreComparison }) {
  const maxScore = 100;
  const severity = SEVERITY_COLORS[comp.severity];

  return (
    <Card className="bg-gray-900/50 border-gray-800 mb-3">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-medium text-sm">{comp.clauseLabel}</h4>
          <span
            className="text-[10px] px-2 py-0.5 rounded-full font-medium"
            style={{ backgroundColor: severity.bg, color: severity.text }}
          >
            P{comp.percentile}
          </span>
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <span className="text-[11px] text-gray-400 w-14 flex-shrink-0">You</span>
            <div className="flex-1 h-5 bg-gray-800/60 rounded overflow-hidden relative">
              <motion.div
                className="h-full rounded"
                style={{ backgroundColor: RISK_BAR_COLORS[comp.yourRiskLevel] || "#EF4444" }}
                initial={{ width: 0 }}
                animate={{ width: `${(comp.yourScore / maxScore) * 100}%` }}
                transition={{ duration: 0.7, delay: 0.2 }}
              />
              <span className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[10px] font-bold text-white mix-blend-difference">
                {comp.yourScore}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-[11px] text-gray-400 w-14 flex-shrink-0">Average</span>
            <div className="flex-1 h-5 bg-gray-800/60 rounded overflow-hidden relative">
              <motion.div
                className="h-full rounded bg-gray-500/50"
                initial={{ width: 0 }}
                animate={{ width: `${(comp.avgScore / maxScore) * 100}%` }}
                transition={{ duration: 0.7, delay: 0.35 }}
              />
              <span className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[10px] font-medium text-gray-400">
                {comp.avgScore}
              </span>
            </div>
          </div>
        </div>

        <p className="text-[11px] mt-2" style={{ color: severity.text }}>
          {comp.insight} ({comp.sampleCount} samples)
        </p>
      </CardContent>
    </Card>
  );
}