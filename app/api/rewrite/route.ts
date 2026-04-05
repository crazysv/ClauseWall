import { NextRequest, NextResponse } from "next/server";
import { rewriteClause } from "@/lib/ai/clause-rewriter";
import { rateLimit, rateLimitResponse } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  try {
    // ── Rate Limiting ──
    const rl = await rateLimit(req, "AI_MEDIUM");
    if (!rl.success) return rateLimitResponse(rl);

    const body = await req.json();

    const {
      clauseText,
      clauseType,
      jurisdiction,
      documentType,
      riskLevel,
      explanation,
      legalCitation,
      fairAlternative,
    } = body;

    if (!clauseText || !clauseType || !jurisdiction || !documentType) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    const result = await rewriteClause(
      clauseText,
      clauseType,
      jurisdiction,
      documentType,
      riskLevel || "warning",
      explanation || null,
      legalCitation || null,
      fairAlternative || null,
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error("[ClauseWall] Rewrite API failed:", error);
    return NextResponse.json(
      { error: "Failed to rewrite clause. Please try again." },
      { status: 500 },
    );
  }
}
