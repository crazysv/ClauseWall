// ============================================
// CLAUSE ANALYZER
// Analyzes individual clauses for risk using AI
// ============================================

import { callGroq } from "./groq-client";
import { CLAUSE_ANALYSIS_SYSTEM_PROMPT } from "./system-prompt";
import type { AnalysisResult, RiskLevel } from "@/types";

/**
 * Analyze a single clause for predatory/illegal content
 */
export async function analyzeClause(
  clauseText: string,
  jurisdiction: string,
  documentType: string,
  clauseType: string
): Promise<AnalysisResult> {
  try {
    const response = await callGroq([
      {
        role: "system",
        content: CLAUSE_ANALYSIS_SYSTEM_PROMPT,
      },
      {
  role: "user",
  content: `Analyze this clause from a ${documentType} agreement in ${jurisdiction} (India) and respond in JSON format:

Clause type: ${clauseType}

Clause text:
"${clauseText}"`,
},
    ]);

    const parsed = JSON.parse(response);

    // Validate risk level
    const validRiskLevels: RiskLevel[] = [
      "safe",
      "warning",
      "dangerous",
      "illegal",
    ];

    // Build validated result
    const result: AnalysisResult = {
      risk_level: validRiskLevels.includes(parsed.risk_level)
        ? parsed.risk_level
        : "warning",
      risk_score: Math.min(
        100,
        Math.max(0, parseInt(parsed.risk_score) || 50)
      ),
      explanation:
        parsed.explanation || "Unable to analyze this clause fully.",
      legal_issue: parsed.legal_issue || null,
      applicable_law: parsed.applicable_law || null,
      fair_alternative: parsed.fair_alternative || null,
      red_flags: Array.isArray(parsed.red_flags)
        ? parsed.red_flags
        : [],
    };

    // Ensure risk_level matches risk_score for consistency
    if (result.risk_score <= 20) result.risk_level = "safe";
    else if (result.risk_score <= 50) result.risk_level = "warning";
    else if (result.risk_score <= 80) result.risk_level = "dangerous";
    else result.risk_level = "illegal";

    return result;
  } catch (error) {
    console.error("[ClauseWall] Clause analysis failed:", error);

    // Return a safe fallback instead of crashing the whole analysis
    return {
      risk_level: "warning",
      risk_score: 50,
      explanation:
        "This clause could not be fully analyzed due to a processing error. Manual review is recommended.",
      legal_issue: null,
      applicable_law: null,
      fair_alternative: null,
      red_flags: ["Automated analysis incomplete — review manually"],
    };
  }
}