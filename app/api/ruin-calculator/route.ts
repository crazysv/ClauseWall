import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { runMonteCarloSimulation } from "@/lib/simulation/monte-carlo-engine";
import { buildFairComparison } from "@/lib/simulation/fair-comparison-engine";
import { analyzeInsuranceGap } from "@/lib/simulation/insurance-gap-analyzer";
import { calculateRiskAdjustedCost } from "@/lib/simulation/risk-adjusted-calculator";
import {
  PRESET_SCENARIOS,
  runStressTest,
} from "@/lib/simulation/stress-test-engine";
import type {
  FinancialRuinAnalysis,
  RuinCalculatorRequest,
} from "@/lib/simulation/types";
import { rateLimit, rateLimitResponse } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  try {
    const rl = await rateLimit(request, "AI_HEAVY");
    if (!rl.success) return rateLimitResponse(rl);

    const body: RuinCalculatorRequest = await request.json();
    const {
      documentId,
      baseMonthlyCost,
      monthlyIncome,
      iterations,
      months,
      insuranceCoverage,
    } = body;

    if (!documentId) {
      return NextResponse.json(
        { error: "Missing documentId" },
        { status: 400 },
      );
    }

    const supabase = await createClient();

    // Fetch document
    const { data: doc, error: docError } = await supabase
      .from("documents")
      .select("*")
      .eq("id", documentId)
      .single();

    if (docError || !doc) {
      return NextResponse.json(
        { error: "Document not found" },
        { status: 404 },
      );
    }

    // Fetch clauses
    const { data: clauses, error: clauseError } = await supabase
      .from("clauses")
      .select("*")
      .eq("document_id", documentId)
      .order("clause_number");

    if (clauseError || !clauses || clauses.length === 0) {
      return NextResponse.json(
        { error: "No clauses found. Run analysis first." },
        { status: 404 },
      );
    }

    // Fetch fair baseline rules
    const clauseTypes = [
      ...new Set(clauses.map((c: { clause_type: string }) => c.clause_type)),
    ];
    const { data: rules } = await supabase
      .from("structured_rules")
      .select("*")
      .in("clause_type", clauseTypes)
      .eq("is_active", true);

    const fairRules = rules || [];

    // Build config overrides
    const configOverrides: Record<string, unknown> = {
      documentType: doc.document_type || "rental",
      jurisdiction: doc.jurisdiction || "pan_india",
    };
    if (baseMonthlyCost) configOverrides.baseMonthlyCost = baseMonthlyCost;
    if (monthlyIncome) configOverrides.monthlyIncome = monthlyIncome;
    if (iterations) configOverrides.iterations = Math.min(iterations, 50000);
    if (months) configOverrides.months = Math.min(months, 120);

    // Run Monte Carlo simulation
    const simulation = runMonteCarloSimulation(
      clauses,
      fairRules,
      configOverrides,
    );

    // Build fair comparison
    const fairComparison = buildFairComparison(simulation);

    // Calculate risk-adjusted cost
    const base = baseMonthlyCost || 20000;
    const contractMonths = months || 36;
    const riskAdjusted = calculateRiskAdjustedCost(
      base,
      simulation.statistics.mean,
      contractMonths,
    );

    // Insurance gap
    const insuranceGap = analyzeInsuranceGap(
      simulation.percentiles,
      insuranceCoverage || 0,
    );

    // Run all preset stress tests
    const stressTests = PRESET_SCENARIOS.map((scenario) =>
      runStressTest(scenario, clauses, fairRules, configOverrides),
    );

    const result: FinancialRuinAnalysis = {
      documentId,
      documentName: doc.original_filename || "Contract",
      documentType: doc.document_type || "other",
      jurisdiction: doc.jurisdiction || "pan_india",
      config: {
        iterations: (configOverrides.iterations as number) || 10000,
        months: contractMonths,
        baseMonthlyCost: base,
        monthlyIncome: monthlyIncome || 60000,
        eventProbabilities: {} as Record<string, number>,
        correlations: {},
        documentType: doc.document_type || "rental",
        jurisdiction: doc.jurisdiction || "pan_india",
      },
      simulation: {
        ...simulation,
        iterations: [], // Don't send 10k numbers to client
        fairIterations: [],
      },
      riskAdjusted,
      fairComparison,
      insuranceGap,
      stressTests,
      generatedAt: new Date().toISOString(),
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error("[ClauseWall] Ruin calculator API error:", error);
    return NextResponse.json(
      { error: "Failed to run financial simulation. Please try again." },
      { status: 500 },
    );
  }
}
