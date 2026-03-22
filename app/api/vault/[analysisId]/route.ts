// ============================================
// GET /api/vault/[analysisId]
// Fetch an existing vault analysis by ID
// ============================================

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ analysisId: string }> }
) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { analysisId } = await params;

    if (!analysisId) {
      return NextResponse.json(
        { error: "Analysis ID is required" },
        { status: 400 }
      );
    }

    let query = supabase
      .from("vault_analyses")
      .select("*")
      .eq("id", analysisId);

    const { data: analysis, error } = await query.single();

    if (error || !analysis) {
      return NextResponse.json(
        { error: "Analysis not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
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
    });
  } catch (error) {
    console.error("[Vault] Fetch analysis error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
