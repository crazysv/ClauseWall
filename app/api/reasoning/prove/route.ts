import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { rateLimit, rateLimitResponse } from "@/lib/rate-limit";
import { extractValues } from "@/lib/ai/value-extractor";
import { runNeurosymbolicAnalysis } from "@/lib/reasoning";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    
    const rl = await rateLimit(request, "AI_HEAVY", user.id);
    if (!rl.success) return rateLimitResponse(rl);

    const body = await request.json();
    const { clauseText, jurisdiction, documentType, clauseType } = body;

    if (!clauseText || !jurisdiction || !documentType) {
      return NextResponse.json(
        { error: "clauseText, jurisdiction, and documentType are required" },
        { status: 400 },
      );
    }

    // Step 1: Extract structured values from clause text
    const extractedValues = await extractValues(
      clauseText,
      clauseType || "general",
      documentType,
    );

    // Step 2: Run neurosymbolic analysis
    const proofTree = await runNeurosymbolicAnalysis(
      clauseText,
      extractedValues,
      jurisdiction,
      documentType,
      clauseType || extractedValues.clause_type,
    );

    if (proofTree) {
      return NextResponse.json({
        success: true,
        proofTree,
        extractedValues,
      });
    }

    return NextResponse.json({
      success: true,
      proofTree: null,
      reason: "No matching rules found for formal proof construction",
      extractedValues,
    });
  } catch (error) {
    console.error("[ClauseWall] [API] Reasoning prove failed:", error);
    return NextResponse.json(
      { success: false, error: "Failed to run formal reasoning" },
      { status: 500 },
    );
  }
}
