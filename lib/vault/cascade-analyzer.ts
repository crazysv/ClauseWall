// ============================================
// CASCADE ANALYZER — Cascading Failure Detection
// Uses Groq AI to find domino-effect failure chains
// ============================================

import { callGroq } from "@/lib/ai/groq-client";
import type { CascadingFailure, CascadeStep } from "@/types";

const CASCADE_ANALYSIS_PROMPT = `You are a financial risk cascade analyst specializing in Indian contracts. Given a person's active contracts, identify CASCADING FAILURE chains — scenarios where a problem in one contract triggers problems in others, creating a domino effect.

Common cascade patterns in India:

1. JOB LOSS CASCADE:
   Lose job → lose employer health insurance → can't pay rent (income proof required) → can't pay loan EMI → loan default → credit score drops → insurance premiums increase

2. LOAN DEFAULT CASCADE:
   Default on one loan → cross-default clause activates on other loans → all loans called in simultaneously → assets seized → insurance voided

3. RELOCATION CASCADE:
   Employer transfers to new city → rental agreement broken (penalty) → school enrollment penalties → vehicle loan jurisdiction issues

4. HEALTH CRISIS CASCADE:
   Major illness → can't work → sick leave exhausted → employment at risk → income stops → loan EMIs missed → insurance claim filed but has exclusions

5. PROPERTY ISSUE CASCADE:
   Property dispute → RERA complaint → builder delays → loan EMI continues → can't occupy → rental continues → double payment burden

For each cascade chain:
- trigger_event: what starts the cascade
- trigger_document_id: ID of the document where it starts
- trigger_document_title: title of that document
- chain: array of steps, each with:
  - step_number: integer
  - document_id: which contract
  - document_title: contract name
  - clause_reference: relevant clause text (truncated)
  - what_happens: what occurs at this step
  - financial_impact: rupee amount (null if unknown)
  - time_delay: "Immediate" or "Within X days"
  - can_be_prevented: boolean
  - prevention_action: what to do to stop it (null if can't be prevented)
- total_financial_impact: sum of all steps
- probability: likely/possible/unlikely
- prevention_steps: array of actionable steps to break the chain

Look for CROSS-DEFAULT clauses, CROSS-COLLATERAL clauses, MATERIAL ADVERSE CHANGE clauses, INCOME-LINKED clauses, INSURANCE-LINKED clauses.

Be realistic. Only flag cascades that are genuinely possible based on the contract clauses present.

Respond in JSON: { "cascading_failures": [ ...array of cascade objects ] }`;

interface CascadeInput {
  id: string;
  title: string;
  document_type: string;
  entity_name: string | null;
  clauses: Array<{
    clause_number: number;
    original_text: string;
    clause_type: string;
    risk_level: string;
    extracted_value: number | null;
    extracted_unit: string | null;
  }>;
}

/**
 * Analyze cascading failures across contracts using Groq AI.
 */
export async function analyzeCascadingFailures(
  documents: CascadeInput[]
): Promise<CascadingFailure[]> {
  try {
    if (documents.length < 2) return [];

    // Build document summaries focused on cascade-relevant clauses
    const summaries = documents.map((doc, i) => {
      const cascadeRelevant = doc.clauses.filter((c) => {
        const ct = c.clause_type.toLowerCase();
        return (
          ct.includes("termination") ||
          ct.includes("default") ||
          ct.includes("cross") ||
          ct.includes("insurance") ||
          ct.includes("income") ||
          ct.includes("collateral") ||
          ct.includes("penalty") ||
          ct.includes("breach") ||
          ct.includes("payment") ||
          ct.includes("deposit") ||
          ct.includes("notice") ||
          c.risk_level !== "safe"
        );
      });

      const clauseSummary = cascadeRelevant
        .slice(0, 12)
        .map(
          (c) =>
            `  Clause ${c.clause_number} (${c.clause_type}, ${c.risk_level}): ${c.original_text.slice(0, 200)}`
        )
        .join("\n");

      return `CONTRACT ${i + 1}: ${doc.title}
Type: ${doc.document_type} | Entity: ${doc.entity_name || "Unknown"}
Relevant clauses:
${clauseSummary || "  No cascade-relevant clauses identified."}`;
    });

    const userMessage = `I have ${documents.length} active contracts. Identify cascading failure chains:\n\n${summaries.join("\n\n")}`;

    const response = await callGroq(
      [
        { role: "system", content: CASCADE_ANALYSIS_PROMPT },
        { role: "user", content: userMessage },
      ],
      {
        temperature: 0.1,
        maxTokens: 4096,
      }
    );

    const parsed = JSON.parse(response);
    const rawCascades = Array.isArray(parsed.cascading_failures)
      ? parsed.cascading_failures
      : [];
    const validDocIds = new Set(documents.map((d) => d.id));
    const failures: CascadingFailure[] = [];

    for (const raw of rawCascades) {
      if (!raw.trigger_event) continue;

      const chain: CascadeStep[] = [];
      const rawChain = Array.isArray(raw.chain) ? raw.chain : [];

      for (let i = 0; i < rawChain.length; i++) {
        const step = rawChain[i];
        chain.push({
          step_number: i + 1,
          document_id: String(step.document_id || ""),
          document_title: String(step.document_title || ""),
          clause_reference: String(step.clause_reference || "").slice(0, 300),
          what_happens: String(step.what_happens || ""),
          financial_impact:
            step.financial_impact != null ? Number(step.financial_impact) : null,
          time_delay: String(step.time_delay || "Unknown"),
          can_be_prevented: Boolean(step.can_be_prevented),
          prevention_action: step.prevention_action
            ? String(step.prevention_action)
            : null,
        });
      }

      if (chain.length === 0) continue;

      const probability = ["likely", "possible", "unlikely"].includes(raw.probability)
        ? (raw.probability as "likely" | "possible" | "unlikely")
        : "possible";

      failures.push({
        id: crypto.randomUUID(),
        trigger_event: String(raw.trigger_event || ""),
        trigger_document_id: String(raw.trigger_document_id || ""),
        trigger_document_title: String(raw.trigger_document_title || ""),
        chain,
        total_financial_impact: Number(raw.total_financial_impact) || 0,
        probability,
        prevention_steps: Array.isArray(raw.prevention_steps)
          ? raw.prevention_steps.map(String)
          : [],
      });
    }

    // Sort by probability (likely first) then by total impact
    const probOrder: Record<string, number> = { likely: 0, possible: 1, unlikely: 2 };
    return failures.sort((a, b) => {
      const pa = probOrder[a.probability] ?? 3;
      const pb = probOrder[b.probability] ?? 3;
      if (pa !== pb) return pa - pb;
      return b.total_financial_impact - a.total_financial_impact;
    });
  } catch (error) {
    console.error("[Vault] Cascade analysis failed:", error);
    return [];
  }
}
