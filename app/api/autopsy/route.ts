import { NextResponse } from "next/server";
import { withApiHandler } from "@/lib/api/with-api-handler";
import { AutopsySchema, type AutopsyInput } from "@/lib/validation/schemas";
import { callGroq } from "@/lib/ai/groq-client";
import { CLAUSE_AUTOPSY_PROMPT } from "@/lib/ai/system-prompt";
import { safeParseJson, safeString, safeEnum, safeArrayMap, safeStringOrNull } from "@/lib/ai/output-guards";

export const POST = withApiHandler<AutopsyInput>(
  {
    module: "autopsy",
    rateLimit: "AI_HEAVY",
    auth: true,
    schema: AutopsySchema,
  },
  async (ctx) => {
    const { clauseText, clauseType, jurisdiction, documentType, riskLevel } = ctx.body;

    const response = await callGroq([
      {
        role: "system",
        content: CLAUSE_AUTOPSY_PROMPT,
      },
      {
        role: "user",
        content: `Perform a word-level autopsy on this clause.

Document type: ${documentType}
Jurisdiction: ${jurisdiction}
Clause type: ${clauseType}
Current risk assessment: ${riskLevel}

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
  },
);

