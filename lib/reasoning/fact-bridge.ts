// ============================================
// FACT BRIDGE
// Converts ExtractedValues → Fact[] for the engine
// ============================================

import type { ExtractedValues } from "@/types";
import type { Fact, FactSource } from "./types";

// ---- UUID generator ----

function generateFactId(): string {
  return "fact_" + Math.random().toString(36).substring(2, 9) + Date.now().toString(36);
}

// ---- Main bridge function ----

export function extractedValuesToFacts(
  values: ExtractedValues,
  jurisdiction: string,
  documentType: string,
  clauseText: string,
  clauseIndex?: number
): Fact[] {
  const facts: Fact[] = [];
  const now = new Date().toISOString();

  // 1. Jurisdiction (user provided, always reliable)
  facts.push({
    id: generateFactId(),
    predicate: "jurisdiction",
    value: jurisdiction,
    source: {
      type: "user_input",
      confidence: 1.0,
      extractionMethod: "user_provided",
    },
    timestamp: now,
  });

  // 2. Document type (user provided)
  facts.push({
    id: generateFactId(),
    predicate: "document_type",
    value: documentType,
    source: {
      type: "user_input",
      confidence: 1.0,
      extractionMethod: "user_provided",
    },
    timestamp: now,
  });

  // 3. Primary value (AI extracted)
  if (values.primary_value !== null && values.primary_value !== undefined) {
    const predicate = inferPredicate(
      values.clause_type,
      values.primary_unit || ""
    );

    const aiSource: FactSource = {
      type: "extraction",
      clauseText,
      clauseIndex,
      confidence: 0.9,
      extractionMethod: "groq_llama3",
    };

    facts.push({
      id: generateFactId(),
      predicate,
      value: values.primary_value,
      source: aiSource,
      timestamp: now,
    });
  }

  // 4. Secondary value (if present)
  if (values.secondary_value !== null && values.secondary_value !== undefined && values.secondary_unit) {
    const predicate = `${values.clause_type}_secondary_${values.secondary_unit}`.toLowerCase();

    facts.push({
      id: generateFactId(),
      predicate,
      value: values.secondary_value,
      source: {
        type: "extraction",
        clauseText,
        clauseIndex,
        confidence: 0.8,
        extractionMethod: "groq_llama3",
      },
      timestamp: now,
    });
  }

  // 5. Boolean flags
  const booleanFacts: { predicate: string; value: boolean }[] = [
    { predicate: "is_one_sided", value: values.is_one_sided },
    { predicate: "has_forfeiture", value: values.has_forfeiture },
    { predicate: "has_penalty", value: values.has_penalty },
  ];

  for (const bf of booleanFacts) {
    facts.push({
      id: generateFactId(),
      predicate: bf.predicate,
      value: bf.value,
      source: {
        type: "extraction",
        clauseText,
        clauseIndex,
        confidence: 0.85,
        extractionMethod: "groq_llama3",
      },
      timestamp: now,
    });
  }

  // 6. Property type (if present)
  if (values.property_type) {
    facts.push({
      id: generateFactId(),
      predicate: "property_type",
      value: values.property_type,
      source: {
        type: "extraction",
        clauseText,
        clauseIndex,
        confidence: 0.85,
        extractionMethod: "groq_llama3",
      },
      timestamp: now,
    });
  }

  // 7. Clause type itself as a fact
  if (values.clause_type) {
    facts.push({
      id: generateFactId(),
      predicate: "clause_type",
      value: values.clause_type,
      source: {
        type: "extraction",
        clauseText,
        clauseIndex,
        confidence: 0.9,
        extractionMethod: "groq_llama3",
      },
      timestamp: now,
    });

    // Also assert a "clause_type_is_X" flag for prohibited checks
    facts.push({
      id: generateFactId(),
      predicate: `clause_type_is_${values.clause_type}`,
      value: true,
      source: {
        type: "derived",
        clauseText,
        clauseIndex,
        confidence: 0.9,
        extractionMethod: "derived",
      },
      timestamp: now,
    });
  }

  // 8. Favors party (if present)
  if (values.favors_party) {
    facts.push({
      id: generateFactId(),
      predicate: "favors_party",
      value: values.favors_party,
      source: {
        type: "extraction",
        clauseText,
        clauseIndex,
        confidence: 0.8,
        extractionMethod: "groq_llama3",
      },
      timestamp: now,
    });
  }

  // 9. Raw amount text (for reference)
  if (values.raw_amount_text) {
    facts.push({
      id: generateFactId(),
      predicate: "raw_amount_text",
      value: values.raw_amount_text,
      source: {
        type: "extraction",
        clauseText,
        clauseIndex,
        confidence: 0.95,
        extractionMethod: "groq_llama3",
      },
      timestamp: now,
    });
  }

  return facts;
}

// ---- Predicate inference ----

export function inferPredicate(clauseType: string, unit: string): string {
  const typeLower = (clauseType || "").toLowerCase().replace(/\s+/g, "_");
  const unitLower = (unit || "").toLowerCase().replace(/\s+/g, "_");

  // Specific well-known mappings
  const mappings: Record<string, Record<string, string>> = {
    security_deposit: {
      months: "deposit_months",
      months_of_rent: "deposit_months",
      month: "deposit_months",
      "": "deposit_months",
    },
    rent_payment: {
      rupees: "rent_amount",
      "": "rent_amount",
    },
    notice_period: {
      days: "notice_period_days",
      day: "notice_period_days",
      months: "notice_period_months",
      month: "notice_period_months",
      "": "notice_period_days",
    },
    termination_notice: {
      days: "notice_period_days",
      months: "notice_period_months",
      "": "notice_period_days",
    },
    lock_in_period: {
      months: "lock_in_months",
      month: "lock_in_months",
      years: "lock_in_years",
      year: "lock_in_years",
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
      "%": "rent_escalation_percent",
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
    maintenance_charges: {
      rupees: "maintenance_amount",
      percent: "maintenance_percent",
      "": "maintenance_amount",
    },
    probation: {
      months: "probation_months",
      "": "probation_months",
    },
    compensation_salary: {
      lpa: "salary_lpa",
      rupees: "salary_amount",
      "": "salary_amount",
    },
    variable_pay_bonus: {
      percent: "variable_pay_percent",
      "": "variable_pay_percent",
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
