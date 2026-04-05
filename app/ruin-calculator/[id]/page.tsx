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
  const [stressResults, setStressResults] = useState<
    Map<string, StressTestResult>
  >(new Map());
  const [stressLoading, setStressLoading] = useState<string | null>(null);
  const [activeStressResult, setActiveStressResult] =
    useState<StressTestResult | null>(null);

  // Insurance gap
  const [insuranceGap, setInsuranceGap] = useState<InsuranceGapResult | null>(
    null,
  );

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
    [documentId, baseMonthlyCost, monthlyIncome],
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
    [documentId, baseMonthlyCost, monthlyIncome],
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
    [stressResults, runStressTest],
  );

  // Handle insurance coverage change
  const handleCoverageChange = useCallback(
    (coverage: number) => {
      if (!analysis) return;
      const newGap = analyzeInsuranceGap(
        analysis.simulation.percentiles,
        coverage,
      );
      setInsuranceGap(newGap);
    },
    [analysis],
  );

  // ═══════════════════════════════════════════
  // LOADING
  // ═══════════════════════════════════════════
  if (loading) {
    return (
      <div className="min-h-screen bg-background p-4 sm:p-8 max-w-7xl mx-auto py-10 md:py-16">
        <Skeleton className="h-10 w-64 mb-6 border-4 border-black" />
        <Skeleton className="h-6 w-96 mb-8 border-2 border-black" />
        <div className="space-y-6">
          <Skeleton className="h-48 rounded-none border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]" />
          <Skeleton className="h-80 rounded-none border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]" />
          <div className="grid grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton
                key={i}
                className="h-24 rounded-none border-4 border-black"
              />
            ))}
          </div>
        </div>
        <div className="flex flex-col items-center justify-center mt-12 gap-4">
          <div className="relative p-6 border-4 border-black bg-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
            <Loader2 className="h-12 w-12 text-black animate-spin" />
          </div>
          <div className="text-center mt-4">
            <p className="text-xl font-black uppercase tracking-tight">
              Running Monte Carlo Simulation
            </p>
            <p className="text-sm font-bold text-gray-600 uppercase tracking-widest mt-2">
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
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 px-4">
        <div className="border-4 border-black p-6 bg-red-100 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
          <XCircle className="h-16 w-16 text-red-600 mx-auto mb-4" />
          <p className="text-red-900 text-center font-black uppercase text-xl">
            {error || "Something went wrong"}
          </p>
        </div>
        <div className="flex gap-4">
          <Button
            onClick={fetchAnalysis}
            className="rounded-none border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-y-1 hover:shadow-[0px_0px_0px_0px_rgba(0,0,0,1)] transition-all font-black uppercase tracking-wider"
          >
            Try Again
          </Button>
          <Link href={`/results/${documentId}`}>
            <Button
              variant="outline"
              className="rounded-none border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-y-1 hover:shadow-[0px_0px_0px_0px_rgba(0,0,0,1)] transition-all font-black uppercase tracking-wider"
            >
              Back to Results
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-10 md:py-16">
        {/* Back Button */}
        <button
          onClick={() => router.push(`/results/${documentId}`)}
          className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-foreground hover:text-foreground transition-colors mb-8"
        >
          <ArrowLeft className="h-5 w-5" />
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
          <div className="mt-8 flex justify-center">
            <button
              onClick={() => setConfigOpen(!configOpen)}
              className="text-xs font-bold uppercase tracking-widest text-foreground hover:text-foreground transition-colors border-2 border-black px-4 py-2"
            >
              {configOpen
                ? "Hide Settings ▲"
                : "Adjust Monthly Cost / Income ▼"}
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
                <div className="flex flex-wrap gap-4 mt-6 p-6 card-impact bg-muted/30">
                  <div className="flex-1 min-w-[180px]">
                    <label className="text-xs font-black uppercase tracking-widest block mb-2">
                      Monthly Cost (₹)
                    </label>
                    <input
                      type="number"
                      value={baseMonthlyCost}
                      onChange={(e) =>
                        setBaseMonthlyCost(parseInt(e.target.value) || 0)
                      }
                      className="w-full px-4 py-3 border-4 border-black rounded-none font-bold focus:outline-none focus:ring-0 focus:border-red-600 transition-colors"
                    />
                  </div>
                  <div className="flex-1 min-w-[180px]">
                    <label className="text-xs font-black uppercase tracking-widest block mb-2">
                      Monthly Income (₹)
                    </label>
                    <input
                      type="number"
                      value={monthlyIncome}
                      onChange={(e) =>
                        setMonthlyIncome(parseInt(e.target.value) || 0)
                      }
                      className="w-full px-4 py-3 border-4 border-black rounded-none font-bold focus:outline-none focus:ring-0 focus:border-green-600 transition-colors"
                    />
                  </div>
                  <div className="flex items-end">
                    <Button
                      onClick={fetchAnalysis}
                      className="h-[52px] px-8 rounded-none border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-y-1 hover:shadow-[0px_0px_0px_0px_rgba(0,0,0,1)] transition-all font-black uppercase tracking-wider gap-2"
                    >
                      <BarChart3 className="h-4 w-4" />
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
        <section className="mb-12">
          <div className="card-impact p-6">
            <h3 className="text-2xl font-black uppercase tracking-tight mb-8 flex items-center gap-3">
              <span className="p-2 border-4 border-black bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                <BarChart3 className="h-6 w-6 text-black" />
              </span>
              Probability of Financial Loss
            </h3>

            <MonteCarloChart
              histogram={analysis.simulation.histogram}
              percentiles={analysis.simulation.percentiles}
            />

            <div className="mt-8">
              <PercentileCards percentiles={analysis.simulation.percentiles} />
            </div>

            <div className="mt-8">
              <ProbabilityCallouts
                statistics={analysis.simulation.statistics}
                percentiles={analysis.simulation.percentiles}
              />
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════
            SECTION 3: Stress Test Scenarios
            ═══════════════════════════════════════════ */}
        <section className="mb-12">
          <h3 className="text-2xl font-black uppercase tracking-tight mb-8 flex items-center gap-3">
            <span className="p-2 border-4 border-black bg-orange-400 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <AlertTriangle className="h-6 w-6 text-black" />
            </span>
            What-If Stress Tests
          </h3>

          <StressTestGrid
            scenarios={PRESET_SCENARIOS}
            results={stressResults}
            loadingId={stressLoading}
            onRunTest={handleRunTest}
          />

          <div className="mt-8">
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
                className="mt-8"
              >
                <StressTestResultView result={activeStressResult} />
              </motion.div>
            )}
          </AnimatePresence>
        </section>

        {/* ═══════════════════════════════════════════
            SECTION 4: Fair Contract Comparison
            ═══════════════════════════════════════════ */}
        <section className="mb-12">
          <div className="card-impact p-6">
            <h3 className="text-2xl font-black uppercase tracking-tight mb-4 flex items-center gap-3">
              <span className="p-2 border-4 border-black bg-green-400 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                <Shield className="h-6 w-6 text-black" />
              </span>
              Your Contract vs Fair Market Contract
            </h3>

            <p className="text-sm font-bold uppercase tracking-widest text-foreground mb-8">
              Expected loss at 90th percentile (reasonable worst case):
            </p>

            <FairComparisonBar comparison={analysis.fairComparison} />

            <div className="mt-10">
              <FairComparisonTable
                comparison={analysis.fairComparison}
                documentId={documentId}
              />
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════
            SECTION 5: Insurance Gap
            ═══════════════════════════════════════════ */}
        {insuranceGap && (
          <section className="mb-12">
            <div className="card-impact p-6 bg-amber-50">
              <h3 className="text-2xl font-black uppercase tracking-tight mb-8 flex items-center gap-3">
                <span className="p-2 border-4 border-black bg-amber-400 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                  <TrendingUp className="h-6 w-6 text-black" />
                </span>
                Insurance Gap Analysis
              </h3>

              <InsuranceGapMeter
                gap={insuranceGap}
                onCoverageChange={handleCoverageChange}
              />
            </div>
          </section>
        )}

        {/* ═══════════════════════════════════════════
            SECTION 6: Risk Clause Ranking
            ═══════════════════════════════════════════ */}
        <section className="mb-12">
          <h3 className="text-2xl font-black uppercase tracking-tight mb-8 flex items-center gap-3">
            <span className="p-2 border-4 border-black bg-red-400 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <Target className="h-6 w-6 text-black" />
            </span>
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
        <div className="border-t-4 border-black pt-8 text-center space-y-6">
          <div className="flex flex-wrap justify-center gap-4">
            <Link href={`/negotiate/${documentId}`}>
              <Button
                variant="outline"
                className="rounded-none border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-y-1 hover:shadow-[0px_0px_0px_0px_rgba(0,0,0,1)] transition-all font-black uppercase tracking-wider"
              >
                📝 Negotiate Clauses
              </Button>
            </Link>
            <Link href={`/escape/${documentId}`}>
              <Button
                variant="outline"
                className="rounded-none border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-y-1 hover:shadow-[0px_0px_0px_0px_rgba(0,0,0,1)] transition-all font-black uppercase tracking-wider"
              >
                🚪 Escape Plan
              </Button>
            </Link>
            <Link href={`/letter/${documentId}`}>
              <Button
                variant="outline"
                className="rounded-none border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-y-1 hover:shadow-[0px_0px_0px_0px_rgba(0,0,0,1)] transition-all font-black uppercase tracking-wider"
              >
                📄 Legal Notice
              </Button>
            </Link>
          </div>

          <p className="text-xs font-bold uppercase tracking-widest text-foreground max-w-xl mx-auto">
            Generated by ClauseWall — Actuarial risk simulation for Indian
            contracts. This is illustrative analysis, not financial advice.
          </p>
        </div>
      </div>
    </div>
  );
}
