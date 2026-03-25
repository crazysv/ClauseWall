"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  BarChart3,
  FileText,
  Loader2,
  XCircle,
  Shield,
  TrendingUp,
  AlertTriangle,
  Target,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { getStateName, getDocumentTypeLabel } from "@/lib/utils/constants";
import { PRESET_SCENARIOS } from "@/lib/simulation/stress-test-engine";
import { analyzeInsuranceGap } from "@/lib/simulation/insurance-gap-analyzer";
import type {
  FinancialRuinAnalysis,
  StressTestResult,
  StressScenarioEvent,
  InsuranceGapResult,
} from "@/lib/simulation/types";

// Components
import RiskAdjustedHero from "@/components/ruin-calculator/risk-adjusted-hero";
import MonteCarloChart from "@/components/ruin-calculator/monte-carlo-chart";
import PercentileCards from "@/components/ruin-calculator/percentile-cards";
import ProbabilityCallouts from "@/components/ruin-calculator/probability-callouts";
import StressTestGrid from "@/components/ruin-calculator/stress-test-grid";
import StressTestBuilder from "@/components/ruin-calculator/stress-test-builder";
import StressTestResultView from "@/components/ruin-calculator/stress-test-result";
import FairComparisonBar from "@/components/ruin-calculator/fair-comparison-bar";
import FairComparisonTable from "@/components/ruin-calculator/fair-comparison-table";
import InsuranceGapMeter from "@/components/ruin-calculator/insurance-gap-meter";
import RiskClauseRanking from "@/components/ruin-calculator/risk-clause-ranking";

