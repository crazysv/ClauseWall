import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  runStressTest,
  buildCustomScenario,
  PRESET_SCENARIOS,
} from "@/lib/simulation/stress-test-engine";
import type { StressTestRequest } from "@/lib/simulation/types";

export async function POST(request: NextRequest) {
  try {
    const body: StressTestRequest = await request.json();
    const { documentId, scenarioId, customEvents, baseMonthlyCost, monthlyIncome } = body;

    if (!documentId) {
      return NextResponse.json({ error: "Missing documentId" }, { status: 400 });
    }

    const supabase = await createClient();

    // Fetch clauses
    const { data: clauses, error: clauseError } = await supabase
      .from("clauses")
      .select("*")
      .eq("document_id", documentId)
      .order("clause_number");

    if (clauseError || !clauses || clauses.length === 0) {
      return NextResponse.json(
        { error: "No clauses found" },
        { status: 404 }
      );
    }

    // Fetch document for context
    const { data: doc } = await supabase
      .from("documents")
      .select("document_type, jurisdiction")
      .eq("id", documentId)
      .single();

    // Fetch fair rules
    const clauseTypes = [...new Set(clauses.map((c: { clause_type: string }) => c.clause_type))];
    const { data: rules } = await supabase
      .from("structured_rules")
      .select("*")
      .in("clause_type", clauseTypes)
      .eq("is_active", true);

    const fairRules = rules || [];

    // Find or build scenario
    let scenario;
    if (customEvents && customEvents.length > 0) {
      scenario = buildCustomScenario(customEvents);
    } else if (scenarioId) {
      scenario = PRESET_SCENARIOS.find((s) => s.id === scenarioId);
      if (!scenario) {
        return NextResponse.json(
          { error: `Unknown scenario: ${scenarioId}` },
          { status: 400 }
        );
      }
    } else {
      return NextResponse.json(
        { error: "Provide scenarioId or customEvents" },
        { status: 400 }
      );
    }

    const configOverrides: Record<string, unknown> = {
      documentType: doc?.document_type || "rental",
      jurisdiction: doc?.jurisdiction || "pan_india",
    };
    if (baseMonthlyCost) configOverrides.baseMonthlyCost = baseMonthlyCost;
    if (monthlyIncome) configOverrides.monthlyIncome = monthlyIncome;

    const result = runStressTest(scenario, clauses, fairRules, configOverrides);

    return NextResponse.json(result);
  } catch (error) {
    console.error("[ClauseWall] Stress test API error:", error);
    return NextResponse.json(
      { error: "Failed to run stress test" },
      { status: 500 }
    );
  }
}
