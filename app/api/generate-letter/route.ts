import { NextRequest, NextResponse } from "next/server";
import { generateDemandLetter } from "@/lib/ai/letter-generator";
import type { Clause } from "@/types";

export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { documentType, jurisdiction, entityName, clauses } = body;

    if (!clauses || clauses.length === 0) {
      return NextResponse.json(
        { error: "No clauses provided" },
        { status: 400 }
      );
    }

    // Convert to Clause format expected by the generator
    const formattedClauses: Clause[] = clauses.map((c: any, index: number) => ({
      id: `temp-${index}`,
      document_id: "",
      clause_number: index + 1,
      original_text: c.original_text,
      clause_type: c.clause_type || "general",
      risk_level: c.risk_level,
      risk_score: c.risk_score,
      explanation: c.explanation,
      legal_issue: c.legal_issue || null,
      legal_citation: c.legal_citation || null,
      statute_code: c.legal_citation || null,
      fair_alternative: c.fair_alternative || null,
      red_flags: c.red_flags || [],
      percentile: null,
      created_at: new Date().toISOString(),
    }));

    // Generate the letter
    const letter = await generateDemandLetter(
      documentType,
      jurisdiction,
      entityName,
      formattedClauses
    );

    return NextResponse.json({ letter });
  } catch (error) {
    console.error("[ClauseWall] Letter generation error:", error);
    return NextResponse.json(
      { error: (error as Error).message || "Failed to generate letter" },
      { status: 500 }
    );
  }
}