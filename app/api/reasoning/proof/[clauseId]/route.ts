import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { rateLimit, rateLimitResponse } from "@/lib/rate-limit";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ clauseId: string }> },
) {
  try {
    const { clauseId } = await params;

    if (!clauseId) {
      return NextResponse.json(
        { error: "clauseId is required" },
        { status: 400 },
      );
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const rl = await rateLimit(request, "DB_WRITE", user.id);
    if (!rl.success) return rateLimitResponse(rl);

    const { data: clause, error } = await supabase
      .from("clauses")
      .select("id, clause_type, original_text, risk_level, proof_data")
      .eq("id", clauseId)
      .single();

    if (error || !clause) {
      return NextResponse.json({ error: "Clause not found" }, { status: 404 });
    }

    const proofData = clause.proof_data;

    if (!proofData) {
      return NextResponse.json({
        success: true,
        proofTree: null,
        reason: "No formal proof available for this clause",
      });
    }

    // Parse proof data (stored as JSONB or stringified JSON)
    const proofTree =
      typeof proofData === "string" ? JSON.parse(proofData) : proofData;

    return NextResponse.json({
      success: true,
      proofTree,
      clauseId: clause.id,
      clauseType: clause.clause_type,
      riskLevel: clause.risk_level,
    });
  } catch (error) {
    console.error("[ClauseWall] [API] Fetch proof failed:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch proof data" },
      { status: 500 },
    );
  }
}
