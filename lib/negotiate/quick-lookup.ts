// ============================================
// QUICK LOOKUP — INSTANT LEGAL LOOKUP
// Two-tier: DB first (instant), then AI fallback
// ============================================

import { createClient } from "@/lib/supabase/server";
import { callGroq } from "@/lib/ai/groq-client";
import { detectClauseType, CLAUSE_TYPE_MAP } from "./bluff-checker";
import type { QuickLookupResult, StructuredRuleMatch, StructuredRule } from "@/types";

// ============================================
// JURISDICTION DETECTION FROM Text
// ============================================

const JURISDICTION_MAP: Record<string, string> = {
  bangalore: "KA", bengaluru: "KA", karnataka: "KA", mysore: "KA", mangalore: "KA",
  mumbai: "MH", pune: "MH", maharashtra: "MH", nagpur: "MH", thane: "MH", navi: "MH",
  delhi: "DL", "new delhi": "DL", ncr: "DL", noida: "UP", gurgaon: "HR", gurugram: "HR",
  chennai: "TN", "tamil nadu": "TN", coimbatore: "TN", madurai: "TN",
  hyderabad: "TS", telangana: "TS", secunderabad: "TS",
  kolkata: "WB", "west bengal": "WB",
  ahmedabad: "GJ", gujarat: "GJ", surat: "GJ", vadodara: "GJ",
  jaipur: "RJ", rajasthan: "RJ", udaipur: "RJ", jodhpur: "RJ",
  lucknow: "UP", "uttar pradesh": "UP", kanpur: "UP", agra: "UP", varanasi: "UP",
  chandigarh: "CH", punjab: "PB", ludhiana: "PB", amritsar: "PB",
  goa: "GA", panaji: "GA",
  kerala: "KL", kochi: "KL", thiruvananthapuram: "KL",
  bhopal: "MP", "madhya pradesh": "MP", indore: "MP",
  patna: "BR", bihar: "BR",
  bhubaneswar: "OD", odisha: "OD",
  guwahati: "AS", assam: "AS",
  dehradun: "UK", uttarakhand: "UK",
  ranchi: "JH", jharkhand: "JH",
  raipur: "CG", chhattisgarh: "CG",
  shimla: "HP", "himachal pradesh": "HP",
  srinagar: "JK", jammu: "JK",
};

/**
 * Detect jurisdiction from query text
 */
function detectJurisdiction(text: string): string | null {
  const lower = text.toLowerCase();

  // Sort by length descending for longest match first
  const sortedKeys = Object.keys(JURISDICTION_MAP).sort((a, b) => b.length - a.length);

  for (const key of sortedKeys) {
    if (lower.includes(key)) {
      return JURISDICTION_MAP[key];
    }
  }

  return null;
}

// ============================================
// MAIN LOOKUP FUNCTION
// ============================================

/**
 * Two-tier lookup: DB first, AI fallback
 */
export async function lookupClauseQuestion(
  query: string,
  jurisdiction: string,
  documentType: string
): Promise<QuickLookupResult> {
  try {
    // Detect clause type and jurisdiction from query
    const clauseType = detectClauseType(query);
    const detectedJurisdiction = detectJurisdiction(query);
    const effectiveJurisdiction = detectedJurisdiction || jurisdiction;

    // TIER 1: Database lookup
    if (clauseType) {
      const dbResult = await databaseLookup(query, clauseType, effectiveJurisdiction, documentType);
      if (dbResult) {
        return {
          ...dbResult,
          jurisdiction_detected: detectedJurisdiction,
        };
      }
    }

    // TIER 2: AI fallback
    const aiResult = await aiLookup(query, effectiveJurisdiction, documentType);
    return {
      ...aiResult,
      clause_type_detected: clauseType,
      jurisdiction_detected: detectedJurisdiction,
    };
  } catch (error) {
    console.error("[ClauseWall] Quick lookup failed:", error);
    return {
      query,
      clause_type_detected: null,
      jurisdiction_detected: null,
      legal_answer: "Unable to process this query right now. Please try rephrasing or try again.",
      legal_limit: null,
      statute: null,
      what_to_say: "I'd like to verify the legal position on this before we proceed.",
      related_rules: [],
      source: "ai",
    };
  }
}

// ============================================
// TIER 1: DATABASE LOOKUP
// ============================================

