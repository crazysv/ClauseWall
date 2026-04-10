// ============================================
// HYBRID ANALYZER
// Orchestrates DB-first analysis with AI fallback
//
// Flow:
// 1. Extract structured values from clause (lightweight AI)
// 2. Check structured_rules DB for matching rules
// 3. If match + violation → Use DB data (VERIFIED)
// 4. If match + no violation → Safe (VERIFIED)
// 5. If no match → Fall back to full AI analysis (AI-SUGGESTED)
// ============================================

import { extractValues } from "@/lib/ai/value-extractor";
import { analyzeClause } from "@/lib/ai/clause-analyzer";
import { matchAgainstRules } from "@/lib/core/rule-engine";
import { safeParseJson, safeString, safeInt, safeEnum, safeStringOrNull, safeStringArray } from "@/lib/ai/output-guards";
import { callGroq } from "@/lib/ai/groq-client";
import { runNeurosymbolicAnalysis } from "@/lib/reasoning";
import { log } from "@/lib/logger";
import type { HybridAnalysisResult } from "@/types";
import { VALID_RISK_LEVELS } from "@/types";
import type { ProofTree } from "@/lib/reasoning/types";

/**
 * Generate a plain-English explanation using AI
 * Only called for DB-verified results to add readable explanation
 */
async function generateExplanation(
  clauseText: string,
  violationDescription: string,
  statuteCode: string,
  severity: string
): Promise<string> {
  const MAX_EXPLANATION_LENGTH = 1000;
  try {
    const response = await callGroq(
      [
        {
          role: "system",
          content: `You write clear, simple explanations of legal clause violations for Indian contract users. 
Keep it under 3 sentences. Use plain English/Hinglish that anyone can understand. 
Don't repeat the statute code — it will be shown separately.
Respond in JSON: { "explanation": "your explanation here" }`,
        },
        {
          role: "user",
          content: `Write a simple explanation for this violation:

Clause: "${clauseText.substring(0, 300)}"
Violation: ${violationDescription}
Law: ${statuteCode}
Severity: ${severity}`,
        },
      ],
      {
        temperature: 0.3,
        maxTokens: 256,
      }
    );

    const parsed = safeParseJson(response);
    const explanation = safeString(parsed?.explanation, violationDescription, MAX_EXPLANATION_LENGTH);
    return explanation;
  } catch {
    // If explanation generation fails, use the template
    return violationDescription.substring(0, MAX_EXPLANATION_LENGTH);
  }
}

/**
 * MAIN HYBRID ANALYSIS FUNCTION
 * This replaces the direct call to analyzeClause() in the pipeline
 */
