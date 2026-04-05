import { NextRequest, NextResponse } from "next/server";
import { callGroq } from "@/lib/ai/groq-client";
import { CONTRACT_ROAST_PROMPT } from "@/lib/ai/system-prompt";
import { rateLimit, rateLimitResponse } from "@/lib/rate-limit";
import { sanitizeLLMInput } from "@/lib/sanitize";
import { RoastSchema } from "@/lib/validation/schemas";
import { validateBody } from "@/lib/validation/middleware";
import { safeParseJson } from "@/lib/ai/output-guards";

export async function POST(request: NextRequest) {
  try {
    // ── Rate Limiting ──
    const rl = await rateLimit(request, "AI_MEDIUM");
    if (!rl.success) return rateLimitResponse(rl);

    const body = await request.json();

    // ── Schema Validation ──
    const parsed = validateBody(body, RoastSchema);
    if (!parsed.success) return parsed.response;
    const { clauses, jurisdiction, documentType } = parsed.data;

    // Build clause list for the prompt
    const clauseList = clauses
      .map(
        (c) =>
          `[ID: ${c.id || "unknown"}] (Clause #${c.clause_number ?? 0}, Type: ${c.clause_type}, Risk: ${c.risk_level || "unknown"})
Text: "${sanitizeLLMInput(c.original_text || "", 2000)}"
Legal Issue: ${sanitizeLLMInput(c.explanation || "", 1000)}`,
      )
      .join("\n\n---\n\n");

    const response = await callGroq([
      {
        role: "system",
        content: CONTRACT_ROAST_PROMPT,
      },
      {
        role: "user",
        content: `Roast these clauses from a ${documentType || "unknown"} contract in ${jurisdiction || "India"}.

Return a JSON object mapping each clause ID to its roast text.

${clauseList}`,
      },
    ]);

    // Parse response with safe guard
    const aiResponse = safeParseJson(response);
    if (!aiResponse) {
      console.error("[ClauseWall] Roast JSON parse failed. Raw:", response.substring(0, 200));
      return NextResponse.json(
        { error: "Failed to parse roast response" },
        { status: 500 },
      );
    }

    // Validate
    const roasts: Record<string, string> = {};
    if (aiResponse.roasts && typeof aiResponse.roasts === "object") {
      for (const [id, text] of Object.entries(aiResponse.roasts)) {
        if (typeof text === "string" && text.trim().length > 0) {
          roasts[id] = text.trim();
        }
      }
    }

    return NextResponse.json({
      roasts,
      total_roasted: Object.keys(roasts).length,
    });
  } catch (error) {
    console.error("[ClauseWall] Roast API error:", error);
    return NextResponse.json(
      {
        error: "Roast generation failed. The contract was too spicy to handle.",
      },
      { status: 500 },
    );
  }
}
