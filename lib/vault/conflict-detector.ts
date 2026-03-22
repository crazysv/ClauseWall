// ============================================
// CONFLICT DETECTOR — Cross-Contract Conflict Analysis
// Uses Groq AI to find conflicts between contracts
// ============================================

import { callGroq } from "@/lib/ai/groq-client";
import type { CrossContractConflict, ConflictType, ConflictSeverity } from "@/types";

// Conflict type labels for validation
const VALID_CONFLICT_TYPES: ConflictType[] = [
  "direct_contradiction", "obligation_overlap", "ip_conflict",
  "non_compete_clash", "exclusivity_violation", "jurisdiction_conflict",
  "confidentiality_breach", "time_commitment_impossible", "financial_conflict",
  "termination_cascade", "insurance_gap", "coverage_overlap", "other",
];

const VALID_SEVERITIES: ConflictSeverity[] = ["critical", "high", "medium", "low"];

// Clause types that commonly conflict across contracts
const CONFLICT_PRONE_CLAUSE_TYPES = [
  "ip_assignment", "intellectual_property", "non_compete", "exclusivity",
  "confidentiality", "nda", "termination", "liability", "indemnity",
  "insurance", "arbitration", "governing_law", "assignment",
  "change_of_control", "non_solicitation", "restriction",
];

const CROSS_CONTRACT_CONFLICT_PROMPT = `You are an Indian contract conflict analysis expert. You are given summaries of multiple contracts that the same person has signed. Your task is to find CONFLICTS, CONTRADICTIONS, and DANGEROUS INTERACTIONS between these contracts.

Types of conflicts to detect:

1. DIRECT CONTRADICTION — Two contracts require opposite things
   Example: Employment says 'all IP belongs to employer.' Freelance says 'all deliverables IP assigned to client.' Same person can't assign same IP twice.

2. OBLIGATION OVERLAP — Commitments that can't all be fulfilled simultaneously
   Example: Employment requires 'full-time dedication, 9AM-6PM Monday-Saturday.' Freelance requires '20 hours per week of availability.' Total exceeds possible hours.

3. NON-COMPETE CLASH — Non-compete in one contract conflicts with obligations in another
   Example: Employment non-compete covers 'software development in India for 18 months.' Freelance agreement is for software development. Signing freelance while employed may breach employment non-compete.

4. EXCLUSIVITY VIOLATION — Exclusivity clause in one contract violated by another
   Example: Vendor agreement has exclusivity clause for 'consulting services in fintech.' Another client agreement is also for fintech consulting.

5. CONFIDENTIALITY BREACH — Information flow between contracts creates breach risk
   Example: Working for two competing companies simultaneously. Information from Company A could inadvertently be used in work for Company B.

6. JURISDICTION CONFLICT — Different governing laws that create legal complexity
   Example: Employment governed by Karnataka law. Rental governed by Maharashtra law. If dispute involves both (relocation clause), which law applies?

7. INSURANCE/COVERAGE GAPS — Important coverages missing across all contracts
   Example: No dental coverage in any health plan. No professional liability coverage.

8. TERMINATION CASCADE — Terminating one contract triggers consequences in others
   Example: Quitting job → lose employer health insurance → rental agreement requires proof of income → may trigger rental termination clause.

9. FINANCIAL CONFLICT — Financial obligations that create unsustainable burden
   Example: Loan EMI + rent + insurance premiums exceed 70% of salary mentioned in employment contract.

10. TIME COMMITMENT IMPOSSIBLE — Total time commitments across contracts exceed available hours.

For each conflict found, provide:
- conflict_type: one of [direct_contradiction, obligation_overlap, ip_conflict, non_compete_clash, exclusivity_violation, jurisdiction_conflict, confidentiality_breach, time_commitment_impossible, financial_conflict, termination_cascade, insurance_gap, coverage_overlap, other]
- severity: critical/high/medium/low
- title: clear one-line title
- description: detailed explanation
- document_a_id, document_a_title, document_a_clause, document_a_clause_number
- document_b_id, document_b_title, document_b_clause, document_b_clause_number
- legal_implication: what could legally happen
- legal_citation: relevant Indian law (if applicable, null otherwise)
- resolution_suggestion: how to fix this
- financial_risk: rupee amount at risk (null if not quantifiable)
- affects_documents: array of all document IDs affected

Be THOROUGH but don't invent conflicts that don't exist. Only flag genuine conflicts supported by the clause text. Err on the side of flagging potential conflicts rather than missing real ones.

Respond in JSON: { "conflicts": [ ...array of conflict objects ] }`;

interface ContractInput {
  id: string;
  title: string;
  document_type: string;
  jurisdiction: string;
  entity_name: string | null;
  clauses: Array<{
    clause_number: number;
    original_text: string;
    clause_type: string;
    risk_level: string;
    legal_citation: string | null;
    extracted_value: number | null;
    extracted_unit: string | null;
  }>;
  power_balance: unknown | null;
  overall_risk_score: number;
}

/**
 * Build a compressed summary of a contract for the AI prompt.
 */
