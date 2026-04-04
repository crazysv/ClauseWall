"use client";

import { useEffect, useState, useMemo } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { RelatedActions } from "@/components/shared/related-actions";
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
  critical: { bg: "#f3e8ff", border: "#581c87", text: "#581c87" },
  worse: { bg: "#fee2e2", border: "#7f1d1d", text: "#7f1d1d" },
  average: { bg: "#fef9c3", border: "#713f12", text: "#713f12" },
  better: { bg: "#dcfce7", border: "#14532d", text: "#14532d" },
};

const RISK_BAR_COLORS: Record<string, string> = {
  safe: "#22c55e",
  warning: "#eab308",
  dangerous: "#ef4444",
  illegal: "#a855f7",
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
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
        <Loader2 className="h-16 w-16 text-black animate-spin" />
        <p className="text-sm font-black uppercase tracking-widest text-muted-foreground">Loading battle data...</p>
      </div>
    );
  }

  // Error
  if (error || !doc) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 bg-white border-2 border-black p-8 m-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
        <XCircle className="h-16 w-16 text-red-600" />
        <p className="text-2xl font-black text-red-700">{error || "Document not found"}</p>
        <Link href="/upload"><Button className="border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] font-bold uppercase hover:translate-y-1 hover:shadow-none transition-all rounded-none px-6">UPLOAD CONTRACT</Button></Link>
      </div>
    );
  }

  // Insufficient data
  if (insufficient) {
    return (
      <div className="px-4 sm:px-6 lg:px-8 py-8 max-w-3xl mx-auto">
        <Link href={`/results/${documentId}`} className="inline-flex items-center gap-2 text-sm font-black uppercase tracking-widest text-muted-foreground hover:text-black mb-8 transition-all hover:-translate-x-1">
          <ArrowLeft className="h-4 w-4" /> Back to Results
        </Link>
        <Card className="border-2 border-black rounded-none shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] bg-white">
          <CardContent className="p-10 text-center">
            <BarChart3 className="h-16 w-16 text-black mx-auto mb-6" />
            <h2 className="text-2xl font-black uppercase tracking-tight text-black mb-4">NOT ENOUGH DATA YET</h2>
            <p className="text-sm font-bold text-muted-foreground leading-relaxed max-w-md mx-auto mb-6">
              We need at least 10 analyzed <span className="text-black uppercase">{getDocumentTypeLabel(doc.document_type).toLowerCase()}</span> contracts 
              to show meaningful comparisons. Currently we have{" "}
              <span className="text-black underline">{indiaScope?.count || 0}</span> across India.
            </p>
            <p className="text-xs font-black uppercase tracking-widest text-blue-800 bg-blue-100 p-4 border-2 border-blue-900 mb-8 mx-auto max-w-md">
              Help us grow! Share ClauseWall with friends who have contracts to analyze.
            </p>
            <div className="flex gap-4 justify-center">
              <Link href={`/results/${documentId}`}>
                <Button variant="outline" className="border-2 border-black font-black uppercase tracking-wider rounded-none shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-y-1 active:shadow-none transition-all">Back to Results</Button>
              </Link>
              <Button
                onClick={() => {
                  navigator.clipboard.writeText(window.location.origin);
                  toast.success("Link copied!");
                }}
                className="gap-2 border-2 border-black bg-blue-500 hover:bg-blue-600 text-white font-black uppercase tracking-wider rounded-none shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-y-1 active:shadow-none transition-all"
              >
                <Share2 className="h-4 w-4" />
                Share
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
        className="inline-flex items-center gap-2 text-sm font-black uppercase tracking-widest text-muted-foreground hover:text-black mb-8 transition-all hover:-translate-x-1"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Results
      </Link>

      {/* Header */}
      <div className="mb-10">
        <div className="flex items-center gap-4 mb-4">
          <div className="h-14 w-14 border-2 border-black bg-purple-100 flex items-center justify-center shadow-[4px_4px_0px_0px_rgba(88,28,135,1)]">
            <BarChart3 className="h-7 w-7 text-purple-900" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-black uppercase tracking-tighter">Contract Battle</h1>
        </div>
        <p className="text-muted-foreground font-bold uppercase tracking-widest">
          Your <span className="text-black">{getDocumentTypeLabel(doc.document_type)}</span> vs{" "}
          <span className="text-black">{scope === "state" ? getStateName(doc.jurisdiction) : "All India"}</span> average
        </p>
      </div>

      {/* Scope Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-10 pb-6 border-b-2 border-black/10">
        <span className="text-sm font-black uppercase tracking-widest text-black">Compare against:</span>
        <div className="flex gap-3">
          <button
            onClick={() => stateScope?.available && setScope("state")}
            disabled={!stateScope?.available}
            className={`px-5 py-3 border-2 font-black uppercase tracking-wider transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-1 active:shadow-none ${
              scope === "state"
                ? "bg-purple-600 border-black text-white"
                : stateScope?.available
                ? "bg-white border-black text-black hover:bg-gray-100"
                : "bg-gray-100 border-gray-300 text-gray-400 cursor-not-allowed shadow-none"
            }`}
          >
            🏠 {stateScope?.label || "State"}{" "}
            <span className="text-xs ml-1 opacity-80">({stateScope?.count || 0})</span>
          </button>
          <button
            onClick={() => indiaScope?.available && setScope("india")}
            disabled={!indiaScope?.available}
            className={`px-5 py-3 border-2 font-black uppercase tracking-wider transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-1 active:shadow-none ${
              scope === "india"
                ? "bg-purple-600 border-black text-white"
                : indiaScope?.available
                ? "bg-white border-black text-black hover:bg-gray-100"
                : "bg-gray-100 border-gray-300 text-gray-400 cursor-not-allowed shadow-none"
            }`}
          >
            🇮🇳 ALL INDIA{" "}
            <span className="text-xs ml-1 opacity-80">({indiaScope?.count || 0})</span>
          </button>
        </div>

        {stateScope && !stateScope.available && scope === "india" && (
          <span className="text-xs font-bold text-yellow-800 bg-yellow-100 px-3 py-2 border-2 border-yellow-900 shadow-[2px_2px_0px_0px_rgba(113,63,18,1)] flex items-center">
            <AlertTriangle className="h-4 w-4 mr-2" />
            Limited data for {stateScope.label}
          </span>
        )}
      </div>

      {/* Battle Loading */}
      {battleLoading && (
        <div className="flex flex-col items-center justify-center py-20 gap-6">
          <Loader2 className="h-16 w-16 text-black animate-spin" />
          <p className="text-sm font-black uppercase tracking-widest text-muted-foreground">Calculating comparisons...</p>
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
            <Card className="border-2 border-black rounded-none bg-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] mb-12">
              <CardContent className="p-8">
                <div className="flex flex-col sm:flex-row items-center gap-8">
                  {/* Percentile circle */}
                  <div className="relative flex-shrink-0">
                    <div
                      className="h-36 w-36 rounded-none flex items-center justify-center border-4 border-black"
                      style={{
                        background: `conic-gradient(${
                          activeData.overallPercentile >= 75
                            ? "#a855f7"
                            : activeData.overallPercentile >= 50
                            ? "#ef4444"
                            : activeData.overallPercentile >= 25
                            ? "#eab308"
                            : "#22c55e"
                        } ${activeData.overallPercentile}%, #f3f4f6 0)`,
                      }}
                    >
                      <div className="absolute inset-3 bg-white border-2 border-black flex flex-col items-center justify-center">
                        <span className="text-4xl font-black">{activeData.overallPercentile}%</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-center sm:text-left flex-1">
                    <p className="text-xl font-black tracking-tight text-black mb-2">
                      YOUR CONTRACT IS <span className="uppercase" style={{
                      color: activeData.overallPercentile >= 75 ? "#a855f7" :
                             activeData.overallPercentile >= 50 ? "#ef4444" :
                             activeData.overallPercentile >= 25 ? "#eab308" : "#22c55e"
                    }}>HARSHER THAN {activeData.overallPercentile}%</span>
                    </p>
                    <p className="text-sm font-bold text-muted-foreground mb-4 leading-relaxed">
                      of {getDocumentTypeLabel(doc.document_type).toLowerCase()} agreements{" "}
                      <span className="text-black uppercase">{scope === "state" ? `in ${getStateName(doc.jurisdiction)}` : "across India"}</span>
                    </p>
                    
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-gray-100 border-2 border-black">
                      <span className="text-xs font-black uppercase tracking-widest text-black">
                        {activeData.totalContractsAnalyzed} SAMPLES
                      </span>
                    </div>

                    <p className="text-lg font-black uppercase tracking-widest mt-6 border-t-2 border-black/10 pt-4" style={{
                      color: activeData.overallPercentile >= 75 ? "#7e22ce" :
                             activeData.overallPercentile >= 50 ? "#b91c1c" :
                             activeData.overallPercentile >= 25 ? "#a16207" : "#15803d"
                    }}>
                      VERDICT: {activeData.overallVerdict}
                    </p>
                  </div>
                </div>

                {/* Progress bar version */}
                <div className="mt-8 pt-6 border-t-2 border-black/10">
                  <div className="flex justify-between text-xs font-black uppercase tracking-widest text-black mb-3">
                    <span className="text-green-700">FAIREST</span>
                    <span>AVERAGE</span>
                    <span className="text-purple-700">HARSHEST</span>
                  </div>
                  <div className="h-6 border-2 border-black bg-gray-100 relative shadow-[inset_2px_2px_0px_0px_rgba(0,0,0,0.1)]">
                    <div className="absolute inset-0 flex">
                      <div className="w-1/4 bg-green-200 border-r-2 border-black/20" />
                      <div className="w-1/4 bg-yellow-200 border-r-2 border-black/20" />
                      <div className="w-1/4 bg-red-200 border-r-2 border-black/20" />
                      <div className="w-1/4 bg-purple-200" />
                    </div>
                    <motion.div
                      className="absolute top-0 bottom-0 w-2 bg-black shadow-[2px_0_0_0_rgba(255,255,255,0.5)]"
                      initial={{ left: "0%" }}
                      animate={{ left: `${Math.min(Math.max(activeData.overallPercentile, 1), 99)}%` }}
                      transition={{ duration: 1, ease: "easeOut", delay: 0.3 }}
                      style={{ transform: 'translateX(-50%)' }}
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
                <div className="flex items-center gap-4 my-10">
                  <div className="h-0.5 bg-black/10 flex-1" />
                  <span className="text-sm font-black uppercase tracking-widest text-black/50">Risk Score Matchups</span>
                  <div className="h-0.5 bg-black/10 flex-1" />
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
              <Card className="border-2 border-black rounded-none bg-blue-50 shadow-[8px_8px_0px_0px_rgba(30,58,138,1)] mt-12 mb-8">
                <CardContent className="p-8">
                  <h3 className="font-black uppercase tracking-widest text-blue-900 mb-6 flex items-center gap-3 border-b-2 border-blue-200 pb-4">
                    <Info className="h-6 w-6" />
                    KEY INSIGHTS
                  </h3>
                  <ul className="space-y-4">
                    {activeData.insights.map((insight, i) => (
                      <li key={i} className="text-sm border-2 border-blue-900 bg-white p-4 font-bold text-black leading-relaxed shadow-[4px_4px_0px_0px_rgba(30,58,138,0.2)]">
                        {insight}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Bottom Actions */}
          <div className="mt-12 mb-8 flex flex-wrap gap-4 justify-center">
            <Button
              className="border-2 border-black font-black uppercase tracking-wider shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-y-1 active:shadow-none transition-all gap-2 rounded-none px-8 py-6 bg-white hover:bg-gray-100 text-black"
              onClick={() => {
                navigator.clipboard.writeText(window.location.href);
                toast.success("Battle link copied!");
              }}
            >
              <Share2 className="h-5 w-5" />
              COPY BATTLE LINK
            </Button>
          </div>

          {/* Related Actions */}
          <RelatedActions documentId={documentId} currentPage="battle" />
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
    <Card className="border-2 border-black rounded-none bg-white shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] mb-6 hover:-translate-y-1 hover:shadow-[10px_10px_0px_0px_rgba(0,0,0,1)] transition-all">
      <CardContent className="p-6 sm:p-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
          <h4 className="font-black text-xl uppercase tracking-tight text-black">{comp.clauseLabel}</h4>
          <div className="flex items-center gap-3">
            <span
              className="text-xs px-3 py-1.5 uppercase font-black tracking-widest border-2"
              style={{ backgroundColor: severity.bg, color: severity.text, borderColor: severity.border }}
            >
               {comp.severity === "critical" ? "⛔" : comp.severity === "worse" ? "🔴" : comp.severity === "average" ? "🟡" : "✅"}{" "}
               P{comp.percentile}
            </span>
            <span className="text-xs font-bold uppercase tracking-widest bg-gray-100 border-2 border-black px-3 py-1.5 text-black">{comp.sampleCount} SAMPLES</span>
          </div>
        </div>

        {/* Bars */}
        <div className="space-y-4 pr-10">
          {/* Your value */}
          <div className="flex items-center gap-4">
            <span className="text-xs font-black uppercase tracking-widest text-black w-24 flex-shrink-0">YOUR TERMS</span>
            <div className="flex-1 h-8 bg-gray-100 border-2 border-black rounded-none relative">
              <motion.div
                className="h-full border-r-2 border-black"
                style={{ backgroundColor: RISK_BAR_COLORS[comp.yourRiskLevel] || "#ef4444" }}
                initial={{ width: 0 }}
                animate={{ width: `${Math.max(comp.yourValue * scale, 1)}%` }}
                transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
              />
              <span className="absolute -right-2 top-1/2 -translate-y-1/2 translate-x-full text-sm font-black text-black">
                {comp.yourValue} {comp.yourUnit}
              </span>
            </div>
          </div>

          {/* Average */}
          <div className="flex items-center gap-4">
            <span className="text-xs font-black uppercase tracking-widest text-muted-foreground w-24 flex-shrink-0">MARKET APG</span>
            <div className="flex-1 h-8 bg-gray-100 border-2 border-gray-400 border-dashed rounded-none relative opacity-70">
              <motion.div
                className="h-full bg-gray-300 border-r-2 border-gray-400 border-dashed"
                initial={{ width: 0 }}
                animate={{ width: `${Math.max(comp.avgValue * scale, 1)}%` }}
                transition={{ duration: 0.8, ease: "easeOut", delay: 0.35 }}
              />
              <span className="absolute -right-2 top-1/2 -translate-y-1/2 translate-x-full text-sm font-bold text-gray-500">
                {comp.avgValue} {comp.avgUnit}
              </span>
            </div>
          </div>

          {/* Legal limit */}
          {comp.legalLimit != null && (
            <div className="flex items-center gap-4">
              <span className="text-xs font-black uppercase tracking-widest text-green-700 w-24 flex-shrink-0">LEGAL LIMIT</span>
              <div className="flex-1 h-8 bg-green-50 border-2 border-green-700 border-dotted rounded-none relative">
                <motion.div
                  className="h-full border-r-2 border-green-700 border-dotted opacity-50"
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.max(comp.legalLimit * scale, 1)}%` }}
                  transition={{ duration: 0.8, ease: "easeOut", delay: 0.5 }}
                  style={{
                    background: "repeating-linear-gradient(45deg, #166534 0px, #166534 2px, transparent 2px, transparent 6px)"
                  }}
                />
                <span className="absolute -right-2 top-1/2 -translate-y-1/2 translate-x-full text-sm font-black text-green-700">
                  {comp.legalLimit} {comp.legalUnit || comp.yourUnit}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Insight */}
        <div className="mt-8 pt-6 border-t-2 border-black/10">
          <p className="text-sm font-bold leading-relaxed" style={{ color: severity.text }}>
            <span className="font-black uppercase tracking-widest mr-2">VERDICT:</span> 
            {comp.insight}
            {comp.statuteCode && (
              <span className="text-gray-500 ml-2 font-black text-xs uppercase tracking-widest border-2 border-gray-300 px-2 py-0.5 rounded-none inline-block mt-2 sm:mt-0">— {comp.statuteCode}</span>
            )}
          </p>
        </div>
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
    <Card className="border-2 border-black rounded-none bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] mb-4">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h4 className="font-black text-black uppercase tracking-wider">{comp.clauseLabel}</h4>
          <span
            className="text-[10px] px-3 py-1 font-black uppercase tracking-widest border-2"
            style={{ backgroundColor: severity.bg, color: severity.text, borderColor: severity.border }}
          >
            P{comp.percentile}
          </span>
        </div>

        <div className="space-y-4 pr-10">
          <div className="flex items-center gap-4">
            <span className="text-[11px] font-black uppercase tracking-widest text-black w-16 flex-shrink-0">YOURS</span>
            <div className="flex-1 h-6 bg-gray-100 border-2 border-black relative">
              <motion.div
                className="h-full border-r-2 border-black"
                style={{ backgroundColor: RISK_BAR_COLORS[comp.yourRiskLevel] || "#ef4444" }}
                initial={{ width: 0 }}
                animate={{ width: `${(comp.yourScore / maxScore) * 100}%` }}
                transition={{ duration: 0.7, delay: 0.2 }}
              />
              <span className="absolute -right-2 top-1/2 -translate-y-1/2 translate-x-full text-[11px] font-black text-black">
                {comp.yourScore}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-[11px] font-black uppercase tracking-widest text-muted-foreground w-16 flex-shrink-0">MARKET</span>
            <div className="flex-1 h-6 bg-gray-100 border-2 border-gray-400 border-dashed relative opacity-70">
              <motion.div
                className="h-full bg-gray-300 border-r-2 border-gray-400 border-dashed"
                initial={{ width: 0 }}
                animate={{ width: `${(comp.avgScore / maxScore) * 100}%` }}
                transition={{ duration: 0.7, delay: 0.35 }}
              />
              <span className="absolute -right-2 top-1/2 -translate-y-1/2 translate-x-full text-[11px] font-bold text-gray-500">
                {comp.avgScore}
              </span>
            </div>
          </div>
        </div>

        <p className="text-sm font-bold mt-6 leading-relaxed bg-gray-50 border-2 border-black/10 p-3" style={{ color: severity.text }}>
          <span className="font-black uppercase tracking-widest text-black/50 mr-2">INSIGHT:</span>
          {comp.insight} <span className="text-xs text-black/40 font-black tracking-widest uppercase ml-2">({comp.sampleCount} SAMPLES)</span>
        </p>
      </CardContent>
    </Card>
  );
}