// ============================================
// POST /api/vault/analyze
// Runs full cross-contract analysis
// ============================================

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  detectCrossContractConflicts,
  analyzeCoverageGaps,
  analyzeCascadingFailures,
  calculateFinancialExposure,
  unifyObligations,
  simulateWhatIf,
  calculateVaultRiskScore,
  generateVaultSummary,
} from "@/lib/vault";
import type {
  CrossContractConflict,
  CoverageGap,
  CascadingFailure,
  FinancialExposure,
  UnifiedObligation,
  WhatIfResult,
  TemporalExtractionResult,
} from "@/types";

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // Parse body
    let documentIds: string[] | undefined;
    try {
      const body = await request.json();
      documentIds = body.document_ids;
    } catch {
      // No body or invalid JSON — analyze all contracts
    }

    // Fetch documents
    let docsQuery = supabase
      .from("documents")
      .select("*")
      .eq("analysis_status", "completed");

    if (documentIds && documentIds.length > 0) {
      docsQuery = docsQuery.in("id", documentIds);
    }

    const { data: docs, error: docsError } = await docsQuery.order(
      "created_at",
      {
        ascending: false,
      },
    );

    if (docsError) {
      console.error("[Vault] Failed to fetch documents:", docsError);
      return NextResponse.json(
        { error: "Failed to fetch documents" },
        { status: 500 },
      );
    }

    if (!docs || docs.length < 2) {
      return NextResponse.json(
        {
          error:
            "Need at least 2 analyzed contracts for cross-contract analysis",
          contract_count: docs?.length || 0,
        },
        { status: 400 },
      );
    }

    // Fetch clauses for each document
    const enrichedDocs = await Promise.all(
      docs.map(async (doc) => {
        const { data: clauses } = await supabase
          .from("clauses")
          .select("*")
          .eq("document_id", doc.id)
          .order("clause_number", { ascending: true });

        return {
          id: doc.id,
          title: doc.original_filename || "Untitled Contract",
          document_type: doc.document_type || "other",
          jurisdiction: doc.jurisdiction || "ALL-INDIA",
          entity_name: doc.entity_name || null,
          clauses: (clauses || []).map((c: Record<string, unknown>) => ({
            clause_number: Number(c.clause_number) || 1,
            original_text: String(c.original_text || ""),
            clause_type: String(c.clause_type || ""),
            risk_level: String(c.risk_level || "safe"),
            legal_citation: c.legal_citation ? String(c.legal_citation) : null,
            extracted_value:
              c.extracted_value != null ? Number(c.extracted_value) : null,
            extracted_unit: c.extracted_unit ? String(c.extracted_unit) : null,
          })),
          power_balance: doc.power_balance || null,
          overall_risk_score: Number(doc.overall_risk_score) || 0,
          temporal_data:
            (doc.temporal_data as TemporalExtractionResult) || null,
        };
      }),
    );

    // Run analyses in parallel with Promise.allSettled for resilience
    console.log(
      "[Vault] Starting cross-contract analysis for",
      enrichedDocs.length,
      "documents",
    );

    const [conflictsResult, gapsResult, cascadesResult] =
      await Promise.allSettled([
        detectCrossContractConflicts(enrichedDocs),
        delay(500).then(() => analyzeCoverageGaps(enrichedDocs)),
        delay(1000).then(() => analyzeCascadingFailures(enrichedDocs)),
      ]);

    // Extract results with fallbacks
    const conflicts: CrossContractConflict[] =
      conflictsResult.status === "fulfilled" ? conflictsResult.value : [];
    const coverageGaps: CoverageGap[] =
      gapsResult.status === "fulfilled" ? gapsResult.value : [];
    const cascadingFailures: CascadingFailure[] =
      cascadesResult.status === "fulfilled" ? cascadesResult.value : [];

    // Log any failures
    if (conflictsResult.status === "rejected") {
      console.error(
        "[Vault] Conflict detection failed:",
        conflictsResult.reason,
      );
    }
    if (gapsResult.status === "rejected") {
      console.error("[Vault] Gap analysis failed:", gapsResult.reason);
    }
    if (cascadesResult.status === "rejected") {
      console.error("[Vault] Cascade analysis failed:", cascadesResult.reason);
    }

    // These are pure TypeScript — always succeed
    const financialExposure: FinancialExposure =
      calculateFinancialExposure(enrichedDocs);
    const unifiedObligations: UnifiedObligation[] =
      unifyObligations(enrichedDocs);

    // Calculate vault risk score
    const { score, summary, overall_risk } = calculateVaultRiskScore(
      conflicts,
      coverageGaps,
      cascadingFailures,
      financialExposure,
      enrichedDocs.length,
    );

    // Run 3 default what-if scenarios sequentially (to avoid rate limits)
    const whatIfResults: WhatIfResult[] = [];
    const defaultScenarios = [
      "job_loss",
      "hospitalization",
      "loan_default",
    ] as const;

    for (const scenario of defaultScenarios) {
      try {
        await delay(500);
        const result = await simulateWhatIf(scenario, null, enrichedDocs);
        whatIfResults.push(result);
      } catch (error) {
        console.error(`[Vault] What-if ${scenario} failed:`, error);
        // Continue with other scenarios
      }
    }

    // Build the full result
    const analysisResult = {
      ...(user ? { user_id: user.id } : {}),
      document_ids: enrichedDocs.map((d) => d.id),
      conflicts,
      coverage_gaps: coverageGaps,
      cascading_failures: cascadingFailures,
      financial_exposure: financialExposure,
      unified_obligations: unifiedObligations,
      what_if_results: whatIfResults,
      risk_score: score,
      risk_summary: summary,
    };

    // Save to database
    const { data: saved, error: saveError } = await supabase
      .from("vault_analyses")
      .insert(analysisResult)
      .select("id, created_at")
      .single();

    if (saveError) {
      console.error("[Vault] Failed to save analysis:", saveError);
      // Still return the result even if save fails
      return NextResponse.json({
        ...analysisResult,
        id: crypto.randomUUID(),
        analyzed_at: new Date().toISOString(),
        save_error: "Analysis complete but could not be saved.",
      });
    }

    console.log("[Vault] Analysis complete. ID:", saved.id);

    return NextResponse.json({
      ...analysisResult,
      id: saved.id,
      analyzed_at: saved.created_at,
    });
  } catch (error) {
    console.error("[Vault] Analysis endpoint error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
