// ============================================
// RULE COMPILER
// Transforms StructuredRule (from Supabase DB)
// into LogicalRule format the engine understands
// ============================================

import type { StructuredRule } from "@/types";
import type { LogicalRule, Condition, Conclusion } from "./types";
import { createClient } from "@/lib/supabase/server";

// ---- Module-level cache ----

const compiledRulesCache = new Map<string, LogicalRule[]>();

// ---- Main compilation function ----

export function compileRules(
  structuredRules: StructuredRule[],
  jurisdiction: string,
  documentType: string
): LogicalRule[] {
  const compiled: LogicalRule[] = [];

  for (const rule of structuredRules) {
    if (!rule.is_active) continue;

    const conditions: Condition[] = [];
    let conclusion: Conclusion;

    // Always add jurisdiction condition
    conditions.push({
      type: "membership",
      predicate: "jurisdiction",
      value: [rule.jurisdiction, "ALL_INDIA"],
    });

    // Always add document type condition
    conditions.push({
      type: "membership",
      predicate: "document_type",
      value: [rule.document_type, "all"],
    });

    switch (rule.rule_type) {
      case "max_value": {
        const predicate = inferFieldPredicate(rule.clause_type, rule.limit_unit);
        conditions.push({
          type: "comparison",
          predicate,
          operator: ">",
          value: rule.limit_value ?? 0,
        });

        conclusion = {
          type: "violation",
          riskLevel: mapSeverity(rule.severity),
          message: rule.violation_template ||
            `{${predicate}} of {${predicate}} exceeds legal maximum of ${rule.limit_value} ${rule.limit_unit || ""}`,
          detailedExplanation: rule.violation_template
            ? fillTemplateStatic(rule.violation_template, rule)
            : `The extracted value exceeds the maximum limit of ${rule.limit_value} ${rule.limit_unit || ""} as specified under ${rule.statute_code}`,
        };
        break;
      }

      case "min_value": {
        const predicate = inferFieldPredicate(rule.clause_type, rule.limit_unit);
        conditions.push({
          type: "comparison",
          predicate,
          operator: "<",
          value: rule.limit_value ?? 0,
        });

        conclusion = {
          type: "violation",
          riskLevel: mapSeverity(rule.severity),
          message: rule.violation_template ||
            `{${predicate}} is below the legal minimum of ${rule.limit_value} ${rule.limit_unit || ""}`,
          detailedExplanation: rule.violation_template
            ? fillTemplateStatic(rule.violation_template, rule)
            : `The extracted value is below the minimum requirement of ${rule.limit_value} ${rule.limit_unit || ""} as specified under ${rule.statute_code}`,
        };
        break;
      }

      case "prohibited": {
        conditions.push({
          type: "existence",
          predicate: `clause_type_is_${rule.clause_type}`,
        });

        conclusion = {
          type: "violation",
          riskLevel: mapSeverity(rule.severity),
          message: rule.violation_template || `This clause type (${rule.clause_type}) is prohibited`,
          detailedExplanation: rule.violation_template
            ? fillTemplateStatic(rule.violation_template, rule)
            : `Clauses of type '${rule.clause_type}' are prohibited under ${rule.statute_code}`,
        };
        break;
      }

      case "must_be_mutual": {
        conditions.push({
          type: "comparison",
          predicate: "is_one_sided",
          operator: "==",
          value: true,
        });

        conclusion = {
          type: "violation",
          riskLevel: mapSeverity(rule.severity),
          message: rule.violation_template ||
            "This clause must apply equally to both parties but is one-sided",
          detailedExplanation: rule.violation_template
            ? fillTemplateStatic(rule.violation_template, rule)
            : `This clause is one-sided and must be mutual under ${rule.statute_code}. Both parties should have equal rights under this provision.`,
        };
        break;
      }

      case "must_be_reasonable": {
        // Multiple conditions: check for forfeiture, penalty indicators
        conditions.push({
          type: "comparison",
          predicate: "has_forfeiture",
          operator: "==",
          value: true,
        });

        conclusion = {
          type: "violation",
          riskLevel: mapSeverity(rule.severity),
          message: rule.violation_template ||
            "This clause contains unreasonable terms (forfeiture/penalty)",
          detailedExplanation: rule.violation_template
            ? fillTemplateStatic(rule.violation_template, rule)
            : `This clause includes unreasonable forfeiture/penalty provisions that may be unenforceable under ${rule.statute_code}`,
        };
        break;
      }

      case "must_disclose": {
        // Check if required disclosure exists
        const predicate = inferFieldPredicate(rule.clause_type, rule.limit_unit);
        conditions.push({
          type: "existence",
          predicate,
          negate: true, // Must NOT exist = violation
        });

        conclusion = {
          type: "violation",
          riskLevel: mapSeverity(rule.severity),
          message: rule.violation_template ||
            `Required disclosure for ${rule.clause_type} is missing`,
          detailedExplanation: rule.violation_template
            ? fillTemplateStatic(rule.violation_template, rule)
            : `The document is missing a required disclosure under ${rule.statute_code}`,
        };
        break;
      }

      case "required": {
        const predicate = inferFieldPredicate(rule.clause_type, rule.limit_unit);
        conditions.push({
          type: "existence",
          predicate,
          negate: true, // Required but missing = violation
        });

        conclusion = {
          type: "violation",
          riskLevel: mapSeverity(rule.severity),
          message: rule.violation_template ||
            `Required clause '${rule.clause_type}' is missing`,
          detailedExplanation: rule.violation_template
            ? fillTemplateStatic(rule.violation_template, rule)
            : `A '${rule.clause_type}' clause is required under ${rule.statute_code} but was not found`,
        };
        break;
      }

      default:
        // Unknown rule type — skip
        continue;
    }

    const logicalRule: LogicalRule = {
      id: `R-${rule.jurisdiction.substring(0, 3).toUpperCase()}-${rule.clause_type.toUpperCase().substring(0, 6)}-${rule.id.substring(0, 4)}`,
      jurisdiction: rule.jurisdiction,
      documentType: rule.document_type,
      clauseType: rule.clause_type,
      name: `${rule.statute_name} — ${rule.clause_type.replace(/_/g, " ")}`,
      description: rule.notes || `Rule for ${rule.clause_type} under ${rule.statute_name}`,
      conditions,
      conclusion,
      statute: {
        code: rule.statute_code,
        text: rule.statute_text || rule.statute_name,
        url: undefined,
      },
      severity: mapSeverity(rule.severity),
      remedy: rule.fair_alternative || undefined,
      penalty: rule.penalty || undefined,
      priority: computePriority(rule),
    };

    compiled.push(logicalRule);
  }

  return compiled;
}

