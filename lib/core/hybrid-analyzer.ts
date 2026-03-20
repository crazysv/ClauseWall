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
import { callGroq } from "@/lib/ai/groq-client";
import { runNeurosymbolicAnalysis } from "@/lib/reasoning";
import type { HybridAnalysisResult } from "@/types";
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

    const parsed = JSON.parse(response);
    return parsed.explanation || violationDescription;
  } catch {
    // If explanation generation fails, use the template
    return violationDescription;
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
    console.log(`[ClauseWall] [Hybrid] Extracting values for: ${clauseType}`);
    const values = await extractValues(clauseText, clauseType, documentType);

    console.log("[ClauseWall] Extracted values:", values);

    // Use the AI-refined clause type (might be more accurate)
    const refinedClauseType = values.clause_type || clauseType;

    // ---- STEP 2: Check against structured rules DB ----
    console.log(`[ClauseWall] [Hybrid] Checking DB rules for: ${refinedClauseType}`);
    const ruleResult = await matchAgainstRules(values, jurisdiction, documentType);

    // ---- STEP 3A: DB match found with violation → VERIFIED result ----
    if (ruleResult.matched && ruleResult.violation && ruleResult.rule) {
      console.log(
        `[ClauseWall] [Hybrid] ⚖️ DB MATCH: ${refinedClauseType} → ${ruleResult.severity} (${ruleResult.risk_score}/100)`
      );

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
        console.error("[ClauseWall] [Reasoning] Non-fatal error:", reasoningErr);
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
      console.log(
        `[ClauseWall] [Hybrid] ✅ DB MATCH (compliant): ${refinedClauseType}`
      );

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
    console.log(
      `[ClauseWall] [Hybrid] 🤖 No DB match for: ${refinedClauseType} → using AI`
    );

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
      console.error("[ClauseWall] [Reasoning] Non-fatal error (AI path):", reasoningErr);
    }

    return {
      risk_level: aiResult.risk_level,
      risk_score: aiResult.risk_score,
      explanation: aiResult.explanation,
      legal_issue: aiResult.legal_issue || null,
      applicable_law: aiResult.applicable_law || null,
      fair_alternative: aiResult.fair_alternative || null,
      red_flags: aiResult.red_flags,
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
    console.error("[ClauseWall] Hybrid analysis failed, falling back to AI:", error);

    // Ultimate fallback — pure AI analysis
    try {
      const aiResult = await analyzeClause(
        clauseText,
        jurisdiction,
        documentType,
        clauseType
      );

      return {
        ...aiResult,
        legal_issue: aiResult.legal_issue || null,
        applicable_law: aiResult.applicable_law || null,
        fair_alternative: aiResult.fair_alternative || null,
        verification_source: "ai",
        confidence: "ai_suggested",
        matched_rule_id: null,
        negotiation_script: null,
        penalty_info: null,
        extracted_value: null,
        extracted_unit: null,
      };
    } catch (fallbackError) {
      console.error("[ClauseWall] Complete analysis failure:", fallbackError);

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