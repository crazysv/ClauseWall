// ============================================
// RULE ENGINE
// Compares extracted values against structured_rules DB
// Pure logic — no AI calls needed
// ============================================

import { createClient } from "@/lib/supabase/server";
import type { ExtractedValues, StructuredRule, RuleMatchResult, RiskLevel } from "@/types";

/**
 * Find matching rules from structured_rules table
 */
async function findMatchingRules(
  clauseType: string,
  jurisdiction: string,
  documentType: string,
  subType: string | null
): Promise<StructuredRule[]> {
  const supabase = await createClient();

  // Query for rules matching clause type + jurisdiction + document type
  const { data, error } = await supabase
    .from("structured_rules")
    .select("*")
    .eq("clause_type", clauseType)
    .eq("is_active", true)
    .in("jurisdiction", [jurisdiction, "ALL-INDIA"])
    .in("document_type", [documentType, "all"])
    .order("jurisdiction", { ascending: false }); // Prefer specific jurisdiction over ALL-INDIA

  if (error) {
    console.error("[ClauseWall] Rule lookup failed:", error);
    return [];
  }

  let rules = (data as StructuredRule[]) || [];

  // Filter by sub_type if provided
  if (subType && rules.length > 0) {
    const subTypeRules = rules.filter(
      (r) => r.sub_type === subType || r.sub_type === "all"
    );
    if (subTypeRules.length > 0) {
      rules = subTypeRules;
    }
  }

  return rules;
}

    /**
    * Compare extracted values against a single rule
    * Returns true if the clause VIOLATES the rule
    */
    function checkViolation(values: ExtractedValues, rule: StructuredRule): boolean {
    switch (rule.rule_type) {
    case "max_value":
        if (rule.limit_value == null) return false;

        // Determine which extracted value to use
        let extractedValue: number | null = null;
        let extractedUnit: string | null = null;

        // If rule expects months_of_rent, use secondary_value
        if (rule.limit_unit === "months_of_rent" && values.secondary_value != null) {
            extractedValue = values.secondary_value;
            extractedUnit = values.secondary_unit;
        } 
        // Otherwise use primary_value
        else if (values.primary_value != null) {
            extractedValue = values.primary_value;
            extractedUnit = values.primary_unit;
        }

        if (extractedValue == null) return false;

        // If units mismatch, attempt conversion
        if (rule.limit_unit && extractedUnit && rule.limit_unit !== extractedUnit) {
            const convertedValue = convertUnits(extractedValue, extractedUnit, rule.limit_unit);
            if (convertedValue !== null) {
                return convertedValue > rule.limit_value;
        }
        return false;
        }

        return extractedValue > rule.limit_value;

    case "min_value":
      // Violation if extracted value is BELOW the minimum
      if (values.primary_value == null || rule.limit_value == null) return false;
      return values.primary_value < rule.limit_value;

    case "prohibited":
      // The mere existence of this clause type is a violation
      return true;

    case "must_be_mutual":
      // Violation if clause is one-sided
      return values.is_one_sided;

    case "must_be_reasonable":
      // Check for obvious unreasonableness via forfeiture/penalty flags
      if (values.has_forfeiture) return true;
      if (values.has_penalty && values.primary_value != null) {
        // If there's a penalty and the value seems high, flag it
        return true;
      }
      // For reasonable checks without clear numeric violation,
      // return false and let AI handle nuance
      return false;

    case "required":
      // Hard to detect absence — let AI handle
      return false;

    case "must_disclose":
      // Hard to detect missing disclosure — let AI handle
      return false;

    default:
      return false;
  }
}

/**
 * Convert between common units
 */
function convertUnits(value: number, fromUnit: string, toUnit: string): number | null {
  // months_of_rent and months are compatible
  if (
    (fromUnit === "months_of_rent" && toUnit === "months") ||
    (fromUnit === "months" && toUnit === "months_of_rent")
  ) {
    return value;
  }

  // days to months (approximate)
  if (fromUnit === "days" && toUnit === "months") {
    return value / 30;
  }
  if (fromUnit === "months" && toUnit === "days") {
    return value * 30;
  }

  // percent and percent_annual are compatible
  if (
    (fromUnit === "percent" && toUnit === "percent_annual") ||
    (fromUnit === "percent_annual" && toUnit === "percent")
  ) {
    return value;
  }

  return null; // Can't convert
}

