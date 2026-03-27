// ============================================
// CLAUSEWALL — NUMERAL CONVERTER
// Regional numeral systems → Arabic numerals
// + regional number word parsing
// ============================================

import type { IndianScript, SupportedLanguage, RegionalNumber } from "@/types/bhasha";
import { NUMERAL_SYSTEMS, REGIONAL_NUMBER_WORDS, REGIONAL_UNIT_WORDS } from "./constants";
import { detectScript } from "./script-utils";

// ============================================
// BUILD DIGIT LOOKUP MAP
// ============================================

const DIGIT_MAP = new Map<string, string>();

for (const system of Object.values(NUMERAL_SYSTEMS)) {
  for (let i = 0; i < system.digits.length; i++) {
    DIGIT_MAP.set(system.digits[i], String(i));
  }
}

// ============================================
// NUMERAL CONVERSION
// ============================================

/**
 * Convert regional numerals in text to Arabic digits.
 * "₹२५,०००" → "₹25,000"
 * "३ महीने" → "3 महीने"
 * Mixed: "₹२५,000" → "₹25,000"
 */
export function convertNumerals(text: string): string {
  let result = "";
  for (const char of text) {
    const arabicDigit = DIGIT_MAP.get(char);
    result += arabicDigit !== undefined ? arabicDigit : char;
  }
  return result;
}

/**
 * Convert numerals for a specific known script.
 * Slightly faster than generic since it only checks one digit set.
 */
export function convertNumeralsForScript(text: string, script: IndianScript): string {
  const system = NUMERAL_SYSTEMS[script];
  if (!system) return text;

  let result = text;
  for (let i = 0; i < system.digits.length; i++) {
    result = result.split(system.digits[i]).join(String(i));
  }
  return result;
}

// ============================================
// REGIONAL NUMBER PARSING
// ============================================

/**
 * Parse a regional number expression to a numeric value.
 *
 * Examples:
 * - "₹२५,०००" → 25000
 * - "2.5 लाख" → 250000
 * - "₹१५ हजार" → 15000
 * - "३ करोड़" → 30000000
 * - "పాతిక వేలు" → 25000  (handled via common words)
 * - "तीन महीने" → 3 (with unit: "months")
 */
export function parseRegionalNumber(
  text: string,
  language?: SupportedLanguage
): RegionalNumber {
  // Step 1: Convert regional digits to Arabic
  const converted = convertNumerals(text.trim());

  // Step 2: Extract base number
  const numberMatch = converted.match(/[\d,]+\.?\d*/);
  let baseValue = 0;
  let confidence = 0.5;

  if (numberMatch) {
    baseValue = parseFloat(numberMatch[0].replace(/,/g, ""));
    confidence = 0.9;
  } else {
    // Try Hindi number words
    const wordValue = parseHindiNumberWord(converted);
    if (wordValue !== null) {
      baseValue = wordValue;
      confidence = 0.7;
    }
  }

  // Step 3: Apply multiplier words (lakh, crore, thousand)
  const detectedLang = language || detectLanguageFromText(text);
  const numberWords = REGIONAL_NUMBER_WORDS[detectedLang] || REGIONAL_NUMBER_WORDS["hi"];

  if (numberWords) {
    for (const [word, multiplier] of Object.entries(numberWords)) {
      if (converted.includes(word) || text.includes(word)) {
        baseValue = baseValue === 0 ? multiplier : baseValue * multiplier;
        confidence = Math.max(confidence, 0.85);
        break;
      }
    }
  }

  // Step 4: Extract unit if present
  const unitWords = REGIONAL_UNIT_WORDS[detectedLang] || REGIONAL_UNIT_WORDS["hi"];
  let unit: string | undefined;

  if (unitWords) {
    for (const [word, englishUnit] of Object.entries(unitWords)) {
      if (text.includes(word)) {
        unit = englishUnit;
        break;
      }
    }
  }

  return {
    original_text: text,
    parsed_value: baseValue,
    unit,
    confidence,
  };
}

// ============================================
// HINDI NUMBER WORDS
// ============================================

const HINDI_NUMBER_WORDS: Record<string, number> = {
  "एक": 1, "दो": 2, "तीन": 3, "चार": 4, "पांच": 5, "पाँच": 5,
  "छह": 6, "छः": 6, "सात": 7, "आठ": 8, "नौ": 9, "दस": 10,
  "ग्यारह": 11, "बारह": 12, "तेरह": 13, "चौदह": 14, "पंद्रह": 15,
  "सोलह": 16, "सत्रह": 17, "अठारह": 18, "उन्नीस": 19, "बीस": 20,
  "पच्चीस": 25, "तीस": 30, "पैंतीस": 35, "चालीस": 40, "पचास": 50,
  "साठ": 60, "सत्तर": 70, "अस्सी": 80, "नब्बे": 90, "सौ": 100,
  "डेढ़": 1.5, "ढाई": 2.5, "साढ़े": 0, // prefix: "साढ़े तीन" = 3.5
};

function parseHindiNumberWord(text: string): number | null {
  const words = text.split(/\s+/);

  for (const word of words) {
    const cleaned = word.replace(/[।,.\-;:!?'"()₹]/g, "");
    if (HINDI_NUMBER_WORDS[cleaned] !== undefined) {
      const val = HINDI_NUMBER_WORDS[cleaned];

      // Handle "साढ़े" prefix (adds 0.5 to next number)
      if (cleaned === "साढ़े") {
        const nextWord = words[words.indexOf(word) + 1]?.replace(/[।,.\-;:!?'"()₹]/g, "");
        if (nextWord && HINDI_NUMBER_WORDS[nextWord]) {
          return HINDI_NUMBER_WORDS[nextWord] + 0.5;
        }
        continue;
      }

      return val;
    }
  }

  return null;
}

// ============================================
// HELPER — simple lang detect from text
// ============================================

function detectLanguageFromText(text: string): string {
  const script = detectScript(text);
  const scriptToLang: Record<string, string> = {
    devanagari: "hi", bengali: "bn", tamil: "ta", telugu: "te",
    kannada: "kn", gujarati: "gu", malayalam: "ml", gurmukhi: "pa",
    odia: "or", nastaliq: "ur", latin: "en", assamese: "as",
  };
  return scriptToLang[script] || "hi";
}

// ============================================
// BATCH CONVERSION
// ============================================

/**
 * Pre-process an entire document text:
 * 1. Convert all regional numerals → Arabic
 * 2. Normalize number formats
 */
export function preprocessDocumentNumerals(text: string): string {
  let processed = convertNumerals(text);

  // Normalize lakh/crore formats: "2,50,000" → "250000" (Indian format)
  // Keep standard comma-separated format
  processed = processed.replace(
    /(\d{1,2}),(\d{2}),(\d{3})/g,
    (_, a, b, c) => String(Number(`${a}${b}${c}`))
  );

  return processed;
}
