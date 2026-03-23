// ============================================
// BLUFF CHECKER — DATABASE-POWERED FACT CHECKER
// Fact-checks legal claims against structured_rules DB
// ============================================

import { createClient } from "@/lib/supabase/server";
import type { BluffAnalysis, StructuredRule, BluffCheckResult } from "@/types";

// ============================================
// KEYWORD → CLAUSE TYPE MAPPING
// ============================================

const CLAUSE_TYPE_MAP: Record<string, string> = {
  deposit: "security_deposit",
  "security deposit": "security_deposit",
  advance: "security_deposit",
  "advance deposit": "security_deposit",
  "refundable deposit": "security_deposit",
  notice: "notice_period",
  "notice period": "notice_period",
  "rent increase": "rent_escalation",
  "rent hike": "rent_escalation",
  hike: "rent_escalation",
  escalation: "rent_escalation",
  penalty: "penalty",
  "late fee": "late_payment",
  "late payment": "late_payment",
  interest: "interest_rate",
  "interest rate": "interest_rate",
  "lock-in": "lock_in",
  "lock in": "lock_in",
  lockin: "lock_in",
  "non-compete": "non_compete",
  "non compete": "non_compete",
  noncompete: "non_compete",
  termination: "termination",
  exit: "termination",
  registration: "registration",
  "stamp duty": "stamp_duty",
  maintenance: "maintenance",
  broker: "brokerage",
  brokerage: "brokerage",
  commission: "brokerage",
  painting: "painting_charges",
  "painting charges": "painting_charges",
  "rent control": "rent_control",
  subletting: "subletting",
  "sub letting": "subletting",
  "sub-letting": "subletting",
  "probation": "probation_period",
  "probation period": "probation_period",
  gratuity: "gratuity",
  "notice pay": "notice_period",
  "garden leave": "garden_leave",
  "intellectual property": "ip_assignment",
  ip: "ip_assignment",
  indemnity: "indemnity",
  "force majeure": "force_majeure",
  arbitration: "arbitration",
  jurisdiction: "jurisdiction",
  confidentiality: "confidentiality",
  nda: "confidentiality",
};

// ============================================
// NUMBER EXTRACTION
// ============================================

/**
 * Extract numeric value and unit from text
 * Handles: "6 months", "₹50,000", "3%", "90 days", "6 mahine"
 */
function extractClaimValue(text: string): { value: number; unit: string } | null {
  const lower = text.toLowerCase();

  // Match patterns like "6 months", "3 months rent", "6 mahine"
  const monthMatch = lower.match(/(\d+\.?\d*)\s*(?:months?|mahine|mahina|month)/);
  if (monthMatch) {
    return { value: parseFloat(monthMatch[1]), unit: "months" };
  }

  // Match "X months of rent" or "X months rent"
  const monthRentMatch = lower.match(/(\d+\.?\d*)\s*months?\s*(?:of\s+)?rent/);
  if (monthRentMatch) {
    return { value: parseFloat(monthRentMatch[1]), unit: "months_of_rent" };
  }

  // Match "X days" or "X din"
  const dayMatch = lower.match(/(\d+\.?\d*)\s*(?:days?|din)/);
  if (dayMatch) {
    return { value: parseFloat(dayMatch[1]), unit: "days" };
  }

  // Match "X%" or "X percent"
  const pctMatch = lower.match(/(\d+\.?\d*)\s*(?:%|percent)/);
  if (pctMatch) {
    return { value: parseFloat(pctMatch[1]), unit: "percent" };
  }

  // Match "X years" or "X saal"
  const yearMatch = lower.match(/(\d+\.?\d*)\s*(?:years?|saal)/);
  if (yearMatch) {
    return { value: parseFloat(yearMatch[1]) * 12, unit: "months" };
  }

  // Match rupee amounts "₹X" or "Rs X" or "Rs.X"
  const rupeeMatch = lower.match(/(?:₹|rs\.?\s*)(\d[\d,]*\.?\d*)/);
  if (rupeeMatch) {
    const val = parseFloat(rupeeMatch[1].replace(/,/g, ""));
    return { value: val, unit: "rupees" };
  }

  // Generic number extraction
  const genericMatch = lower.match(/(\d+\.?\d*)/);
  if (genericMatch) {
    return { value: parseFloat(genericMatch[1]), unit: "unknown" };
  }

  return null;
}

/**
 * Detect clause type from claim text using keyword matching
 */
function detectClauseType(text: string): string | null {
  const lower = text.toLowerCase();

  // Check multi-word phrases first (longer matches take priority)
  const sortedKeys = Object.keys(CLAUSE_TYPE_MAP).sort((a, b) => b.length - a.length);

  for (const keyword of sortedKeys) {
    if (lower.includes(keyword)) {
      return CLAUSE_TYPE_MAP[keyword];
    }
  }

  return null;
}