/**
 * Fill in violation template with actual values
 * Replaces {{value}}, {{value_minus_2}}, {{landlord_value}}, etc.
 */
function fillTemplate(template: string, values: ExtractedValues): string {
  let filled = template;

  if (values.primary_value != null) {
    filled = filled.replace(/\{\{value\}\}/g, String(values.primary_value));
    filled = filled.replace(/\{\{value_minus_2\}\}/g, String(values.primary_value - 2));
  }

  if (values.secondary_value != null) {
    filled = filled.replace(/\{\{landlord_value\}\}/g, String(values.secondary_value));
    filled = filled.replace(/\{\{secondary_value\}\}/g, String(values.secondary_value));
  }

  if (values.raw_amount_text) {
    filled = filled.replace(/\{\{raw_amount\}\}/g, values.raw_amount_text);
  }

  // Clean up any remaining template variables
  filled = filled.replace(/\{\{[^}]+\}\}/g, "[value]");

  return filled;
}

/**
 * MAIN FUNCTION: Check a clause against all matching rules
 */
export async function matchAgainstRules(
  values: ExtractedValues,
  jurisdiction: string,
  documentType: string
): Promise<RuleMatchResult> {
  try {
    // Determine sub_type from extracted values
    // Infer property type if not explicitly detected
    // FORCE rental agreements to default to residential
    let subType: string | null = null;

    if (documentType === "rental") {
        subType = "residential";
    } else {
        subType = values.property_type;
    }

    if (!subType) {
        subType = "all";
    }

    // Find all matching rules
    const rules = await findMatchingRules(
      values.clause_type,
      jurisdiction,
      documentType,
      subType
    );

    if (rules.length === 0) {
      // No rules found for this clause type
      return {
        matched: false,
        rule: null,
        violation: false,
        violation_description: null,
        severity: "warning",
        risk_score: 50,
        statute_code: null,
        statute_text: null,
        fair_alternative: null,
        negotiation_script: null,
        penalty: null,
      };
    }

    // Check each rule for violations — find the most severe one
    let worstViolation: { rule: StructuredRule; description: string } | null = null;

    for (const rule of rules) {
      const isViolation = checkViolation(values, rule);

      if (isViolation) {
        // If this violation is more severe than current worst, replace it
        if (
          !worstViolation ||
          rule.base_risk_score > worstViolation.rule.base_risk_score
        ) {
          const description = fillTemplate(rule.violation_template, values);
          worstViolation = { rule, description };
        }
      }
    }

    if (worstViolation) {
      // We found a violation!
      const { rule, description } = worstViolation;

      return {
        matched: true,
        rule,
        violation: true,
        violation_description: description,
        severity: rule.severity as RiskLevel,
        risk_score: rule.base_risk_score,
        statute_code: rule.statute_code,
        statute_text: rule.statute_text || null,
        fair_alternative: fillTemplate(rule.fair_alternative, values),
        negotiation_script: fillTemplate(rule.negotiation_script, values),
        penalty: rule.penalty || null,
      };
    }

    // Rules found but no violation — clause is compliant
    const bestRule = rules[0]; // Use first rule for reference

    return {
      matched: true,
      rule: bestRule,
      violation: false,
      violation_description: null,
      severity: "safe",
      risk_score: 10,
      statute_code: bestRule.statute_code,
      statute_text: bestRule.statute_text || null,
      fair_alternative: null,
      negotiation_script: null,
      penalty: null,
    };
  } catch (error) {
    console.error("[ClauseWall] Rule engine failed:", error);

    return {
      matched: false,
      rule: null,
      violation: false,
      violation_description: null,
      severity: "warning",
      risk_score: 50,
      statute_code: null,
      statute_text: null,
      fair_alternative: null,
      negotiation_script: null,
      penalty: null,
    };
  }
}