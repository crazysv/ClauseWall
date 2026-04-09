import { NextResponse } from "next/server";
import { withApiHandler } from "@/lib/api/with-api-handler";
import { RewriteSchema, type RewriteInput } from "@/lib/validation/schemas";
import { rewriteClause } from "@/lib/ai/clause-rewriter";
import { sanitizeLLMInput } from "@/lib/sanitize";

export const POST = withApiHandler<RewriteInput>(
  {
    module: "rewrite",
    rateLimit: "AI_MEDIUM",
    auth: true,
    schema: RewriteSchema,
  },
  async (ctx) => {
    const {
      clauseText,
      clauseType,
      jurisdiction,
      documentType,
      riskLevel,
      explanation,
      legalCitation,
      fairAlternative,
    } = ctx.body;

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
  },
);

