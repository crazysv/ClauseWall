import { NextResponse } from "next/server";
import { withApiHandler } from "@/lib/api/with-api-handler";
import { AdversarialSchema, type AdversarialInput } from "@/lib/validation/schemas";
import { analyzeAdversarial } from "@/lib/ai/adversarial-analyzer";

export const POST = withApiHandler<AdversarialInput>(
  {
    module: "adversarial",
    rateLimit: "AI_HEAVY",
    rateLimitIdentifier: "user",
    auth: true,
    schema: AdversarialSchema,
  },
  async (ctx) => {
    const { clauseText, clauseType, jurisdiction, documentType } = ctx.body;

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
  },
);
