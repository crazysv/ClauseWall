import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { rateLimit, rateLimitResponse } from "@/lib/rate-limit";
import { analyzeAdversarial } from "@/lib/ai/adversarial-analyzer";
import { AdversarialSchema } from "@/lib/validation/schemas";
import { validateBody } from "@/lib/validation/middleware";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    
    const rl = await rateLimit(request, "AI_HEAVY", user.id);
    if (!rl.success) return rateLimitResponse(rl);

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
