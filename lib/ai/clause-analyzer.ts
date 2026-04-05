// ============================================
// CLAUSE ANALYZER
// Analyzes individual clauses for risk using AI
// ============================================

import { callGroq } from "./groq-client";
import { CLAUSE_ANALYSIS_SYSTEM_PROMPT } from "./system-prompt";
import type { AnalysisResult, RiskLevel } from "@/types";
import type { SupportedLanguage } from "@/types/bhasha";
import { getMultilingualAnalysisPrompt } from "@/lib/bhasha/multilingual-prompts";
import { safeParseJson, safeString, safeInt, safeEnum, safeStringArray, safeStringOrNull } from "./output-guards";

const VALID_RISK_LEVELS = ["safe", "warning", "dangerous", "illegal"] as const;

/**
 * Analyze a single clause for predatory/illegal content
 */
export async function analyzeClause(
  clauseText: string,
  jurisdiction: string,
  documentType: string,
  clauseType: string,
  sourceLanguage?: SupportedLanguage,
  outputLanguage?: SupportedLanguage
): Promise<AnalysisResult> {
  try {
    // Use multilingual prompt when source or output is non-English
    const isMultilingual = (sourceLanguage && sourceLanguage !== "en") ||
      (outputLanguage && outputLanguage !== "en");
    const systemPrompt = isMultilingual
      ? getMultilingualAnalysisPrompt(
          sourceLanguage || "en",
          outputLanguage || "en"
        )
      : CLAUSE_ANALYSIS_SYSTEM_PROMPT;

    const response = await callGroq([
      {
        role: "system",
        content: systemPrompt,
      },
      {
  role: "user",
  content: `Analyze this clause from a ${documentType} agreement in ${jurisdiction} (India) and respond in JSON format:

Clause type: ${clauseType}

Clause text:
"${clauseText}"`,
},
    ]);

    const parsed = safeParseJson(response);
    if (!parsed) {
      throw new Error("Failed to parse clause analysis response");
    }

    // Build validated result with guards
    const result: AnalysisResult = {
      risk_level: safeEnum(parsed.risk_level, VALID_RISK_LEVELS, "warning"),
      risk_score: safeInt(parsed.risk_score, 50, 0, 100),
      explanation: safeString(parsed.explanation, "Unable to analyze this clause fully."),
      legal_issue: safeStringOrNull(parsed.legal_issue),
      applicable_law: safeStringOrNull(parsed.applicable_law),
      fair_alternative: safeStringOrNull(parsed.fair_alternative),
      red_flags: safeStringArray(parsed.red_flags),
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