async function databaseLookup(
  query: string,
  clauseType: string,
  jurisdiction: string,
  documentType: string
): Promise<QuickLookupResult | null> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("structured_rules")
      .select("*")
      .eq("clause_type", clauseType)
      .eq("is_active", true)
      .in("jurisdiction", [jurisdiction, "ALL-INDIA"])
      .in("document_type", [documentType, "all"])
      .order("jurisdiction", { ascending: false });

    if (error || !data || data.length === 0) return null;

    const rules = data as StructuredRule[];
    const primaryRule = rules[0];

    // Build the structured rule matches
    const relatedRules: StructuredRuleMatch[] = rules.map((r) => ({
      rule_id: r.id,
      clause_type: r.clause_type,
      rule_type: r.rule_type,
      limit_value: r.limit_value,
      limit_unit: r.limit_unit,
      statute_name: r.statute_name,
      statute_code: r.statute_code,
      negotiation_script: r.negotiation_script,
      severity: r.severity,
    }));

    // Build answer from DB fields
    const legalLimit = primaryRule.limit_value != null
      ? `${primaryRule.limit_value} ${primaryRule.limit_unit || ""}`
      : null;

    const legalAnswer = buildDatabaseAnswer(primaryRule, clauseType);
    const statute = primaryRule.statute_name
      ? `${primaryRule.statute_name} (${primaryRule.statute_code || ""})`
      : null;

    return {
      query,
      clause_type_detected: clauseType,
      jurisdiction_detected: null,
      legal_answer: legalAnswer,
      legal_limit: legalLimit,
      statute,
      what_to_say: primaryRule.negotiation_script || `Under ${primaryRule.statute_name}, the legal limit for this is ${legalLimit}. I'd like the contract to comply with this.`,
      related_rules: relatedRules,
      source: "database",
    };
  } catch (error) {
    console.error("[ClauseWall] DB lookup failed:", error);
    return null;
  }
}

/**
 * Build a human-readable answer from a database rule
 */
function buildDatabaseAnswer(rule: StructuredRule, clauseType: string): string {
  const parts: string[] = [];

  if (rule.rule_type === "prohibited") {
    parts.push(`This type of clause (${clauseType}) is prohibited under ${rule.statute_name}.`);
  } else if (rule.rule_type === "max_value" && rule.limit_value != null) {
    parts.push(`The maximum legal limit for ${clauseType} is ${rule.limit_value} ${rule.limit_unit || ""} under ${rule.statute_name} (${rule.statute_code || ""}).`);
  } else if (rule.rule_type === "min_value" && rule.limit_value != null) {
    parts.push(`The minimum requirement for ${clauseType} is ${rule.limit_value} ${rule.limit_unit || ""} under ${rule.statute_name}.`);
  } else if (rule.rule_type === "must_be_mutual") {
    parts.push(`${clauseType} clauses must be mutual (applying equally to both parties) under ${rule.statute_name}.`);
  } else if (rule.rule_type === "must_be_reasonable") {
    parts.push(`${clauseType} must be reasonable under ${rule.statute_name}. Unreasonable terms can be challenged.`);
  } else {
    parts.push(`Regulation found for ${clauseType} under ${rule.statute_name} (${rule.statute_code || ""}).`);
  }

  if (rule.violation_template) {
    parts.push(rule.violation_template.replace(/\{\{[^}]+\}\}/g, "[value]"));
  }

  if (rule.penalty) {
    parts.push(`Penalty for violation: ${rule.penalty}`);
  }

  return parts.join(" ");
}

// ============================================
// TIER 2: AI LOOKUP
// ============================================

async function aiLookup(
  query: string,
  jurisdiction: string,
  documentType: string
): Promise<QuickLookupResult> {
  try {
    const systemPrompt = `You are an Indian legal expert answering a quick question during a live contract negotiation. Be concise, specific, and actionable.

IMPORTANT RULES:
1. Be SPECIFIC — cite EXACT sections, not vague references
2. This person is in a LIVE negotiation and needs actionable information RIGHT NOW
3. Keep answers SHORT — 2-3 sentences maximum for each field
4. Always provide exact words to say

Respond in this EXACT JSON format:
{
  "legal_answer": "Direct answer (2-3 sentences max)",
  "legal_limit": "Specific legal limit if applicable (e.g., '2 months rent') or null",
  "statute": "Specific law citation (e.g., 'Section 7, Maharashtra Rent Control Act') or null",
  "what_to_say": "Exact words for the negotiation (1-2 sentences)",
  "clause_type_detected": "What type of clause this is about or null"
}`;

    const userPrompt = `Question: ${query}
Contract type: ${documentType}
Jurisdiction: ${jurisdiction}, India

Answer concisely with specific legal citations.`;

    const response = await callGroq(
      [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      {
        temperature: 0.1,
        maxTokens: 1024,
        retries: 2,
      }
    );

    const parsed = JSON.parse(response);

    return {
      query,
      clause_type_detected: parsed.clause_type_detected || null,
      jurisdiction_detected: null,
      legal_answer: parsed.legal_answer || "Unable to provide a specific answer.",
      legal_limit: parsed.legal_limit || null,
      statute: parsed.statute || null,
      what_to_say: parsed.what_to_say || "I'd like to verify the legal position on this.",
      related_rules: [],
      source: "ai",
    };
  } catch (error) {
    console.error("[ClauseWall] AI lookup failed:", error);
    return {
      query,
      clause_type_detected: null,
      jurisdiction_detected: null,
      legal_answer: "AI analysis is temporarily unavailable. Please try again.",
      legal_limit: null,
      statute: null,
      what_to_say: "I need a moment to verify the legal position on this before we continue.",
      related_rules: [],
      source: "ai",
    };
  }
}
