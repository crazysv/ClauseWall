import { NextRequest, NextResponse } from "next/server";
import { generateDemandLetter } from "@/lib/ai/letter-generator";
import { rateLimit, rateLimitResponse } from "@/lib/rate-limit";
import { sanitizeLLMInput } from "@/lib/sanitize";
import type { Clause } from "@/types";

export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    // ── Rate Limiting ──
    const rl = await rateLimit(request, "AI_HEAVY");
    if (!rl.success) return rateLimitResponse(rl);

    const body = await request.json();
    const { documentType, jurisdiction, entityName, clauses } = body;

    if (!clauses || clauses.length === 0) {
      return NextResponse.json(
        { error: "No clauses provided" },
        { status: 400 },
      );
    }

    // Convert to Clause format expected by the generator
    const formattedClauses: Clause[] = clauses.map((c: any, index: number) => ({
      id: `temp-${index}`,
      document_id: "",
      clause_number: index + 1,
      original_text: sanitizeLLMInput(c.original_text || "", 5000),
      clause_type: c.clause_type || "general",
      risk_level: c.risk_level,
      risk_score: c.risk_score,
      explanation: sanitizeLLMInput(c.explanation || "", 2000),
      legal_issue: c.legal_issue || null,
      legal_citation: c.legal_citation || null,
      statute_code: c.legal_citation || null,
      fair_alternative: c.fair_alternative ? sanitizeLLMInput(c.fair_alternative, 2000) : null,
      red_flags: c.red_flags || [],
      percentile: null,
      created_at: new Date().toISOString(),
    }));

    // Generate the letter
    const letter = await generateDemandLetter(
      documentType,
      jurisdiction,
      entityName,
      formattedClauses,
    );

    return NextResponse.json({ letter });
  } catch (error) {
    console.error("[ClauseWall] Letter generation error:", error);
    return NextResponse.json(
      { error: (error as Error).message || "Failed to generate letter" },
      { status: 500 },
    );
  }
}
