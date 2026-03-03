// ============================================
// LEGAL MATCHER — AI VALIDATION LAYER
// Cross-references AI citations with verified legal database
// ============================================

import { createClient } from "@/lib/supabase/server";
import type { Clause, LegalRule } from "@/types";

export interface MatchResult {
  clause_id: string;
  is_verified: boolean;
  matched_rules: LegalRule[];
  confidence: "verified" | "partial" | "ai_suggested";
  verification_note: string;
}

/**
 * Cross-reference a single clause's citation against legal database
 */
export async function matchClauseToLegalRules(
  clause: Clause,
  jurisdiction: string,
  documentType: string
): Promise<MatchResult> {
  const supabase = await createClient();

  try {
    // ---- Strategy 1: Direct statute code match ----
    let matchedRules: LegalRule[] = [];

    if (clause.legal_citation || clause.statute_code) {
      const citation = clause.legal_citation || clause.statute_code || "";

      // Search by statute code (exact or partial match)
      const { data: directMatches } = await supabase
        .from("legal_rules")
        .select("*")
        .or(
          `statute_code.ilike.%${extractStatuteKeywords(citation)}%`
        )
        .limit(5);

      if (directMatches && directMatches.length > 0) {
        matchedRules = directMatches as LegalRule[];
      }
    }

    // ---- Strategy 2: Keyword-based match ----
    if (matchedRules.length === 0 && clause.clause_type) {
      const { data: keywordMatches } = await supabase
        .from("legal_rules")
        .select("*")
        .or(
          `jurisdiction.eq.${jurisdiction},jurisdiction.eq.ALL-INDIA`
        )
        .eq("clause_type", clause.clause_type)
        .limit(5);

      if (keywordMatches && keywordMatches.length > 0) {
        matchedRules = keywordMatches as LegalRule[];
      }
    }

    // ---- Strategy 3: Broad keyword search ----
    if (matchedRules.length === 0) {
      const searchTerms = extractSearchTerms(
        clause.original_text,
        clause.clause_type,
        clause.legal_citation
      );

      for (const term of searchTerms) {
        const { data: broadMatches } = await supabase
          .from("legal_rules")
          .select("*")
          .or(
            `jurisdiction.eq.${jurisdiction},jurisdiction.eq.ALL-INDIA`
          )
          .or(
            `keywords.cs.{${term}},rule_title.ilike.%${term}%,rule_description.ilike.%${term}%`
          )
          .limit(3);

        if (broadMatches && broadMatches.length > 0) {
          matchedRules = [
            ...matchedRules,
            ...(broadMatches as LegalRule[]),
          ];
          break;
        }
      }
    }

    // ---- Deduplicate matches ----
    matchedRules = deduplicateRules(matchedRules);

    // ---- Determine confidence level ----
    let confidence: "verified" | "partial" | "ai_suggested";
    let is_verified: boolean;
    let verification_note: string;

    if (matchedRules.length > 0 && clause.legal_citation) {
      // Check if the AI's citation matches our database
      const citationMatch = matchedRules.some(
        (rule) =>
          rule.statute_code &&
          clause.legal_citation &&
          (rule.statute_code
            .toLowerCase()
            .includes(
              extractStatuteKeywords(clause.legal_citation).toLowerCase()
            ) ||
            clause.legal_citation
              .toLowerCase()
              .includes(
                extractStatuteKeywords(rule.statute_code).toLowerCase()
              ))
      );

      if (citationMatch) {
        confidence = "verified";
        is_verified = true;
        verification_note = `✅ Citation verified against ClauseWall Legal Database. Matched with ${matchedRules.length} rule(s).`;
      } else {
        confidence = "partial";
        is_verified = false;
        verification_note = `⚠️ Related rules found in database but exact citation not verified. AI citation may be accurate but verify independently.`;
      }
    } else if (matchedRules.length > 0) {
      confidence = "partial";
      is_verified = false;
      verification_note = `ℹ️ Related legal rules found for this clause type. No specific citation to verify.`;
    } else {
      confidence = "ai_suggested";
      is_verified = false;
      verification_note = `🤖 Citation is AI-generated and not found in our verified database. We recommend verifying independently.`;
    }

    return {
      clause_id: clause.id,
      is_verified,
      matched_rules: matchedRules.slice(0, 3), // Top 3 matches
      confidence,
      verification_note,
    };
  } catch (error) {
    console.error("[ClauseWall] Legal matching failed:", error);
    return {
      clause_id: clause.id,
      is_verified: false,
      matched_rules: [],
      confidence: "ai_suggested",
      verification_note:
        "🤖 Could not verify citation. Please verify independently.",
    };
  }
}

