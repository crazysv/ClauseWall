// ============================================
// POWER BALANCE EXTRACTOR
// Analyzes power distribution between contract parties
// Single AI call after all clauses are analyzed
// ============================================

import { callGroq } from "@/lib/ai/groq-client";
import type { PowerBalance, PowerCategory } from "@/types";
import { safeParseJson, safeString, safeInt, safeArray, safeStringOrNull } from "./output-guards";

// ============================================
// SYSTEM PROMPT
// ============================================

const POWER_BALANCE_SYSTEM_PROMPT = `You are ClauseWall's Power Balance engine. You analyze the power distribution between two parties in an Indian contract.

Given all analyzed clauses with their risk levels and explanations, determine how power is distributed across exactly 5 categories.

THE 5 POWER CATEGORIES (use these exact keys):

1. "termination" — TERMINATION & EXIT
   Who can end the agreement? What are exit conditions? Is lock-in one-sided? What penalties exist for early exit?

2. "financial" — FINANCIAL BURDEN
   Who bears costs? Are deposits/fees/charges reasonable? Who benefits financially? Are escalations one-sided?

3. "penalties" — PENALTIES & CONSEQUENCES
   Who faces penalties? Are they proportional? Is forfeiture one-sided? Who has liability protection?

4. "dispute" — DISPUTE RESOLUTION
   Is there forced arbitration? Who chooses jurisdiction? Are legal rights waived? Who has advantage in disputes?

5. "control" — CONTROL & MODIFICATIONS
   Who can change terms? Who has unilateral rights? Who controls property/IP/assets? Who has more restrictions?

RULES:
1. Each category: party_a_percent + party_b_percent MUST equal 100.
2. 50/50 means perfectly balanced. Higher % = more power/advantage for that party.
3. party_a is ALWAYS the entity (landlord/employer/company/lender).
4. party_b is ALWAYS the user (tenant/employee/consumer/borrower).
5. overall_party_a should be the weighted average across all 5 categories.
6. overall_party_a + overall_party_b MUST equal 100.
7. Be specific in descriptions — reference actual clause numbers.
8. key_clause should reference the clause number(s) driving that imbalance.
9. If a category has no relevant clauses, default to 50/50 and say "No specific clauses affect this category."
10. fairness_score = 100 - |overall_party_a - 50| * 2. Clamp between 0-100.

VERDICT GUIDE (based on overall_party_a):
- >= 85: "PREDATORY"
- >= 75: "HEAVILY ONE-SIDED"
- >= 65: "ONE-SIDED"
- >= 55: "SLIGHTLY UNFAIR"
- 45-54: "BALANCED"
- < 45: "FAIR"

RESPOND ONLY IN THIS EXACT JSON FORMAT — no markdown:
{
  "party_a_name": "<entity name or role>",
  "party_b_name": "You (<role>)",
  "party_a_role": "<landlord|employer|company|lender|platform|seller|other>",
  "party_b_role": "<tenant|employee|consumer|borrower|user|buyer|other>",
  "overall_party_a": <number 0-100>,
  "overall_party_b": <number 0-100>,
  "categories": [
    {
      "name": "Termination & Exit",
      "key": "termination",
      "party_a_percent": <number>,
      "party_b_percent": <number>,
      "description": "<1-2 sentences explaining the imbalance>",
      "key_clause": "<e.g. 'Clauses 3, 7' or null>"
    },
    {
      "name": "Financial Burden",
      "key": "financial",
      "party_a_percent": <number>,
      "party_b_percent": <number>,
      "description": "<1-2 sentences>",
      "key_clause": "<clause references or null>"
    },
    {
      "name": "Penalties & Consequences",
      "key": "penalties",
      "party_a_percent": <number>,
      "party_b_percent": <number>,
      "description": "<1-2 sentences>",
      "key_clause": "<clause references or null>"
    },
    {
      "name": "Dispute Resolution",
      "key": "dispute",
      "party_a_percent": <number>,
      "party_b_percent": <number>,
      "description": "<1-2 sentences>",
      "key_clause": "<clause references or null>"
    },
    {
      "name": "Control & Modifications",
      "key": "control",
      "party_a_percent": <number>,
      "party_b_percent": <number>,
      "description": "<1-2 sentences>",
      "key_clause": "<clause references or null>"
    }
  ],
  "verdict": "<PREDATORY|HEAVILY ONE-SIDED|ONE-SIDED|SLIGHTLY UNFAIR|BALANCED|FAIR>",
  "verdict_description": "<2-3 sentences summarizing the power imbalance. Mention the exact split and what a fair contract looks like.>",
  "fairness_score": <number 0-100>
}`;

