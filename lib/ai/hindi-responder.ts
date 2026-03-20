import { callGroq } from "@/lib/ai/groq-client";

const HINDI_SYSTEM_PROMPT = `You are ClauseWall's Hindi legal assistant for Indian contracts.

RULES:
1. Respond in conversational Hinglish (Hindi with English legal terms)
2. Use simple Hindi a common person would understand
3. Keep English legal terms as-is: deposit, notice, section, clause, illegal
4. Be direct — "Yeh ILLEGAL hai" not "Yeh shayad theek nahi hai"
5. Give specific law references in English
6. Always end with what to DO, not just what's wrong
7. Use 'tum' not 'aap' — keep it friendly and direct
8. Max 4-5 sentences when the response will be spoken aloud
9. If user speaks English, respond in English
10. If user mixes Hindi-English (Hinglish), respond in Hinglish

Respond in JSON: { "answer": "your response", "language": "hi|en|hinglish" }`;

export async function getHindiResponse(
  question: string,
  context: {
    documentType?: string;
    jurisdiction?: string;
    clauseText?: string;
    clauseType?: string;
    riskLevel?: string;
    explanation?: string;
    overallScore?: number;
    totalClauses?: number;
  },
  preferredLanguage: string = "hi"
): Promise<{ answer: string; language: string }> {
  try {
    const contextParts: string[] = [];

    if (context.documentType) contextParts.push(`Document: ${context.documentType}`);
    if (context.jurisdiction) contextParts.push(`State: ${context.jurisdiction}`);
    if (context.overallScore !== undefined) contextParts.push(`Risk Score: ${context.overallScore}/100`);
    if (context.totalClauses) contextParts.push(`Total Clauses: ${context.totalClauses}`);
    if (context.clauseText) contextParts.push(`Clause: "${context.clauseText.substring(0, 300)}"`);
    if (context.clauseType) contextParts.push(`Clause Type: ${context.clauseType}`);
    if (context.riskLevel) contextParts.push(`Risk: ${context.riskLevel}`);
    if (context.explanation) contextParts.push(`Analysis: ${context.explanation}`);

    const response = await callGroq(
      [
        { role: "system", content: HINDI_SYSTEM_PROMPT },
        {
          role: "user",
          content: `User's preferred language: ${preferredLanguage}
${contextParts.length > 0 ? `\nContract context:\n${contextParts.join("\n")}` : ""}

User's question: "${question}"

Respond in JSON.`,
        },
      ],
      { temperature: 0.4, maxTokens: 512 }
    );

    const parsed = JSON.parse(response);
    return {
      answer: String(parsed.answer || "Sorry, samajh nahi aaya. Phir se bolo."),
      language: String(parsed.language || preferredLanguage),
    };
  } catch (error) {
    console.error("[ClauseWall] [Voice] Hindi responder failed:", error);
    return {
      answer: "Maaf karo, abhi kuch problem ho gayi. Thodi der mein phir try karo.",
      language: "hinglish",
    };
  }
}