// ============================================
// CLAUSEWALL — BILINGUAL FORMATTER
// Side-by-side original + translated output
// ============================================

import type {
  SupportedLanguage,
  BilingualText,
  BilingualClause,
  BilingualReport,
  TranslationResult,
} from "@/types/bhasha";
import { translateText } from "./translator";

// ============================================
// FORMAT BILINGUAL TEXT
// ============================================

/**
 * Create a BilingualText from source text.
 * If source is English, no translation needed.
 * If source is non-English, translate to English.
 */
export async function createBilingualText(
  text: string,
  sourceLanguage: SupportedLanguage
): Promise<BilingualText> {
  if (sourceLanguage === "en") {
    return {
      source_language: "en",
      source_text: text,
      english_text: text,
      is_auto_translated: false,
    };
  }

  const translation = await translateText(text, sourceLanguage, "en");

  return {
    source_language: sourceLanguage,
    source_text: text,
    english_text: translation.translated_text,
    is_auto_translated: true,
  };
}

/**
 * Create BilingualText when you already have both language versions.
 */
export function makeBilingualText(
  sourceText: string,
  englishText: string,
  sourceLanguage: SupportedLanguage,
  isAutoTranslated: boolean = true
): BilingualText {
  return {
    source_language: sourceLanguage,
    source_text: sourceText,
    english_text: englishText,
    is_auto_translated: isAutoTranslated,
  };
}

// ============================================
// FORMAT BILINGUAL CLAUSE
// ============================================

/**
 * Convert a clause analysis result to bilingual format.
 */
export async function formatBilingualClause(
  clause: {
    clause_number: number;
    clause_type: string;
    original_text: string;
    explanation: string;
    fair_alternative: string | null;
    red_flags: string[];
    risk_level: string;
    risk_score: number;
  },
  sourceLanguage: SupportedLanguage
): Promise<BilingualClause> {
  const [originalBi, explanationBi, fairAltBi, ...redFlagsBi] = await Promise.all([
    createBilingualText(clause.original_text, sourceLanguage),
    createBilingualText(clause.explanation, sourceLanguage),
    clause.fair_alternative
      ? createBilingualText(clause.fair_alternative, sourceLanguage)
      : Promise.resolve(null),
    ...clause.red_flags.map(flag => createBilingualText(flag, sourceLanguage)),
  ]);

  return {
    clause_number: clause.clause_number,
    clause_type: clause.clause_type,
    original_text: originalBi,
    explanation: explanationBi,
    fair_alternative: fairAltBi,
    red_flags: redFlagsBi as BilingualText[],
    risk_level: clause.risk_level,
    risk_score: clause.risk_score,
  };
}

// ============================================
// FORMAT BILINGUAL REPORT
// ============================================

/**
 * Create a bilingual report from a document analysis.
 */
export async function formatBilingualReport(
  summary: string,
  clauses: {
    clause_number: number;
    clause_type: string;
    original_text: string;
    explanation: string;
    fair_alternative: string | null;
    red_flags: string[];
    risk_level: string;
    risk_score: number;
  }[],
  sourceLanguage: SupportedLanguage
): Promise<BilingualReport> {
  const summaryBi = await createBilingualText(summary, sourceLanguage);

  // Process clauses in batches of 3 to avoid overwhelming APIs
  const bilingualClauses: BilingualClause[] = [];
  for (let i = 0; i < clauses.length; i += 3) {
    const batch = clauses.slice(i, i + 3);
    const results = await Promise.all(
      batch.map(c => formatBilingualClause(c, sourceLanguage))
    );
    bilingualClauses.push(...results);
  }

  return {
    summary: summaryBi,
    clauses: bilingualClauses,
    language_pair: {
      source: sourceLanguage,
      target: "en",
    },
  };
}