// ============================================
// PARTY ROLE MAPPING
// ============================================

function getPartyRoles(documentType: string): { aRole: string; bRole: string } {
  switch (documentType) {
    case "rental":
      return { aRole: "landlord", bRole: "tenant" };
    case "employment":
      return { aRole: "employer", bRole: "employee" };
    case "loan":
      return { aRole: "lender", bRole: "borrower" };
    case "freelance":
      return { aRole: "client", bRole: "freelancer" };
    case "tos":
      return { aRole: "platform", bRole: "user" };
    case "nda":
      return { aRole: "disclosing party", bRole: "receiving party" };
    case "sale":
      return { aRole: "seller", bRole: "buyer" };
    case "partnership":
      return { aRole: "partner A", bRole: "partner B" };
    case "service":
      return { aRole: "service provider", bRole: "client" };
    default:
      return { aRole: "party A", bRole: "party B" };
  }
}

// ============================================
// MAIN EXTRACTION FUNCTION
// ============================================

interface ClauseSummaryForPower {
  clause_number: number;
  clause_type: string;
  risk_level: string;
  risk_score: number;
  explanation: string;
}

/**
 * Extract power balance from analyzed clauses
 * Single AI call — run AFTER all clauses are analyzed
 */
export async function extractPowerBalance(
  clauses: ClauseSummaryForPower[],
  documentType: string,
  jurisdiction: string,
  entityName: string | null
): Promise<PowerBalance> {
  const { aRole, bRole } = getPartyRoles(documentType);

  // Build condensed clause summaries for the prompt
  const clauseSummaries = clauses
    .map(
      (c) =>
        `${c.clause_number}. [${c.clause_type}, ${c.risk_level}, ${c.risk_score}/100]: ${c.explanation}`
    )
    .join("\n");

  const userPrompt = `Analyze the power balance in this ${documentType} contract from ${jurisdiction}, India.

Entity (${aRole}): ${entityName || "Not identified"}
User (${bRole}): The person signing/agreeing

Total clauses: ${clauses.length}

Analyzed clauses:
${clauseSummaries}

Determine the power distribution across all 5 categories and provide the overall verdict.`;

  const response = await callGroq(
    [
      { role: "system", content: POWER_BALANCE_SYSTEM_PROMPT },
      { role: "user", content: userPrompt },
    ],
    {
      temperature: 0.2,
      maxTokens: 2048,
    }
  );

  let parsed: Record<string, unknown>;
  try {
    const raw = safeParseJson(response);
    if (!raw) {
      throw new Error("Failed to parse power balance response");
    }
    parsed = raw;
  } catch (parseError) {
    console.error("[ClauseWall] Power balance JSON parse failed:", parseError);
    // Return balanced fallback
    return createFallbackPowerBalance(entityName, aRole, bRole);
  }

  // ---- VALIDATE & NORMALIZE ----

  // Ensure overall adds to 100
  const overallA = safeInt(parsed.overall_party_a, 50, 0, 100);
  const overallB = 100 - overallA;

  // Validate categories
  const validKeys = ["termination", "financial", "penalties", "dispute", "control"];
  const validatedCategories: PowerCategory[] = [];
  const rawCategories = safeArray(parsed.categories);

  for (const key of validKeys) {
    const cat = rawCategories.find(
      (c: unknown) => (c as Record<string, unknown>)?.key === key
    ) as Record<string, unknown> | undefined;

    if (cat) {
      // Ensure percentages add to 100
      let pA = safeInt(cat.party_a_percent, 50, 0, 100);
      let pB = 100 - pA;

      validatedCategories.push({
        name: safeString(cat.name, key),
        key: key,
        party_a_percent: pA,
        party_b_percent: pB,
        description: safeString(cat.description, "No specific analysis available."),
        key_clause: safeStringOrNull(cat.key_clause),
      });
    } else {
      // Category missing from AI response — default to 50/50
      const defaultNames: Record<string, string> = {
        termination: "Termination & Exit",
        financial: "Financial Burden",
        penalties: "Penalties & Consequences",
        dispute: "Dispute Resolution",
        control: "Control & Modifications",
      };

      validatedCategories.push({
        name: defaultNames[key] || key,
        key: key,
        party_a_percent: 50,
        party_b_percent: 50,
        description: "No specific clauses affect this category.",
        key_clause: null,
      });
    }
  }

  // Validate verdict
  const validVerdicts = [
    "PREDATORY",
    "HEAVILY ONE-SIDED",
    "ONE-SIDED",
    "SLIGHTLY UNFAIR",
    "BALANCED",
    "FAIR",
  ];

  let verdict = safeString(parsed.verdict, "BALANCED");
  if (!validVerdicts.includes(verdict)) {
    // Determine from score
    if (overallA >= 85) verdict = "PREDATORY";
    else if (overallA >= 75) verdict = "HEAVILY ONE-SIDED";
    else if (overallA >= 65) verdict = "ONE-SIDED";
    else if (overallA >= 55) verdict = "SLIGHTLY UNFAIR";
    else if (overallA >= 45) verdict = "BALANCED";
    else verdict = "FAIR";
  }

  // Calculate fairness score
  const fairnessScore = Math.max(
    0,
    Math.min(100, Math.round(100 - Math.abs(overallA - 50) * 2))
  );

  const result: PowerBalance = {
    party_a_name: safeString(parsed.party_a_name, entityName || aRole),
    party_b_name: safeString(parsed.party_b_name, `You (${bRole})`),
    party_a_role: safeString(parsed.party_a_role, aRole),
    party_b_role: safeString(parsed.party_b_role, bRole),
    overall_party_a: overallA,
    overall_party_b: overallB,
    categories: validatedCategories,
    verdict,
    verdict_description: safeString(
      parsed.verdict_description,
      `This contract gives ${overallA}% of the power to the ${aRole}. A fair contract would be close to 50/50.`
    ),
    fairness_score: fairnessScore,
  };

  return result;
}

// ============================================
// FALLBACK CONSTRUCTOR
// ============================================

function createFallbackPowerBalance(
  entityName: string | null,
  aRole: string,
  bRole: string
): PowerBalance {
  const defaultNames: Record<string, string> = {
    termination: "Termination & Exit",
    financial: "Financial Burden",
    penalties: "Penalties & Consequences",
    dispute: "Dispute Resolution",
    control: "Control & Modifications",
  };
  const defaultCategories: PowerCategory[] = Object.entries(defaultNames).map(([key, name]) => ({
    name,
    key,
    party_a_percent: 50,
    party_b_percent: 50,
    description: "Power balance analysis could not be completed for this category.",
    key_clause: null,
  }));

  return {
    party_a_name: entityName || aRole,
    party_b_name: `You (${bRole})`,
    party_a_role: aRole,
    party_b_role: bRole,
    overall_party_a: 50,
    overall_party_b: 50,
    categories: defaultCategories,
    verdict: "BALANCED",
    verdict_description: "Power balance analysis could not be fully completed. Manual review is recommended.",
    fairness_score: 100,
  };
}