function buildContractSummary(doc: ContractInput, index: number): string {
  const lines: string[] = [];
  lines.push(`CONTRACT ${index + 1}: ${doc.title}`);
  lines.push(`Type: ${doc.document_type} | Entity: ${doc.entity_name || "Unknown"} | Jurisdiction: ${doc.jurisdiction}`);
  lines.push(`Risk Score: ${doc.overall_risk_score}/100`);

  // Filter to risky clauses and conflict-prone types
  const importantClauses = doc.clauses.filter(
    (c) =>
      c.risk_level !== "safe" ||
      CONFLICT_PRONE_CLAUSE_TYPES.some((ct) =>
        c.clause_type.toLowerCase().includes(ct)
      )
  );

  if (importantClauses.length > 0) {
    lines.push("Key clauses:");
    for (const c of importantClauses.slice(0, 15)) {
      const truncated = c.original_text.slice(0, 200);
      const value =
        c.extracted_value != null
          ? ` [Value: ${c.extracted_value} ${c.extracted_unit || ""}]`
          : "";
      lines.push(
        `  Clause ${c.clause_number} (${c.clause_type}, ${c.risk_level}${value}): ${truncated}`
      );
    }
  } else {
    lines.push("Key clauses: No risky or conflict-prone clauses found.");
  }

  return lines.join("\n");
}

/**
 * Detect cross-contract conflicts using Groq AI.
 */
export async function detectCrossContractConflicts(
  documents: ContractInput[]
): Promise<CrossContractConflict[]> {
  try {
    if (documents.length < 2) return [];

    // Build summaries for all documents
    const summaries = documents.map((doc, i) => buildContractSummary(doc, i));

    const userMessage = `I have ${documents.length} active contracts. Here are their summaries:\n\n${summaries.join("\n\n")}\n\nFind all conflicts, contradictions, and dangerous interactions between these contracts.`;

    const response = await callGroq(
      [
        { role: "system", content: CROSS_CONTRACT_CONFLICT_PROMPT },
        { role: "user", content: userMessage },
      ],
      {
        temperature: 0.1,
        maxTokens: 4096,
      }
    );

    const parsed = JSON.parse(response);
    const rawConflicts = Array.isArray(parsed.conflicts) ? parsed.conflicts : [];
    const validDocIds = new Set(documents.map((d) => d.id));
    const docTitleMap = new Map(documents.map((d) => [d.title, d.id]));
    const docIdTitleMap = new Map(documents.map((d) => [d.id, d.title]));

    const conflicts: CrossContractConflict[] = [];

    for (const raw of rawConflicts) {
      if (!raw.title || !raw.description) continue;

      // Try to match document IDs — AI may return titles instead
      let docAId = raw.document_a_id || "";
      let docBId = raw.document_b_id || "";

      if (!validDocIds.has(docAId) && raw.document_a_title) {
        docAId = docTitleMap.get(raw.document_a_title) || docAId;
      }
      if (!validDocIds.has(docBId) && raw.document_b_title) {
        docBId = docTitleMap.get(raw.document_b_title) || docBId;
      }

      // Fall back to first two documents if IDs still invalid
      if (!validDocIds.has(docAId) && documents.length >= 1) {
        docAId = documents[0].id;
      }
      if (!validDocIds.has(docBId) && documents.length >= 2) {
        docBId = documents[1].id;
      }

      const conflictType = VALID_CONFLICT_TYPES.includes(raw.conflict_type)
        ? raw.conflict_type
        : "other";

      const severity = VALID_SEVERITIES.includes(raw.severity)
        ? raw.severity
        : "medium";

      conflicts.push({
        id: crypto.randomUUID(),
        conflict_type: conflictType,
        severity,
        title: String(raw.title || "").slice(0, 200),
        description: String(raw.description || ""),
        document_a_id: docAId,
        document_a_title: String(raw.document_a_title || docIdTitleMap.get(docAId) || "Contract A"),
        document_a_clause: String(raw.document_a_clause || "").slice(0, 500),
        document_a_clause_number: Number(raw.document_a_clause_number) || 1,
        document_b_id: docBId,
        document_b_title: String(raw.document_b_title || docIdTitleMap.get(docBId) || "Contract B"),
        document_b_clause: String(raw.document_b_clause || "").slice(0, 500),
        document_b_clause_number: Number(raw.document_b_clause_number) || 1,
        legal_implication: String(raw.legal_implication || ""),
        legal_citation: raw.legal_citation ? String(raw.legal_citation) : null,
        resolution_suggestion: String(raw.resolution_suggestion || ""),
        financial_risk: raw.financial_risk != null ? Number(raw.financial_risk) : null,
        affects_documents: Array.isArray(raw.affects_documents)
          ? raw.affects_documents.filter((id: string) => validDocIds.has(id))
          : [docAId, docBId].filter(Boolean),
      });
    }

    // If too many conflicts, prioritize by severity
    if (conflicts.length > 20) {
      return conflicts
        .filter((c) => c.severity !== "low")
        .sort((a, b) => {
          const order: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };
          return (order[a.severity] ?? 4) - (order[b.severity] ?? 4);
        });
    }

    // Sort by severity
    return conflicts.sort((a, b) => {
      const order: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };
      return (order[a.severity] ?? 4) - (order[b.severity] ?? 4);
    });
  } catch (error) {
    console.error("[Vault] Conflict detection failed:", error);
    return [];
  }
}
