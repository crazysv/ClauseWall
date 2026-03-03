// ============================================
// VALUE EXTRACTOR
// Lightweight AI call to extract structured values
// from clause text. Uses fewer tokens than full analysis.
// ============================================

import { callGroq } from "./groq-client";
import type { ExtractedValues } from "@/types";

const VALUE_EXTRACTION_PROMPT = `You are a contract clause value extractor for Indian legal contracts. 
Your ONLY job is to extract structured numeric values and metadata from contract clauses.

Extract these fields:
- clause_type: The category (security_deposit, notice_period, lock_in_period, rent_increase, late_fees, eviction, essential_services, painting_charges, right_of_entry, maintenance_responsibility, subletting, brokerage, non_compete, training_bond, working_hours, overtime, leave_policy, termination, probation, salary, statutory_benefits, intellectual_property, confidentiality, prepayment_penalty, interest_rate, hidden_charges, insurance_bundling, data_collection, data_sharing, no_refund, auto_renewal, unilateral_modification, liability_waiver, deposit_refund, deposit_deduction, rent_increase, lock_in_forfeiture, notice_period_landlord, force_majeure, parking, pets, utilities, renewal, registration, rera_registration, possession_delay, carpet_area, structural_warranty, other)
- primary_value: The main numeric amount (e.g., 10 for "10 months deposit", 15 for "15% increase"). NULL if no specific number.
- primary_unit: Unit of the value (months_of_rent, days, months, percent_annual, percent, rupees, hours_per_day, hours_per_week, years). NULL if no specific unit.
- secondary_value: Secondary numeric value if clause has asymmetric terms (e.g., landlord's notice period when different from tenant's). NULL if not applicable.
- secondary_unit: Unit for secondary value. NULL if not applicable.
- property_type: "residential", "commercial", or null
- is_one_sided: true if the clause clearly favors one party over the other
- favors_party: Who benefits — "landlord", "tenant", "employer", "employee", "company", "consumer", "lender", "borrower", or null
- has_forfeiture: true if clause mentions forfeiting money/deposit entirely
- has_penalty: true if clause mentions financial penalty
- raw_amount_text: The exact text mentioning the amount (e.g., "10 months security deposit")

CRITICAL RULES:
1. Be PRECISE with numbers. "Ten months" = 10. "Six months" = 6.
2. If no specific numeric value is mentioned, set primary_value to null.
3. For percentage increases, extract the percentage number.
4. For late fees, extract the per-day or per-month amount in rupees.
5. ALWAYS respond in valid JSON. Nothing else.`;

/**
 * Extract structured values from a clause using lightweight AI
 */
export async function extractValues(
  clauseText: string,
  clauseType: string,
  documentType: string
): Promise<ExtractedValues> {
  try {
    const response = await callGroq(
      [
        { role: "system", content: VALUE_EXTRACTION_PROMPT },
        {
          role: "user",
          content: `Extract values from this ${documentType} clause:

Clause type hint: ${clauseType}

Clause text:
"${clauseText}"`,
        },
      ],
      {
        temperature: 0.0, // Deterministic for value extraction
        maxTokens: 512,   // Much fewer tokens needed
      }
    );

    const parsed = JSON.parse(response);

    return {
      clause_type: parsed.clause_type || clauseType,
      primary_value: parsed.primary_value != null ? Number(parsed.primary_value) : null,
      primary_unit: parsed.primary_unit || null,
      secondary_value: parsed.secondary_value != null ? Number(parsed.secondary_value) : null,
      secondary_unit: parsed.secondary_unit || null,
      property_type: parsed.property_type || null,
      is_one_sided: Boolean(parsed.is_one_sided),
      favors_party: parsed.favors_party || null,
      has_forfeiture: Boolean(parsed.has_forfeiture),
      has_penalty: Boolean(parsed.has_penalty),
      raw_amount_text: parsed.raw_amount_text || null,
    };
  } catch (error) {
    console.error("[ClauseWall] Value extraction failed:", error);

    // Return basic fallback — don't crash the pipeline
    return {
      clause_type: clauseType,
      primary_value: null,
      primary_unit: null,
      secondary_value: null,
      secondary_unit: null,
      property_type: null,
      is_one_sided: false,
      favors_party: null,
      has_forfeiture: false,
      has_penalty: false,
      raw_amount_text: null,
    };
  }
}