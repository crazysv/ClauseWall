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
      <div className="min-h-screen bg-[#050505] p-4 sm:p-8 max-w-7xl mx-auto py-10 md:py-16">
        <div className="h-10 w-64 mb-6 bg-neutral-900 animate-pulse rounded-sm" />
        <div className="h-6 w-96 mb-8 bg-neutral-900 border border-neutral-800 animate-pulse rounded-sm" />
        <div className="space-y-6">
          <div className="h-48 border border-neutral-900 bg-[#0a0a0a] animate-pulse rounded-sm" />
          <div className="h-80 border border-neutral-900 bg-[#0a0a0a] animate-pulse rounded-sm" />
          <div className="grid grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="h-24 border border-neutral-900 bg-[#0a0a0a] animate-pulse rounded-sm"
              />
            ))}
          </div>
        </div>
        <div className="flex flex-col items-center justify-center mt-12 gap-4">
          <div className="relative p-6 border border-neutral-800 bg-[#0a0a0a] rounded-sm">
            <Loader2 className="h-12 w-12 text-cyan-500 animate-spin" />
            <div className="absolute inset-0 h-12 w-12 bg-cyan-500/20 blur-xl rounded-full animate-pulse mx-auto my-auto top-0 bottom-0 left-0 right-0" />
          </div>
          <div className="text-center mt-4">
            <p className="text-[10px] font-mono font-bold uppercase tracking-widest text-cyan-500">
              [RUNNING MONTE CARLO SIMULATION]
            </p>
            <p className="text-[9px] font-mono text-neutral-500 uppercase tracking-widest mt-2">
              10,000 SCENARIOS × 36 MONTHS
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
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 px-4 bg-[#050505]">
        <div className="border border-red-900/50 p-6 bg-red-950/20 rounded-sm">
          <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <p className="text-red-400 text-center font-mono uppercase tracking-widest text-[10px]">
            {error || "[CALCULATION FAILURE]"}
          </p>
        </div>
        <div className="flex gap-4">
          <button
            onClick={fetchAnalysis}
            className="px-6 py-3 bg-red-900/40 text-red-400 border border-red-900/50 hover:bg-red-900/60 font-mono text-[10px] uppercase tracking-widest transition-colors rounded-sm"
          >
            [RE-INITIALIZE]
          </button>
          <Link href={`/results/${documentId}`}>
            <button
              className="px-6 py-3 bg-[#0a0a0a] text-neutral-400 border border-neutral-800 hover:bg-neutral-900 font-mono text-[10px] uppercase tracking-widest transition-colors rounded-sm"
            >
              [RETURN TO RESULTS]
            </button>
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
              className="text-[9px] font-mono uppercase tracking-widest text-neutral-500 hover:text-white transition-colors border border-neutral-800 bg-[#0a0a0a] px-4 py-2 rounded-sm"
            >
              {configOpen
                ? "[HIDE SETTINGS ▲]"
                : "[ADJUST MONTHLY COST / INCOME ▼]"}
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
                <div className="flex flex-wrap gap-4 mt-6 p-6 border border-neutral-900 bg-[#050505] rounded-sm">
                  <div className="flex-1 min-w-[180px]">
                    <label className="text-[10px] font-mono text-neutral-500 uppercase tracking-widest block mb-2">
                      Monthly Cost (₹)
                    </label>
                    <input
                      type="number"
                      value={baseMonthlyCost}
                      onChange={(e) =>
                        setBaseMonthlyCost(parseInt(e.target.value) || 0)
                      }
                      className="w-full px-4 py-3 bg-[#0a0a0a] border border-neutral-800 rounded-sm text-white font-mono focus:outline-none focus:ring-1 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-colors"
                    />
                  </div>
                  <div className="flex-1 min-w-[180px]">
                    <label className="text-[10px] font-mono text-neutral-500 uppercase tracking-widest block mb-2">
                      Monthly Income (₹)
                    </label>
                    <input
                      type="number"
                      value={monthlyIncome}
                      onChange={(e) =>
                        setMonthlyIncome(parseInt(e.target.value) || 0)
                      }
                      className="w-full px-4 py-3 bg-[#0a0a0a] border border-neutral-800 rounded-sm text-white font-mono focus:outline-none focus:ring-1 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-colors"
                    />
                  </div>
                  <div className="flex items-end">
                    <button
                      onClick={fetchAnalysis}
                      className="h-[50px] px-8 bg-cyan-950/20 text-cyan-400 border border-cyan-900/50 hover:bg-cyan-900/40 transition-colors font-mono text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 rounded-sm"
                    >
                      <BarChart3 className="h-4 w-4" />
                      [RE-RUN SIMULATION]
                    </button>
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
          <div className="border border-neutral-900 bg-[#050505] p-6 rounded-sm">
            <h3 className="font-mono text-lg text-white uppercase tracking-widest mb-8 flex items-center gap-3">
              <span className="p-1.5 bg-[#0a0a0a] border border-neutral-800 rounded-sm">
                <BarChart3 className="h-4 w-4 text-cyan-500" />
              </span>
              [Probability of Financial Loss]
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
          <h3 className="font-mono text-lg text-white uppercase tracking-widest mb-8 flex items-center gap-3">
            <span className="p-1.5 bg-[#0a0a0a] border border-neutral-800 rounded-sm">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
            </span>
            [WHAT-IF STRESS TESTS]
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
          <div className="border border-neutral-900 bg-[#050505] p-6 rounded-sm">
            <h3 className="font-mono text-lg text-white uppercase tracking-widest mb-4 flex items-center gap-3">
              <span className="p-1.5 bg-[#0a0a0a] border border-neutral-800 rounded-sm">
                <Shield className="h-4 w-4 text-emerald-500" />
              </span>
              [YOUR CONTRACT VS FAIR MARKET]
            </h3>

            <p className="text-[10px] font-mono text-neutral-500 uppercase tracking-widest mb-8">
              [EXPECTED LOSS AT 90TH PERCENTILE // REASONABLE WORST CASE]:
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
            <div className="border border-amber-900/30 bg-[#0a0a0a] p-6 rounded-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 blur-[80px] rounded-full pointer-events-none" />
              <h3 className="font-mono text-lg text-white uppercase tracking-widest mb-8 flex items-center gap-3 relative z-10">
                <span className="p-1.5 bg-[#050505] border border-amber-900/50 rounded-sm">
                  <TrendingUp className="h-4 w-4 text-amber-500" />
                </span>
                [INSURANCE GAP ANALYSIS]
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
          <h3 className="font-mono text-lg text-white uppercase tracking-widest mb-8 flex items-center gap-3">
            <span className="p-1.5 bg-[#0a0a0a] border border-red-900/50 rounded-sm">
              <Target className="h-4 w-4 text-red-500" />
            </span>
            [CLAUSES RANKED BY FINANCIAL RISK]
          </h3>

          <RiskClauseRanking
            rankings={analysis.simulation.topRiskClauses}
            documentId={documentId}
          />
        </section>

        {/* ═══════════════════════════════════════════
            FOOTER
            ═══════════════════════════════════════════ */}
        <div className="border-t border-neutral-900 pt-8 text-center space-y-6">
          <div className="flex flex-wrap justify-center gap-4">
            <Link href={`/negotiate/${documentId}`}>
              <button
                className="px-6 py-3 bg-[#0a0a0a] text-neutral-400 border border-neutral-800 hover:text-white hover:border-neutral-700 font-mono text-[10px] uppercase tracking-widest transition-colors rounded-sm"
              >
                [NEGOTIATE CLAUSES]
              </button>
            </Link>
            <Link href={`/escape/${documentId}`}>
              <button
                className="px-6 py-3 bg-[#0a0a0a] text-neutral-400 border border-neutral-800 hover:text-white hover:border-neutral-700 font-mono text-[10px] uppercase tracking-widest transition-colors rounded-sm"
              >
                [ESCAPE PLAN]
              </button>
            </Link>
            <Link href={`/letter/${documentId}`}>
              <button
                className="px-6 py-3 bg-[#0a0a0a] text-neutral-400 border border-neutral-800 hover:text-white hover:border-neutral-700 font-mono text-[10px] uppercase tracking-widest transition-colors rounded-sm"
              >
                [LEGAL NOTICE]
              </button>
            </Link>
          </div>

          <p className="text-[9px] font-mono uppercase tracking-widest text-neutral-600 max-w-xl mx-auto">
            [GENERATED BY CLAUSEWALL] — ACTUARIAL RISK SIMULATION FOR INDIAN
            CONTRACTS. THIS IS ILLUSTRATIVE ANALYSIS, NOT FINANCIAL ADVICE.
          </p>
        </div>
      </div>
    </div>
  );
}
