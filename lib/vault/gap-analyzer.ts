// ============================================
// GAP ANALYZER — Coverage Gap Detection
// Uses Groq AI to find protection gaps across contracts
// ============================================

import { callGroq } from "@/lib/ai/groq-client";
import type { CoverageGap, GapCategory } from "@/types";

const VALID_CATEGORIES: GapCategory[] = [
  "health_insurance", "life_insurance", "disability", "dental", "vision",
  "accident", "liability", "legal_protection", "ip_protection",
  "termination_protection", "notice_period", "severance", "gratuity",
  "retirement", "maternity", "data_privacy", "dispute_resolution", "other",
];

const COVERAGE_GAP_PROMPT = `You are an Indian insurance and legal protection analyst. Given summaries of a person's active contracts, identify GAPS in their protection/coverage.

Check for:
1. Health insurance gaps (dental, vision, pre-existing conditions, maternity)
2. Life insurance adequacy
3. Disability protection
4. Professional liability / errors & omissions
5. Legal expense coverage
6. Notice period protection (what if fired without notice?)
7. Severance/gratuity coverage
8. Data privacy protection
9. IP protection
10. Dispute resolution coverage (who pays legal fees?)
11. Accident/personal injury coverage
12. Property damage coverage
13. Retirement/pension coverage

For each gap:
- category: one of [health_insurance, life_insurance, disability, dental, vision, accident, liability, legal_protection, ip_protection, termination_protection, notice_period, severance, gratuity, retirement, maternity, data_privacy, dispute_resolution, other]
- title: clear one-line description
- description: why this matters
- importance: essential/recommended/optional
- estimated_annual_risk: rupee estimated annual financial exposure (number or null if not quantifiable)
- contracts_checked: array of document IDs that were checked
- suggestion: specific actionable recommendation

Consider Indian-specific gaps:
- Gratuity (requires 5 years of continuous service under Payment of Gratuity Act)
- PF (employer contribution requirements)
- ESI coverage vs private health insurance gaps
- Professional tax implications
- TDS on rent implications

Only flag GENUINE gaps. Don't flag things that are irrelevant to the person's situation based on their contract types.

Respond in JSON: { "gaps": [ ...array of gap objects ] }`;

interface GapAnalysisInput {
  id: string;
  title: string;
  document_type: string;
  clauses: Array<{
    clause_type: string;
    original_text: string;
  }>;
}

/**
 * Analyze coverage gaps across all contracts using Groq AI.
 */
export async function analyzeCoverageGaps(
  documents: GapAnalysisInput[]
): Promise<CoverageGap[]> {
  try {
    if (documents.length === 0) return [];

    // Build summary for all documents
    const summaries = documents.map((doc, i) => {
      const clauseTypes = [...new Set(doc.clauses.map((c) => c.clause_type))];
      const clauseSummary = doc.clauses
        .slice(0, 10)
        .map((c) => `  - ${c.clause_type}: ${c.original_text.slice(0, 150)}`)
        .join("\n");

      return `CONTRACT ${i + 1}: ${doc.title} (${doc.document_type})
Clause types present: ${clauseTypes.join(", ")}
Key clauses:
${clauseSummary}`;
    });

    const userMessage = `I have ${documents.length} active contracts. Please identify coverage gaps:\n\n${summaries.join("\n\n")}`;

    const response = await callGroq(
      [
        { role: "system", content: COVERAGE_GAP_PROMPT },
        { role: "user", content: userMessage },
      ],
      {
        temperature: 0.1,
        maxTokens: 2048,
      }
    );

    const parsed = JSON.parse(response);
    const rawGaps = Array.isArray(parsed.gaps) ? parsed.gaps : [];
    const validDocIds = new Set(documents.map((d) => d.id));
    const gaps: CoverageGap[] = [];

    for (const raw of rawGaps) {
      if (!raw.title) continue;

      const category = VALID_CATEGORIES.includes(raw.category)
        ? raw.category
        : "other";

      const importance = ["essential", "recommended", "optional"].includes(raw.importance)
        ? (raw.importance as "essential" | "recommended" | "optional")
        : "recommended";

      gaps.push({
        id: crypto.randomUUID(),
        category,
        title: String(raw.title || "").slice(0, 200),
        description: String(raw.description || ""),
        importance,
        estimated_annual_risk:
          raw.estimated_annual_risk != null ? Number(raw.estimated_annual_risk) : null,
        contracts_checked: Array.isArray(raw.contracts_checked)
          ? raw.contracts_checked.filter((id: string) => validDocIds.has(id))
          : documents.map((d) => d.id),
        suggestion: String(raw.suggestion || ""),
      });
    }

    // Sort: essential first, then recommended, then optional
    const importanceOrder: Record<string, number> = {
      essential: 0,
      recommended: 1,
      optional: 2,
    };

    return gaps.sort(
      (a, b) =>
        (importanceOrder[a.importance] ?? 3) -
        (importanceOrder[b.importance] ?? 3)
    );
  } catch (error) {
    console.error("[Vault] Coverage gap analysis failed:", error);
    return [];
  }
}
