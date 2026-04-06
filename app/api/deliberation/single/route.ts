// ============================================
// API: POST /api/deliberation/single
// On-demand deliberation for a single clause
// ============================================

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { rateLimit, rateLimitResponse } from "@/lib/rate-limit";
import { deliberateClause } from "@/lib/deliberation";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    
    const rl = await rateLimit(request, "AI_MEDIUM", user.id);
    if (!rl.success) return rateLimitResponse(rl);

    const body = await request.json();
    const {
      clauseText,
      documentType,
      jurisdiction,
      clauseType,
      proofTreeSummary,
    } = body as {
      clauseText?: string;
      documentType?: string;
      jurisdiction?: string;
      clauseType?: string;
      proofTreeSummary?: string;
    };

    // Validate required fields
    if (!clauseText) {
      return NextResponse.json(
        { success: false, error: "clauseText is required" },
        { status: 400 },
      );
    }

    if (!documentType) {
      return NextResponse.json(
        { success: false, error: "documentType is required" },
        { status: 400 },
      );
    }

    if (!jurisdiction) {
      return NextResponse.json(
        { success: false, error: "jurisdiction is required" },
        { status: 400 },
      );
    }

    const deliberation = await deliberateClause(
      clauseText,
      clauseType,
      documentType,
      jurisdiction,
      {
        proofTreeSummary: proofTreeSummary || undefined,
      },
    );

    return NextResponse.json({ success: true, deliberation });
  } catch (error) {
    console.error("[ClauseWall] [API] Single deliberation failed:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Single clause deliberation failed. Please try again.",
      },
      { status: 500 },
    );
  }
}