export async function hybridAnalyzeClause(
  clauseText: string,
  jurisdiction: string,
  documentType: string,
  clauseType: string
): Promise<HybridAnalysisResult> {
  try {
    // ---- STEP 1: Extract structured values (lightweight AI call) ----
    log.info("hybrid", "Extracting values", { clauseType });
    const values = await extractValues(clauseText, clauseType, documentType);

    log.debug("hybrid", "Values extracted", { hasValues: !!values, clauseType: values.clause_type });

    // Use the AI-refined clause type (might be more accurate)
    const refinedClauseType = values.clause_type || clauseType;

    // ---- STEP 2: Check against structured rules DB ----
    log.info("hybrid", "Checking DB rules", { clauseType: refinedClauseType });
    const ruleResult = await matchAgainstRules(values, jurisdiction, documentType);

    // ---- STEP 3A: DB match found with violation → VERIFIED result ----
    if (ruleResult.matched && ruleResult.violation && ruleResult.rule) {
      log.info("hybrid", "DB match found with violation", {
        clauseType: refinedClauseType,
        severity: ruleResult.severity,
        riskScore: ruleResult.risk_score,
      });

      // Generate a readable explanation using AI (but citations come from DB)
      const explanation = await generateExplanation(
        clauseText,
        ruleResult.violation_description || "",
        ruleResult.statute_code || "",
        ruleResult.severity
      );

      // Build red flags
      const redFlags: string[] = [];
      if (ruleResult.violation_description) {
        redFlags.push(ruleResult.violation_description);
      }
      if (values.has_forfeiture) {
        redFlags.push("Contains complete forfeiture clause");
      }
      if (values.is_one_sided) {
        redFlags.push("Clause is one-sided, favoring " + (values.favors_party || "one party"));
      }
      if (values.has_penalty) {
        redFlags.push("Contains financial penalty clause");
      }

      // ---- NEUROSYMBOLIC REASONING: Formal proof tree ----
      let proofTree: ProofTree | null = null;
      try {
        proofTree = await runNeurosymbolicAnalysis(
          clauseText, values, jurisdiction, documentType, refinedClauseType
        );
      } catch (reasoningErr) {
        log.warn("hybrid", "Reasoning error (non-fatal, DB path)");
      }

      return {
        risk_level: ruleResult.severity,
        risk_score: ruleResult.risk_score,
        explanation,
        legal_issue: ruleResult.violation_description || null,
        applicable_law: ruleResult.statute_code || null,
        fair_alternative: ruleResult.fair_alternative || null,
        red_flags: redFlags,
        verification_source: "database",
        confidence: "verified",
        matched_rule_id: ruleResult.rule.id,
        negotiation_script: ruleResult.negotiation_script || null,
        penalty_info: ruleResult.penalty || null,
        extracted_value: values.primary_value ?? null,
        extracted_unit: values.primary_unit ?? null,
        proof_tree: proofTree,
      };
    }

    // ---- STEP 3B: DB match found, no violation → SAFE (VERIFIED) ----
    if (ruleResult.matched && !ruleResult.violation) {
      log.info("hybrid", "DB match: compliant", { clauseType: refinedClauseType });

      return {
        risk_level: "safe",
        risk_score: 10,
        explanation:
          "This clause appears to comply with applicable Indian law. The terms are within legal limits.",
        legal_issue: null,
        applicable_law: ruleResult.statute_code || null,
        fair_alternative: null,
        red_flags: [],
        verification_source: "database",
        confidence: "verified",
        matched_rule_id: ruleResult.rule?.id || null,
        negotiation_script: null,
        penalty_info: null,
        extracted_value: values.primary_value ?? null,
        extracted_unit: values.primary_unit ?? null,
        proof_tree: null,
      };
    }

    // ---- STEP 3C: No DB match → Fall back to AI analysis ----
    log.info("hybrid", "No DB match, using AI", { clauseType: refinedClauseType });

    const aiResult = await analyzeClause(
      clauseText,
      jurisdiction,
      documentType,
      refinedClauseType
    );

    // ---- NEUROSYMBOLIC REASONING for AI path (may still find formal violations) ----
    let aiProofTree: ProofTree | null = null;
    try {
      aiProofTree = await runNeurosymbolicAnalysis(
        clauseText, values, jurisdiction, documentType, refinedClauseType
      );
    } catch (reasoningErr) {
      log.warn("hybrid", "Reasoning error (non-fatal, AI path)");
    }

    // ---- Re-validate AI output before trusting it ----

    const validatedRiskLevel = safeEnum(aiResult.risk_level, VALID_RISK_LEVELS, "warning");
    const validatedRiskScore = safeInt(aiResult.risk_score, 50, 0, 100);

    return {
      risk_level: validatedRiskLevel,
      risk_score: validatedRiskScore,
      explanation: safeString(aiResult.explanation, "Unable to analyze this clause fully.", 2000),
      legal_issue: safeStringOrNull(aiResult.legal_issue, 500) || null,
      applicable_law: safeStringOrNull(aiResult.applicable_law, 500) || null,
      fair_alternative: safeStringOrNull(aiResult.fair_alternative, 2000) || null,
      red_flags: safeStringArray(aiResult.red_flags, 20),
      verification_source: "ai",
      confidence: "ai_suggested",
      matched_rule_id: null,
      negotiation_script: null,
      penalty_info: null,
      extracted_value: values.primary_value ?? null,
      extracted_unit: values.primary_unit ?? null,
      proof_tree: aiProofTree,
    };
  } catch (error) {
    log.errorWithCause("hybrid", "Hybrid analysis failed, falling back to AI", error);

    // Ultimate fallback — pure AI analysis
    try {
      const aiResult = await analyzeClause(
        clauseText,
        jurisdiction,
        documentType,
        clauseType
      );

      // Re-validate AI output even in the fallback path

      return {
        risk_level: safeEnum(aiResult.risk_level, VALID_RISK_LEVELS, "warning"),
        risk_score: safeInt(aiResult.risk_score, 50, 0, 100),
        explanation: safeString(aiResult.explanation, "Unable to analyze this clause fully.", 2000),
        legal_issue: safeStringOrNull(aiResult.legal_issue, 500) || null,
        applicable_law: safeStringOrNull(aiResult.applicable_law, 500) || null,
        fair_alternative: safeStringOrNull(aiResult.fair_alternative, 2000) || null,
        red_flags: safeStringArray(aiResult.red_flags, 20),
        verification_source: "ai",
        confidence: "ai_suggested",
        matched_rule_id: null,
        negotiation_script: null,
        penalty_info: null,
        extracted_value: null,
        extracted_unit: null,
      };
    } catch (fallbackError) {
      log.errorWithCause("hybrid", "Complete analysis failure", fallbackError);

      return {
        risk_level: "warning",
        risk_score: 50,
        explanation: "This clause could not be fully analyzed. Manual review recommended.",
        legal_issue: null,
        applicable_law: null,
        fair_alternative: null,
        red_flags: ["Automated analysis incomplete — review manually"],
        verification_source: "ai",
        confidence: "ai_suggested",
        matched_rule_id: null,
        negotiation_script: null,
        penalty_info: null,
        extracted_value: null,
        extracted_unit: null,
      };
    }
  }
}