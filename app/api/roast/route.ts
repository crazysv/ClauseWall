import { NextRequest, NextResponse } from "next/server";
import { callGroq } from "@/lib/ai/groq-client";
import { CONTRACT_ROAST_PROMPT } from "@/lib/ai/system-prompt";
import { rateLimit, rateLimitResponse } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  try {
    // ── Rate Limiting ──
    const rl = await rateLimit(request, "AI_MEDIUM");
    if (!rl.success) return rateLimitResponse(rl);

    const body = await request.json();
    const { clauses, jurisdiction, documentType } = body;

    if (!clauses || !Array.isArray(clauses) || clauses.length === 0) {
      return NextResponse.json(
        { error: "No clauses provided" },
        { status: 400 },
      );
    }

    // Build clause list for the prompt
    const clauseList = clauses
      .map(
        (c: {
          id: string;
          clause_number: number;
          clause_type: string;
          original_text: string;
          risk_level: string;
          explanation: string;
        }) =>
          `[ID: ${c.id}] (Clause #${c.clause_number}, Type: ${c.clause_type}, Risk: ${c.risk_level})
Text: "${c.original_text}"
Legal Issue: ${c.explanation}`,
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

    // Parse response
    let parsed;
    try {
      let cleaned = response.trim();
      if (cleaned.startsWith("```json")) cleaned = cleaned.slice(7);
      if (cleaned.startsWith("```")) cleaned = cleaned.slice(3);
      if (cleaned.endsWith("```")) cleaned = cleaned.slice(0, -3);
      parsed = JSON.parse(cleaned.trim());
    } catch {
      console.error("[ClauseWall] Roast JSON parse failed. Raw:", response);
      return NextResponse.json(
        { error: "Failed to parse roast response" },
        { status: 500 },
      );
    }

    // Validate
    const roasts: Record<string, string> = {};
    if (parsed.roasts && typeof parsed.roasts === "object") {
      for (const [id, text] of Object.entries(parsed.roasts)) {
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
