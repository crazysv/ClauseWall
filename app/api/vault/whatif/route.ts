// ============================================
// POST /api/vault/whatif
// Run a what-if scenario on demand
// ============================================

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { simulateWhatIf } from "@/lib/vault/whatif-simulator";
import type { WhatIfScenario, TemporalExtractionResult } from "@/types";

const VALID_SCENARIOS: WhatIfScenario[] = [
  "job_loss", "city_relocation", "marriage", "divorce", "child_birth",
  "disability", "hospitalization", "business_start", "property_purchase",
  "loan_default", "death", "retirement", "company_acquisition",
  "lawsuit", "natural_disaster", "custom",
];

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const body = await request.json();
    const {
      scenario,
      custom_description,
      document_ids,
    } = body as {
      scenario: WhatIfScenario;
      custom_description?: string;
      document_ids?: string[];
    };

    if (!scenario || !VALID_SCENARIOS.includes(scenario)) {
      return NextResponse.json(
        { error: "Invalid scenario. Must be one of: " + VALID_SCENARIOS.join(", ") },
        { status: 400 }
      );
    }

    if (scenario === "custom" && !custom_description) {
      return NextResponse.json(
        { error: "Custom scenario requires a description" },
        { status: 400 }
      );
    }

    // Fetch documents
    let docsQuery = supabase
      .from("documents")
      .select("*")
      .eq("analysis_status", "completed");

    if (document_ids && document_ids.length > 0) {
      docsQuery = docsQuery.in("id", document_ids);
    }

    const { data: docs, error: docsError } = await docsQuery.order("created_at", {
      ascending: false,
    });

    if (docsError || !docs || docs.length === 0) {
      return NextResponse.json(
        { error: "No analyzed contracts found" },
        { status: 400 }
      );
    }

    // Fetch clauses for each document
    const enrichedDocs = await Promise.all(
      docs.map(async (doc) => {
        const { data: clauses } = await supabase
          .from("clauses")
          .select("clause_number, original_text, clause_type, risk_level")
          .eq("document_id", doc.id)
          .order("clause_number", { ascending: true });

        return {
          id: doc.id,
          title: doc.original_filename || "Untitled Contract",
          document_type: doc.document_type || "other",
          entity_name: doc.entity_name || null,
          jurisdiction: doc.jurisdiction || "ALL-INDIA",
          clauses: (clauses || []).map((c: Record<string, unknown>) => ({
            clause_number: Number(c.clause_number) || 1,
            original_text: String(c.original_text || ""),
            clause_type: String(c.clause_type || ""),
            risk_level: String(c.risk_level || "safe"),
          })),
          overall_risk_score: Number(doc.overall_risk_score) || 0,
        };
      })
    );

    // Run the what-if simulation
    const result = await simulateWhatIf(
      scenario,
      custom_description || null,
      enrichedDocs
    );

    // Optionally update the latest vault analysis with the new what-if result
    try {
      let analysisQuery = supabase
        .from("vault_analyses")
        .select("id, what_if_results")
        .order("created_at", { ascending: false })
        .limit(1);

      const { data: latestAnalysis } = await analysisQuery.maybeSingle();

      if (latestAnalysis) {
        const existingResults = Array.isArray(latestAnalysis.what_if_results)
          ? latestAnalysis.what_if_results
          : [];

        // Replace if same scenario exists, otherwise append
        const filteredResults = existingResults.filter(
          (r: { scenario: string }) => r.scenario !== scenario
        );
        filteredResults.push(result);

        await supabase
          .from("vault_analyses")
          .update({ what_if_results: filteredResults })
          .eq("id", latestAnalysis.id);
      }
    } catch (updateError) {
      console.error("[Vault] Failed to update what-if results:", updateError);
      // Non-critical — don't fail the request
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("[Vault] What-if endpoint error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
