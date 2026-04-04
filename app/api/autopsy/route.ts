import { NextRequest, NextResponse } from "next/server";
import { callGroq } from "@/lib/ai/groq-client";
import { CLAUSE_AUTOPSY_PROMPT } from "@/lib/ai/system-prompt";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { clauseText, clauseType, jurisdiction, documentType, riskLevel } =
      body;

    if (!clauseText || !clauseType) {
      return NextResponse.json(
        { error: "Missing required fields: clauseText, clauseType" },
        { status: 400 },
      );
    }

    const response = await callGroq([
      {
        role: "system",
        content: CLAUSE_AUTOPSY_PROMPT,
      },
      {
        role: "user",
        content: `Perform a word-level autopsy on this clause.

Document type: ${documentType || "unknown"}
Jurisdiction: ${jurisdiction || "India"}
Clause type: ${clauseType}
Current risk assessment: ${riskLevel || "unknown"}

Clause text:
"${clauseText}"`,
      },
    ]);

    // Parse AI response
    let parsed;
    try {
      // Clean response — remove markdown code fences if present
      let cleaned = response.trim();
      if (cleaned.startsWith("```json")) {
        cleaned = cleaned.slice(7);
      }
      if (cleaned.startsWith("```")) {
        cleaned = cleaned.slice(3);
      }
      if (cleaned.endsWith("```")) {
        cleaned = cleaned.slice(0, -3);
      }
      parsed = JSON.parse(cleaned.trim());
    } catch {
      console.error("[ClauseWall] Autopsy JSON parse failed. Raw:", response);
      return NextResponse.json(
        { error: "Failed to parse AI response" },
        { status: 500 },
      );
    }

    // Validate and sanitize
    const validSeverities = ["safe", "warning", "dangerous", "illegal"];

    const violations = Array.isArray(parsed.violations)
      ? parsed.violations
          .filter(
            (v: Record<string, unknown>) =>
              v.phrase &&
              typeof v.phrase === "string" &&
              v.phrase.trim().length > 0,
          )
          .map((v: Record<string, unknown>) => ({
            phrase: String(v.phrase),
            severity: validSeverities.includes(v.severity as string)
              ? v.severity
              : "warning",
            issue: String(v.issue || "Potential issue"),
            explanation: String(v.explanation || "Review recommended."),
            statute: v.statute ? String(v.statute) : null,
            penalty: v.penalty ? String(v.penalty) : null,
          }))
      : [];

    const result = {
      violations,
      total_violations: violations.length,
      most_severe: validSeverities.includes(parsed.most_severe)
        ? parsed.most_severe
        : violations.length > 0
          ? violations.reduce((worst: string, v: { severity: string }) => {
              const order = ["safe", "warning", "dangerous", "illegal"];
              return order.indexOf(v.severity) > order.indexOf(worst)
                ? v.severity
                : worst;
            }, "warning")
          : "safe",
      dissection_summary: String(
        parsed.dissection_summary || "Analysis complete.",
      ),
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error("[ClauseWall] Autopsy API error:", error);
    return NextResponse.json(
      { error: "Autopsy analysis failed. Please try again." },
      { status: 500 },
    );
  }
}