// ---- Fetch and compile from DB ----

export async function compileRulesFromDB(
  jurisdiction: string,
  documentType: string
): Promise<LogicalRule[]> {
  const cacheKey = `${jurisdiction}:${documentType}`;
  const cached = compiledRulesCache.get(cacheKey);
  if (cached) return cached;

  try {
    const supabase = await createClient();

    // Fetch rules matching jurisdiction (including ALL_INDIA) and document type
    const { data, error } = await supabase
      .from("structured_rules")
      .select("*")
      .in("jurisdiction", [jurisdiction, "ALL_INDIA", "all_india", "all"])
      .in("document_type", [documentType, "all"])
      .eq("is_active", true);

    if (error) {
      console.error("[Reasoning] Failed to fetch structured_rules:", error.message);
      return [];
    }

    const rules = (data as StructuredRule[]) || [];
    const compiled = compileRules(rules, jurisdiction, documentType);

    // Cache for 5 minutes
    compiledRulesCache.set(cacheKey, compiled);
    setTimeout(() => compiledRulesCache.delete(cacheKey), 5 * 60 * 1000);


    return compiled;
  } catch (err) {
    console.error("[Reasoning] compileRulesFromDB error:", err);
    return [];
  }
}

// ---- Helpers ----

function inferFieldPredicate(clauseType: string, unit: string | null): string {
  const unitLower = (unit || "").toLowerCase();
  const typeLower = clauseType.toLowerCase();

  // Specific mappings based on clause type + unit combinations
  const mappings: Record<string, Record<string, string>> = {
    security_deposit: {
      months: "deposit_months",
      months_of_rent: "deposit_months",
      "": "deposit_months",
    },
    notice_period: {
      days: "notice_period_days",
      months: "notice_period_months",
      "": "notice_period_days",
    },
    termination_notice: {
      days: "notice_period_days",
      months: "notice_period_months",
      "": "notice_period_days",
    },
    lock_in_period: {
      months: "lock_in_months",
      years: "lock_in_years",
      "": "lock_in_months",
    },
    lock_in: {
      months: "lock_in_months",
      years: "lock_in_years",
      "": "lock_in_months",
    },
    rent_escalation: {
      percent: "rent_escalation_percent",
      percentage: "rent_escalation_percent",
      "": "rent_escalation_percent",
    },
    non_compete: {
      months: "non_compete_months",
      years: "non_compete_years",
      "": "non_compete_months",
    },
    non_solicitation: {
      months: "non_solicitation_months",
      "": "non_solicitation_months",
    },
    training_bond: {
      months: "training_bond_months",
      years: "training_bond_years",
      lakh: "training_bond_amount",
      rupees: "training_bond_amount",
      "": "training_bond_months",
    },
    late_fees: {
      percent: "late_fee_percent",
      percentage: "late_fee_percent",
      "": "late_fee_percent",
    },
    late_payment_charges: {
      percent: "late_payment_percent",
      "": "late_payment_percent",
    },
    interest_rate: {
      percent: "interest_rate_percent",
      "": "interest_rate_percent",
    },
    prepayment_penalty: {
      percent: "prepayment_penalty_percent",
      "": "prepayment_penalty_percent",
    },
    processing_fees: {
      percent: "processing_fee_percent",
      "": "processing_fee_percent",
    },
    painting_charges: {
      months: "painting_charge_months",
      "": "painting_charge_amount",
    },
    probation: {
      months: "probation_months",
      "": "probation_months",
    },
  };

  const typeMap = mappings[typeLower];
  if (typeMap) {
    return typeMap[unitLower] || typeMap[""] || `${typeLower}_value`;
  }

  // Generic fallback
  if (unitLower) return `${typeLower}_${unitLower}`;
  return `${typeLower}_value`;
}

