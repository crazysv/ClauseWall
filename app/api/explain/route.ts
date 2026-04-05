// ============================================
// ELI5 + HINDI EXPLANATION API
// Generates simple English + Hindi explanations
// ============================================

import { NextRequest, NextResponse } from "next/server";
import { callGroq } from "@/lib/ai/groq-client";
import { rateLimit, rateLimitResponse } from "@/lib/rate-limit";
import { sanitizeLLMInput } from "@/lib/sanitize";

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

export async function POST(request: NextRequest) {
  try {
    // ── Rate Limiting ──
    const rl = await rateLimit(request, "AI_MEDIUM");
    if (!rl.success) return rateLimitResponse(rl);

    const { clauseText, explanation, riskLevel, legalCitation, clauseType } =
      await request.json();

    if (!clauseText && !explanation) {
      return NextResponse.json(
        { error: "Clause text or explanation required" },
        { status: 400 },
      );
    }

    const userMessage = `Explain this legal clause issue:

Clause Type: ${clauseType || "unknown"}
Risk Level: ${riskLevel || "warning"}
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

    let parsed;
    try {
      parsed = JSON.parse(response);
    } catch {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("Invalid response format");
      parsed = JSON.parse(jsonMatch[0]);
    }

    return NextResponse.json({
      simple_english:
        parsed.simple_english || "Could not generate simple explanation.",
      hindi: parsed.hindi || "सरल व्याख्या उपलब्ध नहीं है।",
    });
  } catch (error) {
    console.error("[ClauseWall] Explain API error:", error);
    return NextResponse.json(
      { error: (error as Error).message || "Explanation failed" },
      { status: 500 },
    );
  }
}
