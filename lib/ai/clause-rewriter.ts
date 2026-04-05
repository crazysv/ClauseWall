// ============================================
// CLAUSE REWRITE ENGINE
// Rewrites predatory/illegal clauses into fair,
// legally compliant versions under Indian law
// ============================================

import { callGroq } from "@/lib/ai/groq-client";
import type { RewriteResult, RewriteChange } from "@/types";
import { safeParseJson, safeString, safeEnum, safeArray, safeStringOrNull } from "./output-guards";

// ============================================
// SYSTEM PROMPT
// ============================================

const CLAUSE_REWRITE_SYSTEM_PROMPT = `You are ClauseWall's Clause Rewrite Engine. You rewrite predatory, unfair, or illegal contract clauses into fair, balanced, and legally compliant versions under Indian law.

You MUST preserve the legal intent and structure of the original clause while removing everything that is unfair, illegal, or one-sided.

REWRITING PRINCIPLES:

1. PRESERVE the purpose of the clause (e.g., security deposit clause stays a security deposit clause)
2. FIX the problematic parts (e.g., 10 months → 2 months for residential deposit)
3. ADD missing protections (e.g., refund timeline, itemized deductions, mutual obligations)
4. MAINTAIN formal legal language that matches Indian contract drafting style
5. Make it BALANCED — obligations and rights should apply to both parties where possible
6. Reference specific Indian law limits where applicable

REWRITING RULES BY CATEGORY:

Security Deposit (Rental):
- Residential: Max 2 months (Model Tenancy Act, 2021)
- Commercial: Max 6 months
- Must include refund timeline (30 days standard)
- Deductions only for damages beyond normal wear and tear
- Itemized receipts required for any deductions
- No full forfeiture clauses

Lock-in Period:
- Must be mutual (both parties bound equally)
- Reasonable duration (3-6 months for rental)
- No deposit forfeiture for early exit — only proportional compensation

Termination / Notice:
- Must be mutual (both parties can terminate)
- Reasonable notice period (1-2 months)
- Clear process for notice delivery

Rent Escalation:
- Max 5-8% per annum (reasonable)
- Annual escalation only, not arbitrary
- Must specify exact percentage

Non-Compete (Employment):
- Section 27, Indian Contract Act makes post-employment non-compete void
- During employment: reasonable scope, geography, duration
- Remove any post-employment non-compete entirely

Penalty Clauses:
- Section 74, Indian Contract Act — only reasonable compensation
- Remove punitive/excessive penalties
- Add proportionality

Late Fees:
- Must be reasonable (1-2% per month max)
- Grace period (7-15 days)
- Cannot compound

Dispute Resolution:
- Jurisdiction should be where property/workplace is located
- Mediation before arbitration before litigation
- Both parties bear own costs initially

Data/Privacy (ToS):
- Specific purpose for data collection
- Opt-out rights
- Data deletion on request
- No blanket sharing consent

RESPOND ONLY IN THIS EXACT JSON FORMAT — no markdown:
{
  "rewritten_clause": "<the complete rewritten clause text — formal legal language, ready to use>",
  "changes": [
    {
      "label": "<short 3-6 word description of the change>",
      "original": "<what the original clause said (brief excerpt)>",
      "rewritten": "<what the rewritten version says (brief excerpt)>",
      "legal_basis": "<Indian law reference for this change, or null if general fairness>"
    }
  ],
  "total_changes": <number>,
  "legal_compliance_note": "<1-2 sentences about how the rewritten clause now complies with Indian law>",
  "tone": "formal"
}

RULES:
1. The rewritten clause MUST be a complete, standalone clause ready for copy-paste.
2. Use formal Indian legal contract language ("The Licensee shall...", "Notwithstanding...", etc.)
3. Each change must have a clear label explaining what was fixed.
4. Changes should be ordered from most important to least important.
5. Include at least 2 changes for any clause scoring above 50.
6. legal_basis should cite specific Indian statutes where applicable.
7. The rewritten clause should be roughly similar in length to the original (not drastically shorter or longer).
8. If the clause is about deposit, always include refund timeline and deduction conditions.
9. If the clause is about termination, always make it mutual.
10. If the clause is about penalties, always cap at reasonable compensation (Section 74).
11. Never add clauses about topics not in the original — only fix what's there.
12. The rewritten clause should pass ClauseWall's own analysis as "safe" (score < 20).`;

// ============================================
// MAIN REWRITE FUNCTION
// ============================================

export async function rewriteClause(
  originalText: string,
  clauseType: string,
  jurisdiction: string,
  documentType: string,
  riskLevel: string,
  explanation: string | null,
  legalCitation: string | null,
  fairAlternative: string | null
): Promise<RewriteResult> {
  const contextParts: string[] = [
    `Rewrite this ${clauseType.replace(/_/g, " ")} clause from a ${documentType} agreement in ${jurisdiction}, India.`,
    "",
    `Current risk level: ${riskLevel.toUpperCase()}`,
  ];

  if (explanation) {
    contextParts.push(`Analysis: ${explanation}`);
  }
  if (legalCitation) {
    contextParts.push(`Violated law: ${legalCitation}`);
  }
  if (fairAlternative) {
    contextParts.push(`Suggested fair version (summary): ${fairAlternative}`);
  }

  contextParts.push("");
  contextParts.push(`ORIGINAL CLAUSE:`);
  contextParts.push(`"${originalText}"`);
  contextParts.push("");
  contextParts.push(
    `Rewrite this clause to be fair, balanced, and legally compliant under Indian law. Preserve the intent but remove all predatory elements.`
  );

  const response = await callGroq(
    [
      { role: "system", content: CLAUSE_REWRITE_SYSTEM_PROMPT },
      { role: "user", content: contextParts.join("\n") },
    ],
    {
      temperature: 0.3,
      maxTokens: 2048,
    }
  );

  let parsed: Record<string, unknown>;
  try {
    const raw = safeParseJson(response);
    if (!raw) {
      throw new Error("Failed to parse rewrite response");
    }
    parsed = raw;
  } catch (parseError) {
    console.error("[ClauseWall] Clause rewrite JSON parse failed:", parseError);
    return {
      rewritten_clause: "Unable to generate rewrite. Please try again.",
      changes: [],
      total_changes: 0,
      legal_compliance_note: "The rewrite could not be completed due to a processing error.",
      tone: "formal",
    };
  }

  // Validate changes array with per-item guards
  const validatedChanges: RewriteChange[] = safeArray(parsed.changes)
    .map((c: unknown) => {
      const item = c as Record<string, unknown> | null;
      if (!item) return null;
      return {
        label: safeString(item.label, "Clause updated", 200),
        original: safeString(item.original, ""),
        rewritten: safeString(item.rewritten, ""),
        legal_basis: safeStringOrNull(item.legal_basis, 200),
      };
    })
    .filter((c): c is RewriteChange => c !== null);

  const VALID_TONES = ["formal", "friendly", "assertive"] as const;

  const result: RewriteResult = {
    rewritten_clause: safeString(
      parsed.rewritten_clause,
      "Unable to generate rewrite. Please try again."
    ),
    changes: validatedChanges,
    total_changes: validatedChanges.length,
    legal_compliance_note: safeString(
      parsed.legal_compliance_note,
      "The rewritten clause aims to comply with applicable Indian law."
    ),
    tone: safeEnum(parsed.tone, VALID_TONES, "formal"),
  };

  return result;
}