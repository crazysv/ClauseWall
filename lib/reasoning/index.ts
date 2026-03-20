// ============================================
// NEUROSYMBOLIC REASONING ENGINE — BARREL EXPORT
// Main entry point: runNeurosymbolicAnalysis()
// ============================================

import type { ExtractedValues } from "@/types";
import type { ProofTree } from "./types";
import { KnowledgeBase } from "./engine";
import { compileRulesFromDB } from "./rule-compiler";
import { extractedValuesToFacts } from "./fact-bridge";
import { formatDerivationChain } from "./proof-formatter";

// Re-export all types and modules
export * from "./types";
export { KnowledgeBase } from "./engine";
export { compileRules, compileRulesFromDB } from "./rule-compiler";
export { extractedValuesToFacts, inferPredicate } from "./fact-bridge";
export {
  formatDerivationChain,
  formatELI5,
  formatProfessional,
  calculateOverallConfidence,
  getProofSummary,
} from "./proof-formatter";

// ============================================
// MAIN ENTRY POINT
// ============================================

/**
 * Run neurosymbolic analysis on a clause.
 *
 * This is the main function that orchestrates the entire reasoning pipeline:
 * 1. Convert extracted values → facts
 * 2. Compile DB rules → logical rules
 * 3. Run forward chaining inference
 * 4. Build proof tree
 *
 * Returns a ProofTree if a formal proof was constructed, or null if:
 * - No extracted values were available
 * - No matching rules exist for this jurisdiction/document type
 * - No violations were found (clause is clean)
 * - An error occurred (graceful degradation)
 *
 * NEVER throws — always returns null on failure.
 */
export async function runNeurosymbolicAnalysis(
  clauseText: string,
  extractedValues: ExtractedValues | null,
  jurisdiction: string,
  documentType: string,
  clauseType?: string,
  clauseIndex?: number
): Promise<ProofTree | null> {
  try {
    // 1. Check if we have anything to reason about
    if (!extractedValues) {
      console.log("[Reasoning] No extracted values — skipping formal reasoning");
      return null;
    }

    // 2. Create facts from extracted values
    const facts = extractedValuesToFacts(
      extractedValues,
      jurisdiction,
      documentType,
      clauseText,
      clauseIndex
    );

    if (facts.length === 0) {
      console.log("[Reasoning] No facts created — skipping formal reasoning");
      return null;
    }

    // 3. Compile rules from database
    const rules = await compileRulesFromDB(jurisdiction, documentType);

    if (rules.length === 0) {
      console.log(
        `[Reasoning] No compiled rules for ${jurisdiction}/${documentType} — skipping formal reasoning`
      );
      return null;
    }

    // 4. Filter rules to only those relevant to this clause type
    const relevantRules = clauseType
      ? rules.filter(
          (r) =>
            r.clauseType === clauseType ||
            r.clauseType === "all" ||
            r.clauseType === "*"
        )
      : rules;

    if (relevantRules.length === 0) {
      console.log(
        `[Reasoning] No rules match clause type '${clauseType}' — skipping formal reasoning`
      );
      return null;
    }

    // 5. Set up knowledge base
    const kb = new KnowledgeBase();
    for (const fact of facts) {
      kb.assertFact(fact);
    }
    kb.loadRules(relevantRules);

    // 6. Run forward chaining
    const result = kb.forwardChain();

    // 7. Return proof tree if violations were found
    if (result.proofTree) {
      // Attach clause text and derivation chain
      result.proofTree.clauseText = clauseText;
      result.proofTree.derivationChain = formatDerivationChain(result.proofTree);

      console.log(
        `[Reasoning] ⚖️ Formal proof constructed: ${result.proofTree.verdict} ` +
          `(${result.proofTree.totalSteps} steps, ` +
          `${result.violations.length} violations, ` +
          `confidence: ${Math.round(result.proofTree.confidence * 100)}%)`
      );

      return result.proofTree;
    }

    // No violations found — clause is clean by formal reasoning
    console.log(
      `[Reasoning] No violations found by formal reasoning ` +
        `(checked ${result.totalRulesChecked} rules, ` +
        `${result.unmatchedRules.length} unmatched due to missing facts)`
    );

    return null;
  } catch (error) {
    // NEVER throw — graceful degradation
    console.error("[Reasoning] Neurosymbolic analysis failed (non-fatal):", error);
    return null;
  }
}
