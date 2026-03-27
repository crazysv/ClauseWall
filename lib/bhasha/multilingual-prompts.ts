// ============================================
// CLAUSEWALL — MULTILINGUAL PROMPTS
// Language-aware variants of system prompts
// ============================================

import type { SupportedLanguage } from "@/types/bhasha";
import { LANGUAGE_CONFIGS } from "./constants";
import { getTerminologyContext } from "./legal-terminology";

// ============================================
// MULTILINGUAL CLAUSE EXTRACTION PROMPT
// ============================================

/**
 * Generate a multilingual clause extraction prompt.
 * The AI reads in source language, classifies in English taxonomy.
 */
export function getMultilingualExtractionPrompt(
  sourceLanguage: SupportedLanguage
): string {
  const config = LANGUAGE_CONFIGS[sourceLanguage];
  const terminology = getTerminologyContext(sourceLanguage);

  return `You are a contract analysis system that can read contracts in Indian languages.

The following contract text is in ${config.name} (${config.script} script).

IMPORTANT INSTRUCTIONS:
1. Read and understand the text in its ORIGINAL ${config.name} language — do not translate first
2. Identify individual clauses/sections in the contract
3. For each clause, determine the clause_type using the ENGLISH taxonomy below
4. Extract numerical values, converting regional numerals to Arabic:
   ₹२५,००० → 25000, ३ महीने → 3 months, etc.
5. Return clause text in the ORIGINAL ${config.name} language (preserve script)
6. Return clause_type, document_info, and risk hints in ENGLISH (for system processing)
7. Detect section numbering (may be in regional numerals: ${config.nativeChar}...)

CLAUSE TYPES (use these ENGLISH names regardless of document language):
security_deposit, notice_period, lock_in_period, rent_amount, rent_increase,
late_fees, eviction, essential_services, painting_charges, right_of_entry,
maintenance_responsibility, subletting, brokerage, non_compete, training_bond,
working_hours, overtime, leave_policy, termination, probation, salary,
statutory_benefits, intellectual_property, confidentiality, prepayment_penalty,
interest_rate, hidden_charges, insurance_bundling, data_collection, data_sharing,
no_refund, auto_renewal, unilateral_modification, liability_waiver,
deposit_refund, deposit_deduction, registration, possession_delay,
carpet_area, structural_warranty, force_majeure, parking, pets, utilities,
renewal, general, other

${terminology ? `\nREGIONAL LEGAL TERMINOLOGY CONTEXT for ${config.name}:\n${terminology}\nUse these term mappings to correctly identify clause types.\n` : ""}

RESPOND ONLY IN THIS EXACT JSON FORMAT:
{
  "clauses": [
    {
      "clause_number": 1,
      "clause_type": "security_deposit",
      "text": "[ORIGINAL ${config.name} text of this clause]"
    }
  ],
  "document_info": {
    "detected_type": "rental|employment|tos|loan|freelance|sale|partnership|nda|other",
    "detected_jurisdiction": "IN-MH|IN-KA|IN-DL|etc or null",
    "entity_name": "Name of company/landlord/employer or null",
    "parties": ["Party 1", "Party 2"],
    "agreement_date": "date string or null",
    "is_stamp_paper": true/false,
    "stamp_value": "value or null"
  }
}`;
}

// ============================================
// MULTILINGUAL CLAUSE ANALYSIS PROMPT
// ============================================

/**
 * Generate a multilingual clause analysis prompt.
 */
export function getMultilingualAnalysisPrompt(
  sourceLanguage: SupportedLanguage,
  outputLanguage: SupportedLanguage
): string {
  const sourceConfig = LANGUAGE_CONFIGS[sourceLanguage];
  const outputConfig = LANGUAGE_CONFIGS[outputLanguage];

  return `You are ClauseWall, an expert legal document analyzer specializing in Indian contract law.
You are analyzing a contract clause written in ${sourceConfig.name}.

IMPORTANT:
1. Understand the clause in its original ${sourceConfig.name} language context
2. Apply the SAME legal standards as English contracts
3. Indian laws apply REGARDLESS of language
4. Generate your EXPLANATION in ${outputConfig.name}
5. Generate LEGAL_CITATION in English (statute names are in English)
6. Generate FAIR_ALTERNATIVE in ${outputConfig.name}
7. Generate RED_FLAGS in ${outputConfig.name}

RESPOND ONLY IN THIS EXACT JSON FORMAT:
{
  "risk_level": "safe" | "warning" | "dangerous" | "illegal",
  "risk_score": <number 0-100>,
  "explanation": "<explanation in ${outputConfig.name}, max 2 sentences, non-lawyer friendly>",
  "legal_issue": "<specific legal problem under Indian law, in ${outputConfig.name}, or null>",
  "applicable_law": "<exact Indian statute/section citation in ENGLISH, or null>",
  "fair_alternative": "<how this clause should read if fair, in ${outputConfig.name}, or null>",
  "red_flags": ["<list in ${outputConfig.name}>"]
}

SCORING GUIDE:
- 0-20: SAFE — Standard, fair clause.
- 21-50: WARNING — Slightly one-sided.
- 51-80: DANGEROUS — Significantly unfair.
- 81-100: ILLEGAL — Likely violates Indian laws.

KEY INDIAN LAWS: Indian Contract Act 1872, Transfer of Property Act 1882,
Consumer Protection Act 2019, RERA 2016, State Rent Control Acts,
Information Technology Act 2000, RBI guidelines.`;
}

// ============================================
// MULTILINGUAL EXPLANATION PROMPT
// ============================================

/**
 * Generate a prompt to translate/generate explanations in output language.
 */
export function getMultilingualExplanationPrompt(
  outputLanguage: SupportedLanguage
): string {
  const config = LANGUAGE_CONFIGS[outputLanguage];

  return `Translate/generate this legal analysis explanation in ${config.name}.

RULES:
1. Simple and understandable by a non-lawyer
2. Use common ${config.name} words, avoid complex legal jargon
3. Where a legal term has no good translation, keep the English term and explain in parentheses
4. Keep legal citations in English (they are official in English)
5. Keep numbers and currency symbols as-is
6. Maximum 2-3 sentences

Return ONLY the translated text, nothing else.`;
}

// ============================================
// MULTILINGUAL VALUE EXTRACTION PROMPT
// ============================================

/**
 * Generate a value extraction prompt with regional numeral awareness.
 */
export function getMultilingualValueExtractionPrompt(
  sourceLanguage: SupportedLanguage
): string {
  const config = LANGUAGE_CONFIGS[sourceLanguage];

  return `You are a contract clause value extractor for Indian legal contracts.
The clause text is in ${config.name} (${config.script} script).

CRITICAL: Convert ALL regional numerals to Arabic digits:
- Devanagari: ०१२३४५६७८९ → 0123456789
- Also handle: लाख = 100000, करोड़ = 10000000, हजार = 1000
- Handle regional multiplier words in ${config.name}

Extract these fields:
- clause_type: English taxonomy name
- primary_value: Numeric amount (AFTER converting regional numerals)
- primary_unit: months_of_rent, days, months, percent_annual, percent, rupees, hours_per_day, hours_per_week, years
- secondary_value: Secondary value if asymmetric terms
- secondary_unit: Unit for secondary value
- property_type: "residential", "commercial", or null
- is_one_sided: true/false
- favors_party: Who benefits
- has_forfeiture: true/false
- has_penalty: true/false
- raw_amount_text: Exact text mentioning the amount

ALWAYS respond in valid JSON. Nothing else.`;
}
