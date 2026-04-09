import { NextResponse } from "next/server";
import { withApiHandler } from "@/lib/api/with-api-handler";
import { RoastSchema, type RoastInput } from "@/lib/validation/schemas";
import { callGroq } from "@/lib/ai/groq-client";
import { CONTRACT_ROAST_PROMPT } from "@/lib/ai/system-prompt";
import { sanitizeLLMInput } from "@/lib/sanitize";
import { safeParseJson } from "@/lib/ai/output-guards";

export const POST = withApiHandler<RoastInput>(
  {
    module: "roast",
    rateLimit: "AI_MEDIUM",
    auth: true,
    schema: RoastSchema,
  },
  async (ctx) => {
    const { clauses, jurisdiction, documentType } = ctx.body;

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
        content: `Roast these clauses from a ${documentType} contract in ${jurisdiction}.

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
  },
);