// ============================================
// MAIN BLUFF CHECKING FUNCTION
// ============================================

/**
 * Full bluff check — queries DB, compares values, generates response
 */
export async function checkBluff(
  claimText: string,
  jurisdiction: string,
  documentType: string
): Promise<BluffAnalysis> {
  const id = `bluff_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

  try {
    // Step 1: Detect clause type
    const clauseType = detectClauseType(claimText);
    const claimValue = extractClaimValue(claimText);

    if (!clauseType) {
      return {
        id,
        claim_text: claimText,
        claim_topic: "unknown",
        result: "unverifiable",
        actual_legal_position: "Unable to identify the specific legal topic from this claim. Consider asking for the exact law section they're referring to.",
        statute_name: null,
        statute_code: null,
        legal_limit: null,
        their_claim_value: claimValue ? `${claimValue.value} ${claimValue.unit}` : null,
        difference: null,
        what_to_say: "Could you point me to the specific section of the law that requires this? I'd like to verify independently.",
        confidence: "low",
        source: "ai",
      };
    }

    // Step 2: Query structured_rules
    const supabase = await createClient();

    const { data: rules, error } = await supabase
      .from("structured_rules")
      .select("*")
      .eq("clause_type", clauseType)
      .eq("is_active", true)
      .in("jurisdiction", [jurisdiction, "ALL-INDIA"])
      .in("document_type", [documentType, "all"])
      .order("jurisdiction", { ascending: false });

    if (error) {
      console.error("[ClauseWall] Bluff check DB error:", error);
      return {
        id,
        claim_text: claimText,
        claim_topic: clauseType,
        result: "unverifiable",
        actual_legal_position: "Unable to verify this claim due to a database error. Please check manually.",
        statute_name: null,
        statute_code: null,
        legal_limit: null,
        their_claim_value: claimValue ? `${claimValue.value} ${claimValue.unit}` : null,
        difference: null,
        what_to_say: "I'd like to independently verify that claim. Could you share the specific law section?",
        confidence: "low",
        source: "ai",
      };
    }

    const matchedRules = (rules as StructuredRule[]) || [];

    if (matchedRules.length === 0) {
      return {
        id,
        claim_text: claimText,
        claim_topic: clauseType,
        result: "unverifiable",
        actual_legal_position: `No specific regulation found for ${clauseType} in ${jurisdiction}. This doesn't mean the claim is true — it means we can't verify it from our database.`,
        statute_name: null,
        statute_code: null,
        legal_limit: null,
        their_claim_value: claimValue ? `${claimValue.value} ${claimValue.unit}` : null,
        difference: null,
        what_to_say: "I'm not finding that specific requirement in the law. Could you share the section number so I can verify?",
        confidence: "low",
        source: "ai",
      };
    }

    // Step 3: Compare against rules
    const rule = matchedRules[0]; // Use highest priority match (jurisdiction-specific first)

    // Case: Prohibited clause
    if (rule.rule_type === "prohibited") {
      return {
        id,
        claim_text: claimText,
        claim_topic: clauseType,
        result: "false_claim",
        actual_legal_position: `This clause type is actually PROHIBITED under ${rule.statute_name} (${rule.statute_code}). ${rule.violation_template}`,
        statute_name: rule.statute_name,
        statute_code: rule.statute_code,
        legal_limit: "Prohibited entirely",
        their_claim_value: claimValue ? `${claimValue.value} ${claimValue.unit}` : null,
        difference: "What they're claiming is legally required is actually prohibited by law.",
        what_to_say: rule.negotiation_script || `This clause is actually prohibited under ${rule.statute_name}. I'd recommend we remove it entirely.`,
        confidence: "high",
        source: "database",
      };
    }

    // Case: Max value rule — compare claim against limit
    if (rule.rule_type === "max_value" && rule.limit_value != null && claimValue) {
      // Try to compare (unit conversion if needed)
      let comparableValue = claimValue.value;
      let comparableUnit = claimValue.unit;

      // Convert days to months if needed
      if (claimValue.unit === "days" && rule.limit_unit === "months") {
        comparableValue = claimValue.value / 30;
        comparableUnit = "months";
      }
      if (claimValue.unit === "months" && rule.limit_unit === "days") {
        comparableValue = claimValue.value * 30;
        comparableUnit = "days";
      }

      // months and months_of_rent are compatible
      if (
        (claimValue.unit === "months" && rule.limit_unit === "months_of_rent") ||
        (claimValue.unit === "months_of_rent" && rule.limit_unit === "months")
      ) {
        comparableUnit = rule.limit_unit || comparableUnit;
      }

      const isExceeding = comparableValue > rule.limit_value;
      const isMatching = comparableValue <= rule.limit_value;

      if (isExceeding) {
        const excess = comparableValue - rule.limit_value;
        return {
          id,
          claim_text: claimText,
          claim_topic: clauseType,
          result: "false_claim",
          actual_legal_position: `Under ${rule.statute_name} (${rule.statute_code}), the maximum allowed is ${rule.limit_value} ${rule.limit_unit}. They're asking for ${claimValue.value} ${claimValue.unit}, which exceeds the legal limit.`,
          statute_name: rule.statute_name,
          statute_code: rule.statute_code,
          legal_limit: `${rule.limit_value} ${rule.limit_unit}`,
          their_claim_value: `${claimValue.value} ${claimValue.unit}`,
          difference: `They're asking ${excess.toFixed(1)} ${comparableUnit} more than the legal maximum (${Math.round((comparableValue / rule.limit_value) * 100)}% of legal limit).`,
          what_to_say: rule.negotiation_script || `Under ${rule.statute_name}, the maximum allowed is ${rule.limit_value} ${rule.limit_unit}. What you're asking exceeds the legal limit by ${excess.toFixed(1)} ${comparableUnit}.`,
          confidence: "high",
          source: "database",
        };
      }

      if (isMatching) {
        return {
          id,
          claim_text: claimText,
          claim_topic: clauseType,
          result: "true_claim",
          actual_legal_position: `This claim appears to be within legal limits. Under ${rule.statute_name} (${rule.statute_code}), the maximum is ${rule.limit_value} ${rule.limit_unit}. Their ask of ${claimValue.value} ${claimValue.unit} is within range.`,
          statute_name: rule.statute_name,
          statute_code: rule.statute_code,
          legal_limit: `${rule.limit_value} ${rule.limit_unit}`,
          their_claim_value: `${claimValue.value} ${claimValue.unit}`,
          difference: null,
          what_to_say: "This appears to be within legal limits, but you can still negotiate for better terms.",
          confidence: "high",
          source: "database",
        };
      }
    }

    // Case: Rule found but no numeric comparison possible
    return {
      id,
      claim_text: claimText,
      claim_topic: clauseType,
      result: "partially_true",
      actual_legal_position: `Found relevant regulation under ${rule.statute_name} (${rule.statute_code}). ${rule.limit_value != null ? `Legal limit: ${rule.limit_value} ${rule.limit_unit}.` : ""} Verify the specific claim details.`,
      statute_name: rule.statute_name,
      statute_code: rule.statute_code,
      legal_limit: rule.limit_value != null ? `${rule.limit_value} ${rule.limit_unit}` : null,
      their_claim_value: claimValue ? `${claimValue.value} ${claimValue.unit}` : null,
      difference: null,
      what_to_say: rule.negotiation_script || `I see there are regulations under ${rule.statute_name} regarding this. Let me verify the specific limits.`,
      confidence: "medium",
      source: "database",
    };
  } catch (error) {
    console.error("[ClauseWall] Bluff check failed:", error);
    return {
      id,
      claim_text: claimText,
      claim_topic: detectClauseType(claimText) || "unknown",
      result: "unverifiable",
      actual_legal_position: "Unable to verify this claim due to a technical error.",
      statute_name: null,
      statute_code: null,
      legal_limit: null,
      their_claim_value: null,
      difference: null,
      what_to_say: "I'd like to independently verify that claim. Could you share the specific law section?",
      confidence: "low",
      source: "ai",
    };
  }
}

// ============================================
// QUICK FACT CHECK (DB-ONLY, NO AI)
// ============================================

/**
 * Lightweight bluff check — database only, returns null if no match
 */
export async function quickFactCheck(
  claimText: string,
  jurisdiction: string,
  documentType: string
): Promise<BluffAnalysis | null> {
  try {
    const clauseType = detectClauseType(claimText);
    if (!clauseType) return null;

    const supabase = await createClient();

    const { data: rules, error } = await supabase
      .from("structured_rules")
      .select("*")
      .eq("clause_type", clauseType)
      .eq("is_active", true)
      .in("jurisdiction", [jurisdiction, "ALL-INDIA"])
      .in("document_type", [documentType, "all"])
      .order("jurisdiction", { ascending: false })
      .limit(1);

    if (error || !rules || rules.length === 0) return null;

    // Delegate to full checker since we have a match
    return checkBluff(claimText, jurisdiction, documentType);
  } catch {
    return null;
  }
}

// Export the clause type detector for use by other modules
export { detectClauseType, extractClaimValue, CLAUSE_TYPE_MAP };
