import { NextRequest, NextResponse } from "next/server";
import { rewriteClause } from "@/lib/ai/clause-rewriter";
import { rateLimit, rateLimitResponse } from "@/lib/rate-limit";
import { sanitizeLLMInput } from "@/lib/sanitize";
import { RewriteSchema } from "@/lib/validation/schemas";
import { validateBody } from "@/lib/validation/middleware";

export async function POST(req: NextRequest) {
  try {
    // ── Rate Limiting ──
    const rl = await rateLimit(req, "AI_MEDIUM");
    if (!rl.success) return rateLimitResponse(rl);

    const body = await req.json();

    // ── Schema Validation ──
    const parsed = validateBody(body, RewriteSchema);
    if (!parsed.success) return parsed.response;

    const {
      clauseText,
      clauseType,
      jurisdiction,
      documentType,
      riskLevel,
      explanation,
      legalCitation,
      fairAlternative,
    } = parsed.data;

    const result = await rewriteClause(
      sanitizeLLMInput(clauseText, 10_000),
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
