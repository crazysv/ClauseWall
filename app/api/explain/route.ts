// ============================================
// ELI5 + HINDI EXPLANATION API
// Generates simple English + Hindi explanations
// ============================================

import { NextResponse } from "next/server";
import { withApiHandler } from "@/lib/api/with-api-handler";
import { ExplainSchema, type ExplainInput } from "@/lib/validation/schemas";
import { callGroq } from "@/lib/ai/groq-client";
import { sanitizeLLMInput } from "@/lib/sanitize";
import { safeParseJson, safeString } from "@/lib/ai/output-guards";

export const maxDuration = 30;

const EXPLAIN_PROMPT = `You are ClauseWall's explanation assistant.

Your job is to explain a legal clause violation in TWO ways:

1. SIMPLE ENGLISH (ELI5 — Explain Like I'm 5):
   - Use everyday language, no legal jargon
   - Use analogies and examples from daily life
   - Keep it under 3-4 sentences
   - Speak directly to the user ("Your landlord is asking...")
   - Make the risk feel real and personal

2. HINDI (Hinglish — mix of Hindi + simple English legal terms):
   - Write in Devanagari script
   - Use common Hinglish that urban Indians speak
   - Keep legal terms in English (deposit, clause, illegal)
   - Keep it under 3-4 sentences
   - Speak directly to the user

RESPOND ONLY AS JSON:
{
  "simple_english": "<ELI5 explanation in simple English>",
  "hindi": "<explanation in Hindi/Hinglish using Devanagari script>"
}`;

export const POST = withApiHandler<ExplainInput>(
  {
    module: "explain",
    rateLimit: "AI_MEDIUM",
    auth: true,
    schema: ExplainSchema,
  },
  async (ctx) => {
    const { clauseText, explanation, riskLevel, legalCitation, clauseType } = ctx.body;

    const userMessage = `Explain this legal clause issue:

Clause Type: ${clauseType}
Risk Level: ${riskLevel}
${legalCitation ? `Law Reference: ${sanitizeLLMInput(String(legalCitation), 500)}` : ""}

Original Clause:
"${sanitizeLLMInput(clauseText || "", 500)}"

Legal Analysis:
"${sanitizeLLMInput(explanation || "", 500)}"

Generate a simple English (ELI5) and Hindi explanation.`;

    const response = await callGroq(
      [
        { role: "system", content: EXPLAIN_PROMPT },
        { role: "user", content: userMessage },
      ],
      { temperature: 0.3, maxTokens: 1024 },
    );

    const aiResponse = safeParseJson(response);
    if (!aiResponse) {
      throw new Error("Invalid response format");
    }

    return NextResponse.json({
      simple_english: safeString(aiResponse.simple_english, "Could not generate simple explanation."),
      hindi: safeString(aiResponse.hindi, "सरल व्याख्या उपलब्ध नहीं है।"),
    });
  },
);

