import { NextRequest, NextResponse } from "next/server";
import { callGroq } from "@/lib/ai/groq-client";
import { CLAUSE_AUTOPSY_PROMPT } from "@/lib/ai/system-prompt";
import { safeParseJson, safeString, safeEnum, safeArrayMap, safeStringOrNull } from "@/lib/ai/output-guards";

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

    // Parse AI response with safe guard
    const parsed = safeParseJson(response);
    if (!parsed) {
      console.error("[ClauseWall] Autopsy JSON parse failed. Raw:", response.substring(0, 200));
      return NextResponse.json(
        { error: "Failed to parse AI response" },
        { status: 500 },
      );
    }

    // Validate and sanitize
    const VALID_SEVERITIES = ["safe", "warning", "dangerous", "illegal"] as const;

    const violations = safeArrayMap(parsed.violations, (v) => {
      const item = v as Record<string, unknown> | null;
      if (!item) return null;
      const phrase = safeString(item.phrase, "").trim();
      if (phrase.length === 0) return null;
      return {
        phrase,
        severity: safeEnum(item.severity, VALID_SEVERITIES, "warning"),
        issue: safeString(item.issue, "Potential issue"),
        explanation: safeString(item.explanation, "Review recommended."),
        statute: safeStringOrNull(item.statute),
        penalty: safeStringOrNull(item.penalty),
      };
    });

    const result = {
      violations,
      total_violations: violations.length,
      most_severe: safeEnum(parsed.most_severe, VALID_SEVERITIES,
        violations.length > 0
          ? violations.reduce((worst: string, v: { severity: string }) => {
              const order = ["safe", "warning", "dangerous", "illegal"];
              return order.indexOf(v.severity) > order.indexOf(worst)
                ? v.severity
                : worst;
            }, "warning")
          : "safe",
      ),
      dissection_summary: safeString(
        parsed.dissection_summary, "Analysis complete.",
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