/**
 * Match ALL clauses in a document against legal database
 */
export async function matchDocumentClauses(
  clauses: Clause[],
  jurisdiction: string,
  documentType: string
): Promise<Map<string, MatchResult>> {
  const results = new Map<string, MatchResult>();

  for (const clause of clauses) {
    // Only match clauses that have risk (skip safe clauses for speed)
    if (clause.risk_level === "safe" && clause.risk_score <= 10) {
      results.set(clause.id, {
        clause_id: clause.id,
        is_verified: true,
        matched_rules: [],
        confidence: "verified",
        verification_note: "✅ Standard clause — no legal concerns.",
      });
      continue;
    }

    const match = await matchClauseToLegalRules(
      clause,
      jurisdiction,
      documentType
    );
    results.set(clause.id, match);
  }

  return results;
}

/**
 * Get all relevant legal rules for a jurisdiction + document type
 */
export async function getRelevantRules(
  jurisdiction: string,
  documentType: string
): Promise<LegalRule[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("legal_rules")
    .select("*")
    .or(
      `jurisdiction.eq.${jurisdiction},jurisdiction.eq.ALL-INDIA`
    )
    .or(
      `document_type.eq.${documentType},document_type.eq.all`
    )
    .order("jurisdiction", { ascending: true });

  if (error) {
    console.error("[ClauseWall] Failed to fetch legal rules:", error);
    return [];
  }

  return (data as LegalRule[]) || [];
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Extract key parts from a statute citation for matching
 * e.g., "Indian Contract Act, 1872 — Section 27" → "contract act section 27"
 */
function extractStatuteKeywords(citation: string): string {
  if (!citation) return "";

  return citation
    .toLowerCase()
    .replace(/[,\-—()]/g, " ")
    .replace(/\b(the|of|and|in|under|act|section|sec|rule)\b/g, " $1 ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Extract search terms from clause text and metadata
 */
function extractSearchTerms(
  clauseText: string,
  clauseType: string,
  citation: string | null
): string[] {
  const terms: string[] = [];

  // Add clause type as search term
  if (clauseType) {
    terms.push(clauseType.replace(/_/g, " "));
  }

  // Extract key legal terms from clause text
  const legalKeywords = [
    "deposit",
    "security deposit",
    "lock-in",
    "lock in",
    "notice period",
    "termination",
    "eviction",
    "rent increase",
    "maintenance",
    "painting",
    "non-compete",
    "non compete",
    "training bond",
    "service bond",
    "probation",
    "gratuity",
    "PF",
    "ESI",
    "overtime",
    "working hours",
    "leave",
    "salary",
    "compensation",
    "penalty",
    "late fee",
    "refund",
    "cancellation",
    "data privacy",
    "arbitration",
    "jurisdiction",
    "liability",
    "indemnification",
    "intellectual property",
    "confidentiality",
    "NDA",
    "RERA",
    "carpet area",
    "possession",
    "structural defect",
    "prepayment",
    "interest rate",
    "insurance",
    "essential services",
    "electricity",
    "water",
  ];

  const lowerText = clauseText.toLowerCase();
  for (const keyword of legalKeywords) {
    if (lowerText.includes(keyword.toLowerCase())) {
      terms.push(keyword);
    }
  }

  // Extract from citation
  if (citation) {
    const citationParts = citation
      .split(/[,\-—§]/)
      .map((p) => p.trim())
      .filter((p) => p.length > 3);
    terms.push(...citationParts.slice(0, 2));
  }

  return terms.slice(0, 5); // Limit to 5 search terms
}

/**
 * Remove duplicate rules from matches
 */
function deduplicateRules(rules: LegalRule[]): LegalRule[] {
  const seen = new Set<string>();
  return rules.filter((rule) => {
    if (seen.has(rule.id)) return false;
    seen.add(rule.id);
    return true;
  });
}