import { NextRequest, NextResponse } from "next/server";
import { analyzeAdversarial } from "@/lib/ai/adversarial-analyzer";
import { AdversarialSchema } from "@/lib/validation/schemas";
import { validateBody } from "@/lib/validation/middleware";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // ── Schema Validation ──
    const parsed = validateBody(body, AdversarialSchema);
    if (!parsed.success) return parsed.response;
    const { clauseText, clauseType, jurisdiction, documentType } = parsed.data;

    const result = await analyzeAdversarial(
      clauseText,
      clauseType,
      jurisdiction,
      documentType,
    );

    return NextResponse.json({
      success: true,
      result,
    });
  } catch (error) {
    console.error("[ClauseWall] [API] Adversarial analysis failed:", error);
    return NextResponse.json(
      { error: "Failed to analyze clause for deception" },
      { status: 500 },
    );
  }
}
