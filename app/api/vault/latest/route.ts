// ============================================
// GET /api/vault/latest
// Get the most recent vault analysis for current user
// ============================================

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    let docsQuery = supabase
      .from("documents")
      .select("*", { count: "exact", head: true })
      .eq("analysis_status", "completed");

    const { count: contractCount } = await docsQuery;

    const hasEnoughContracts = (contractCount || 0) >= 2;

    // Fetch latest analysis
    let analysisQuery = supabase
      .from("vault_analyses")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(1);

    const { data: analysis, error } = await analysisQuery.maybeSingle();

    if (error) {
      console.error("[Vault] Fetch latest error:", error);
      // Don't fail — return no analysis state
    }

    if (!analysis) {
      return NextResponse.json({
        analysis: null,
        has_enough_contracts: hasEnoughContracts,
        contract_count: contractCount || 0,
      });
    }

    // Check if stale — any document re-analyzed since vault analysis
    let isStale = false;
    try {
      const docIds = analysis.document_ids || [];
      if (docIds.length > 0) {
        const { data: updatedDocs } = await supabase
          .from("documents")
          .select("id")
          .in("id", docIds)
          .gt("updated_at", analysis.created_at)
          .limit(1);

        isStale = (updatedDocs?.length || 0) > 0;
      }

      // Also check if new completed documents exist that weren't in the analysis
      let totalCompletedQuery = supabase
        .from("documents")
        .select("*", { count: "exact", head: true })
        .eq("analysis_status", "completed");

      const { count: totalCompleted } = await totalCompletedQuery;

      if ((totalCompleted || 0) > docIds.length) {
        isStale = true;
      }
    } catch {
      // Don't fail on staleness check
    }

    return NextResponse.json({
      analysis: {
        id: analysis.id,
        user_id: analysis.user_id,
        analyzed_at: analysis.created_at,
        document_ids: analysis.document_ids || [],
        conflicts: analysis.conflicts || [],
        coverage_gaps: analysis.coverage_gaps || [],
        cascading_failures: analysis.cascading_failures || [],
        financial_exposure: analysis.financial_exposure || {},
        unified_obligations: analysis.unified_obligations || [],
        what_if_results: analysis.what_if_results || [],
        risk_score: analysis.risk_score || 0,
        risk_summary: analysis.risk_summary || "",
      },
      is_stale: isStale,
      has_enough_contracts: hasEnoughContracts,
      contract_count: contractCount || 0,
    });
  } catch (error) {
    console.error("[Vault] Latest endpoint error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
