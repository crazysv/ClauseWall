// ============================================
// GET /api/vault/documents
// List all user's analyzed contracts for vault selection
// ============================================

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    let query = supabase
      .from("documents")
      .select(
        "id, original_filename, document_type, jurisdiction, entity_name, overall_risk_score, total_clauses, analysis_status, created_at",
        { count: "exact" }
      )
      .eq("analysis_status", "completed");

    const { data: documents, error, count } = await query.order("created_at", { ascending: false });

    if (error) {
      console.error("[Vault] Fetch documents error:", error);
      return NextResponse.json(
        { error: "Failed to fetch documents" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      documents: documents || [],
      total: count || 0,
    });
  } catch (error) {
    console.error("[Vault] Documents endpoint error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
