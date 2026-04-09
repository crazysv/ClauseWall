import { NextResponse } from "next/server";
import { withApiHandler } from "@/lib/api/with-api-handler";
import { GenerateLetterSchema, type GenerateLetterInput } from "@/lib/validation/schemas";
import { generateDemandLetter } from "@/lib/ai/letter-generator";
import { sanitizeLLMInput } from "@/lib/sanitize";
import type { Clause } from "@/types";

export const maxDuration = 60;

export const POST = withApiHandler<GenerateLetterInput>(
  {
    module: "generate-letter",
    rateLimit: "AI_HEAVY",
    auth: true,
    schema: GenerateLetterSchema,
  },
  async (ctx) => {
    const { documentType, jurisdiction, entityName, clauses } = ctx.body;

    // Convert to Clause format expected by the generator
    const formattedClauses: Clause[] = clauses.map((c, index) => ({
      id: `temp-${index}`,
      document_id: "",
      clause_number: index + 1,
      original_text: sanitizeLLMInput(c.original_text || "", 5000),
      clause_type: c.clause_type || "general",
      risk_level: c.risk_level || "warning" as const,
      risk_score: c.risk_score || 0,
      explanation: sanitizeLLMInput(c.explanation || "", 2000),
      legal_issue: c.legal_issue || null,
      legal_citation: c.legal_citation || null,
      statute_code: c.legal_citation || null,
      fair_alternative: c.fair_alternative ? sanitizeLLMInput(c.fair_alternative, 2000) : null,
      red_flags: c.red_flags || [],
      percentile: null,
      extracted_value: null,
      extracted_unit: null,
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
  },
);