function mapSeverity(riskLevel: string): "illegal" | "dangerous" | "warning" | "info" | "safe" {
  switch (riskLevel.toLowerCase()) {
    case "illegal":
      return "illegal";
    case "dangerous":
      return "dangerous";
    case "warning":
      return "warning";
    case "safe":
      return "safe";
    default:
      return "warning";
  }
}

function computePriority(rule: StructuredRule): number {
  let priority = 50; // Base priority

  // Specific jurisdictions get higher priority than generic
  if (rule.jurisdiction !== "ALL_INDIA" && rule.jurisdiction !== "all_india" && rule.jurisdiction !== "all") {
    priority += 20;
  }

  // Higher severity = higher priority
  switch (rule.severity) {
    case "illegal":
      priority += 30;
      break;
    case "dangerous":
      priority += 20;
      break;
    case "warning":
      priority += 10;
      break;
    default:
      break;
  }

  // Rules with statute references get a boost
  if (rule.statute_code) priority += 5;
  if (rule.statute_text) priority += 5;

  return priority;
}

function fillTemplateStatic(template: string, rule: StructuredRule): string {
  return template
    .replace(/\{limit_value\}/g, String(rule.limit_value ?? "N/A"))
    .replace(/\{limit_unit\}/g, rule.limit_unit || "")
    .replace(/\{statute_code\}/g, rule.statute_code || "")
    .replace(/\{clause_type\}/g, rule.clause_type.replace(/_/g, " "))
    .replace(/\{jurisdiction\}/g, rule.jurisdiction)
    .replace(/\{max_value\}/g, String(rule.limit_value ?? "N/A"))
    .replace(/\{statute_name\}/g, rule.statute_name || "");
}