export default function RuinCalculatorPage() {
  const params = useParams();
  const router = useRouter();
  const documentId = params.id as string;

  const [analysis, setAnalysis] = useState<FinancialRuinAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [configOpen, setConfigOpen] = useState(false);

  // Config inputs
  const [baseMonthlyCost, setBaseMonthlyCost] = useState(20000);
  const [monthlyIncome, setMonthlyIncome] = useState(60000);

  // Stress test state
  const [stressResults, setStressResults] = useState<Map<string, StressTestResult>>(new Map());
  const [stressLoading, setStressLoading] = useState<string | null>(null);
  const [activeStressResult, setActiveStressResult] = useState<StressTestResult | null>(null);

  // Insurance gap
  const [insuranceGap, setInsuranceGap] = useState<InsuranceGapResult | null>(null);

  // Fetch simulation
  const fetchAnalysis = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/ruin-calculator", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          documentId,
          baseMonthlyCost,
          monthlyIncome,
        }),
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        throw new Error(data.error || "Failed to run simulation");
      }

      setAnalysis(data as FinancialRuinAnalysis);

      // Initialize insurance gap
      setInsuranceGap(data.insuranceGap);

      // Preload stress test results
      if (data.stressTests) {
        const map = new Map<string, StressTestResult>();
        data.stressTests.forEach((st: StressTestResult) => {
          map.set(st.scenario.id, st);
        });
        setStressResults(map);
      }

      toast.success("Simulation complete!");
    } catch (err) {
      console.error("[ClauseWall] Ruin calculator failed:", err);
      setError(err instanceof Error ? err.message : "Failed to run simulation");
    } finally {
      setLoading(false);
    }
  }, [documentId, baseMonthlyCost, monthlyIncome]);

  useEffect(() => {
    fetchAnalysis();
  }, [fetchAnalysis]);

  // Run individual stress test
  const runStressTest = useCallback(
    async (scenarioId: string) => {
      setStressLoading(scenarioId);
      try {
        const res = await fetch("/api/ruin-calculator/stress-test", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            documentId,
            scenarioId,
            baseMonthlyCost,
            monthlyIncome,
          }),
        });

        const data = await res.json();

        if (!res.ok || data.error) {
          throw new Error(data.error || "Stress test failed");
        }

        const result = data as StressTestResult;
        setStressResults((prev) => new Map(prev).set(scenarioId, result));
        setActiveStressResult(result);
      } catch (err) {
        toast.error("Stress test failed");
        console.error(err);
      } finally {
        setStressLoading(null);
      }
    },
    [documentId, baseMonthlyCost, monthlyIncome]
  );

  // Run custom stress test
  const runCustomStressTest = useCallback(
    async (events: StressScenarioEvent[]) => {
      setStressLoading("custom");
      try {
        const res = await fetch("/api/ruin-calculator/stress-test", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            documentId,
            customEvents: events,
            baseMonthlyCost,
            monthlyIncome,
          }),
        });

        const data = await res.json();

        if (!res.ok || data.error) {
          throw new Error(data.error || "Custom test failed");
        }

        const result = data as StressTestResult;
        setStressResults((prev) => new Map(prev).set("custom", result));
        setActiveStressResult(result);
      } catch (err) {
        toast.error("Custom test failed");
        console.error(err);
      } finally {
        setStressLoading(null);
      }
    },
    [documentId, baseMonthlyCost, monthlyIncome]
  );

  // Handle scenario click — show existing result or run new
  const handleRunTest = useCallback(
    (scenarioId: string) => {
      const existing = stressResults.get(scenarioId);
      if (existing) {
        setActiveStressResult(existing);
      }
      runStressTest(scenarioId);
    },
    [stressResults, runStressTest]
  );

  // Handle insurance coverage change
  const handleCoverageChange = useCallback(
    (coverage: number) => {
      if (!analysis) return;
      const newGap = analyzeInsuranceGap(analysis.simulation.percentiles, coverage);
      setInsuranceGap(newGap);
    },
    [analysis]
  );

  // ═══════════════════════════════════════════
  // LOADING
  // ═══════════════════════════════════════════
  if (loading) {
    return (
      <div className="min-h-screen bg-background p-4 sm:p-8 max-w-5xl mx-auto">
        <Skeleton className="h-6 w-48 mb-4" />
        <Skeleton className="h-4 w-96 mb-8" />
        <div className="space-y-6">
          <Skeleton className="h-48 rounded-2xl" />
          <Skeleton className="h-80 rounded-xl" />
          <div className="grid grid-cols-4 gap-3">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-24 rounded-xl" />
            ))}
          </div>
        </div>
        <div className="flex flex-col items-center justify-center mt-12 gap-4">
          <div className="relative">
            <Loader2 className="h-12 w-12 text-cyan-500 animate-spin" />
            <div className="absolute inset-0 h-12 w-12 bg-cyan-500/20 blur-xl rounded-full animate-pulse" />
          </div>
          <div className="text-center">
            <p className="text-lg font-semibold">Running Monte Carlo Simulation</p>
            <p className="text-sm text-white/40 mt-1">
              10,000 scenarios × 36 months — pure computation, no AI
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════
  // ERROR
  // ═══════════════════════════════════════════
  if (error || !analysis) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 px-4">
        <XCircle className="h-12 w-12 text-red-500" />
        <p className="text-red-400 text-center">{error || "Something went wrong"}</p>
        <div className="flex gap-3">
          <Button onClick={fetchAnalysis} variant="outline">
            Try Again
          </Button>
          <Link href={`/results/${documentId}`}>
            <Button variant="outline">Back to Results</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="relative px-4 sm:px-6 lg:px-8 py-8 pb-24 sm:pb-8">
      {/* Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-red-500/5 rounded-full blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-5xl">
        {/* Back Button */}
        <button
          onClick={() => router.push(`/results/${documentId}`)}
          className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Results
        </button>

        {/* ═══════════════════════════════════════════
            SECTION 1: HERO — Risk-Adjusted Cost
            ═══════════════════════════════════════════ */}
        <section className="mb-10">
          <RiskAdjustedHero
            riskAdjusted={analysis.riskAdjusted}
            documentName={analysis.documentName}
            documentType={getDocumentTypeLabel(analysis.documentType)}
            jurisdiction={getStateName(analysis.jurisdiction)}
            totalIterations={analysis.config.iterations}
            contractMonths={analysis.config.months}
          />

          {/* Config toggle */}
          <div className="mt-4 flex justify-center">
            <button
              onClick={() => setConfigOpen(!configOpen)}
              className="text-xs text-white/30 hover:text-white/50 transition-colors"
            >
              {configOpen ? "Hide settings ▲" : "Adjust monthly cost / income ▼"}
            </button>
          </div>

          <AnimatePresence>
            {configOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="flex flex-wrap gap-4 mt-4 p-4 rounded-xl bg-white/[0.02] border border-white/5">
                  <div className="flex-1 min-w-[180px]">
                    <label className="text-xs text-white/40 block mb-1">
                      Monthly Cost (₹)
                    </label>
                    <input
                      type="number"
                      value={baseMonthlyCost}
                      onChange={(e) => setBaseMonthlyCost(parseInt(e.target.value) || 0)}
                      className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white focus:outline-none focus:ring-1 focus:ring-white/20"
                    />
                  </div>
                  <div className="flex-1 min-w-[180px]">
                    <label className="text-xs text-white/40 block mb-1">
                      Monthly Income (₹)
                    </label>
                    <input
                      type="number"
                      value={monthlyIncome}
                      onChange={(e) => setMonthlyIncome(parseInt(e.target.value) || 0)}
                      className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white focus:outline-none focus:ring-1 focus:ring-white/20"
                    />
                  </div>
                  <div className="flex items-end">
                    <Button size="sm" onClick={fetchAnalysis} className="gap-2">
                      <BarChart3 className="h-3 w-3" />
                      Re-run
                    </Button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </section>

        {/* ═══════════════════════════════════════════
            SECTION 2: Monte Carlo Distribution
            ═══════════════════════════════════════════ */}
        <section className="mb-10">
          <Card className="bg-gray-900/50 border-gray-800">
            <CardContent className="p-6">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-cyan-400" />
                Probability of Financial Loss
              </h3>

              <MonteCarloChart
                histogram={analysis.simulation.histogram}
                percentiles={analysis.simulation.percentiles}
              />

              <div className="mt-6">
                <PercentileCards percentiles={analysis.simulation.percentiles} />
              </div>

              <div className="mt-6">
                <ProbabilityCallouts
                  statistics={analysis.simulation.statistics}
                  percentiles={analysis.simulation.percentiles}
                />
              </div>
            </CardContent>
          </Card>
        </section>

        {/* ═══════════════════════════════════════════
            SECTION 3: Stress Test Scenarios
            ═══════════════════════════════════════════ */}
        <section className="mb-10">
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-400" />
            What-If Stress Tests
          </h3>

          <StressTestGrid
            scenarios={PRESET_SCENARIOS}
            results={stressResults}
            loadingId={stressLoading}
            onRunTest={handleRunTest}
          />

          <div className="mt-4">
            <StressTestBuilder
              onRun={runCustomStressTest}
              isLoading={stressLoading === "custom"}
              contractMonths={analysis.config.months}
            />
          </div>

          {/* Active stress test result */}
          <AnimatePresence>
            {activeStressResult && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mt-4"
              >
                <StressTestResultView result={activeStressResult} />
              </motion.div>
            )}
          </AnimatePresence>
        </section>

        {/* ═══════════════════════════════════════════
            SECTION 4: Fair Contract Comparison
            ═══════════════════════════════════════════ */}
        <section className="mb-10">
          <Card className="bg-gray-900/50 border-gray-800">
            <CardContent className="p-6">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <Shield className="h-5 w-5 text-green-400" />
                Your Contract vs Fair Market Contract
              </h3>

              <p className="text-xs text-white/40 mb-4">
                Expected loss at 90th percentile (reasonable worst case):
              </p>

              <FairComparisonBar comparison={analysis.fairComparison} />

              <div className="mt-6">
                <FairComparisonTable
                  comparison={analysis.fairComparison}
                  documentId={documentId}
                />
              </div>
            </CardContent>
          </Card>
        </section>

        {/* ═══════════════════════════════════════════
            SECTION 5: Insurance Gap
            ═══════════════════════════════════════════ */}
        {insuranceGap && (
          <section className="mb-10">
            <Card className="bg-gray-900/50 border-gray-800">
              <CardContent className="p-6">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-yellow-400" />
                  Insurance Gap Analysis
                </h3>

                <InsuranceGapMeter
                  gap={insuranceGap}
                  onCoverageChange={handleCoverageChange}
                />
              </CardContent>
            </Card>
          </section>
        )}

        {/* ═══════════════════════════════════════════
            SECTION 6: Risk Clause Ranking
            ═══════════════════════════════════════════ */}
        <section className="mb-10">
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
            <Target className="h-5 w-5 text-red-400" />
            Clauses Ranked by Financial Risk
          </h3>

          <RiskClauseRanking
            rankings={analysis.simulation.topRiskClauses}
            documentId={documentId}
          />
        </section>

        {/* ═══════════════════════════════════════════
            FOOTER
            ═══════════════════════════════════════════ */}
        <div className="border-t border-white/5 pt-6 text-center space-y-3">
          <div className="flex flex-wrap justify-center gap-3">
            <Link href={`/negotiate/${documentId}`}>
              <Button variant="outline" size="sm" className="gap-2 text-xs">
                📝 Negotiate Clauses
              </Button>
            </Link>
            <Link href={`/escape/${documentId}`}>
              <Button variant="outline" size="sm" className="gap-2 text-xs">
                🚪 Escape Plan
              </Button>
            </Link>
            <Link href={`/letter/${documentId}`}>
              <Button variant="outline" size="sm" className="gap-2 text-xs">
                📄 Legal Notice
              </Button>
            </Link>
          </div>

          <p className="text-[10px] text-white/15">
            Generated by ClauseWall — Actuarial risk simulation for Indian contracts.
            This is illustrative analysis, not financial advice.
          </p>
        </div>
      </div>
    </div>
  );
}
