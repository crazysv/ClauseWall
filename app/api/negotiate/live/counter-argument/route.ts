// ============================================
// POST /api/negotiate/live/counter-argument
// Generate a counter-argument for a specific situation
// ============================================

import { NextRequest, NextResponse } from "next/server";
import { callGroq } from "@/lib/ai/groq-client";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { situation, context, jurisdiction, document_type, tone } = body;

    if (!situation || !jurisdiction || !document_type) {
      return NextResponse.json(
        { error: "Missing required fields: situation, jurisdiction, document_type" },
        { status: 400 }
      );
    }

    const validTones = ["polite", "firm", "assertive"];
    const effectiveTone = validTones.includes(tone) ? tone : "polite";

    const systemPrompt = `You are a negotiation coach for an Indian contract negotiation. Generate a counter-argument that is specific, actionable, and gives the person confidence to push back. Be concise — this is for LIVE use during a negotiation.

Respond in this EXACT JSON format:
{
  "counter_argument": "Exact words to say (2-3 sentences maximum)",
  "legal_basis": "Relevant Indian law citation if applicable, or null",
  "confidence_tip": "One-line tip to boost their confidence"
}`;

    const userPrompt = `The counterparty said or proposed: "${situation}"
${context ? `Context: ${context}` : ""}
Contract type: ${document_type}
Jurisdiction: ${jurisdiction}, India
Desired tone: ${effectiveTone}

Generate a ${effectiveTone} counter-argument that:
1. Is specific and actionable (exact words to say)
2. Cites relevant Indian law if applicable
3. Is SHORT — 2-3 sentences maximum
4. Gives the person confidence to push back`;

    const response = await callGroq(
      [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      {
        temperature: 0.3,
        maxTokens: 512,
        retries: 2,
      }
    );

    const parsed = JSON.parse(response);

    return NextResponse.json({
      counter_argument: parsed.counter_argument || "I'd like to discuss this point further before we proceed.",
      legal_basis: parsed.legal_basis || null,
      confidence_tip: parsed.confidence_tip || "Stay calm and focused on the facts.",
    });
  } catch (error: any) {
    console.error("[ClauseWall] Counter-argument API error:", error);
    return NextResponse.json(
      {
        counter_argument: "I appreciate your position, but I'd like to review this point more carefully before agreeing.",
        legal_basis: null,
        confidence_tip: "Take your time. You have the right to fully understand what you're signing.",
      },
      { status: 200 } // Return a usable fallback even on error
    );
  }
}
