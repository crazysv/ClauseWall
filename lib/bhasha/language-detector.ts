// ============================================
// CLAUSEWALL — LANGUAGE DETECTOR
// Auto-detect language from text using
// Unicode ranges + heuristics + Groq fallback
// ============================================

import type { SupportedLanguage, IndianScript, LanguageDetectionResult } from "@/types/bhasha";
import { callGroq } from "@/lib/ai/groq-client";
import {
  LANGUAGE_CONFIGS,
  HINDI_DISTINCTIVE_WORDS,
  MARATHI_DISTINCTIVE_WORDS,
  MIN_CHARS_FOR_DETECTION,
  DETECTION_CONFIDENCE_HIGH,
  DETECTION_CONFIDENCE_MEDIUM,
  DETECTION_CONFIDENCE_LOW,
  MIXED_SCRIPT_THRESHOLD,
} from "./constants";
import { getScriptDistribution, detectScript } from "./script-utils";

// ============================================
// SCRIPT → LANGUAGE MAPPING
// ============================================

const UNAMBIGUOUS_SCRIPT_LANGUAGES: Partial<Record<IndianScript, SupportedLanguage>> = {
  tamil: "ta",
  telugu: "te",
  kannada: "kn",
  gujarati: "gu",
  malayalam: "ml",
  gurmukhi: "pa",
  odia: "or",
  nastaliq: "ur",
  latin: "en",
};

// ============================================
// MAIN DETECTION FUNCTION
// ============================================

/**
 * Detect the language of a text string.
 * Uses Unicode ranges (fast) → word frequency heuristics → Groq fallback.
 */
export async function detectLanguage(text: string): Promise<LanguageDetectionResult> {
  // Default to English
  const defaultResult: LanguageDetectionResult = {
    primary_language: "en",
    confidence: 1.0,
    secondary_languages: [],
    is_mixed: false,
    script_detected: "latin",
    detection_method: "unicode_ranges",
  };

  if (!text || text.length < MIN_CHARS_FOR_DETECTION) {
    return defaultResult;
  }

  // ---- Step 1: Script detection via Unicode ranges ----
  const distribution = getScriptDistribution(text);
  const totalScriptChars = Array.from(distribution.values()).reduce((a, b) => a + b, 0);

  if (totalScriptChars === 0) {
    return defaultResult;
  }

  // Sort scripts by count
  const sortedScripts = Array.from(distribution.entries())
    .sort((a, b) => b[1] - a[1]);

  const primaryScript = sortedScripts[0][0];
  const primaryCount = sortedScripts[0][1];
  const primaryPercentage = primaryCount / totalScriptChars;

  // Check for mixed scripts
  const secondaryLanguages: { language: SupportedLanguage; percentage: number }[] = [];
  const is_mixed = sortedScripts.length > 1 &&
    sortedScripts.some((s, i) => i > 0 && s[1] / totalScriptChars > MIXED_SCRIPT_THRESHOLD);

  for (let i = 1; i < sortedScripts.length; i++) {
    const [script, count] = sortedScripts[i];
    const pct = count / totalScriptChars;
    if (pct > 0.05) { // Only include scripts >5%
      const lang = UNAMBIGUOUS_SCRIPT_LANGUAGES[script];
      if (lang) {
        secondaryLanguages.push({ language: lang, percentage: pct });
      }
    }
  }

  // ---- Step 2: Unambiguous script → language mapping ----
  // For scripts that only belong to one language
  if (primaryScript !== "devanagari" && primaryScript !== "bengali") {
    const language = UNAMBIGUOUS_SCRIPT_LANGUAGES[primaryScript];
    if (language) {
      const confidence = primaryPercentage > 0.8
        ? DETECTION_CONFIDENCE_HIGH
        : primaryPercentage > 0.6
          ? DETECTION_CONFIDENCE_MEDIUM
          : DETECTION_CONFIDENCE_LOW;

      return {
        primary_language: language,
        confidence,
        secondary_languages: secondaryLanguages,
        is_mixed,
        script_detected: primaryScript,
        detection_method: "unicode_ranges",
      };
    }
  }

  // ---- Step 3: Devanagari → Hindi vs Marathi disambiguation ----
  if (primaryScript === "devanagari") {
    const language = disambiguateDevanagari(text);
    const confidence = primaryPercentage > 0.8
      ? DETECTION_CONFIDENCE_HIGH
      : DETECTION_CONFIDENCE_MEDIUM;

    return {
      primary_language: language,
      confidence,
      secondary_languages: secondaryLanguages,
      is_mixed,
      script_detected: "devanagari",
      detection_method: "word_frequency",
    };
  }

  // ---- Step 4: Bengali script → Bengali vs Assamese ----
  if (primaryScript === "bengali") {
    const language = disambiguateBengali(text);
    const confidence = primaryPercentage > 0.8
      ? DETECTION_CONFIDENCE_HIGH
      : DETECTION_CONFIDENCE_MEDIUM;

    return {
      primary_language: language,
      confidence,
      secondary_languages: secondaryLanguages,
      is_mixed,
      script_detected: "bengali",
      detection_method: "word_frequency",
    };
  }

  // ---- Step 5: Groq fallback for truly ambiguous cases ----
  try {
    const groqResult = await detectLanguageViaGroq(text.substring(0, 500));
    return {
      ...groqResult,
      secondary_languages: secondaryLanguages,
      is_mixed,
    };
  } catch {
    // If even Groq fails, default to English
    return defaultResult;
  }
}

// ============================================
// DEVANAGARI DISAMBIGUATION
// ============================================

function disambiguateDevanagari(text: string): SupportedLanguage {
  const words = text.split(/\s+/).map(w => w.replace(/[।,.\-;:!?'"()]/g, ""));

  let hindiScore = 0;
  let marathiScore = 0;

  for (const word of words) {
    if (HINDI_DISTINCTIVE_WORDS.has(word)) hindiScore++;
    if (MARATHI_DISTINCTIVE_WORDS.has(word)) marathiScore++;
  }

  // If clear winner
  if (marathiScore > hindiScore * 1.5 && marathiScore >= 3) return "mr";
  if (hindiScore > marathiScore * 1.5 && hindiScore >= 3) return "hi";

  // Check for Maharashtra-specific context
  const maharashtraPattern = /महाराष्ट्र|मुंबई|पुणे|नागपूर|ठाणे|करारनामा|भाडेकरू|नोंदणी/;
  if (maharashtraPattern.test(text)) return "mr";

  // Default to Hindi (more common)
  return "hi";
}

// ============================================
// BENGALI DISAMBIGUATION
// ============================================

function disambiguateBengali(text: string): SupportedLanguage {
  // Assamese-specific characters and words
  const assamesePatterns = /[\u09F0\u09F1]|অসম|গুৱাহাটী|ৰ|ৱ/;
  if (assamesePatterns.test(text)) return "as";

  return "bn";
}

// ============================================
// GROQ FALLBACK
// ============================================

async function detectLanguageViaGroq(text: string): Promise<LanguageDetectionResult> {
  const response = await callGroq(
    [
      {
        role: "system",
        content: `You are a language detection system. Given a text, identify the language.
Return ONLY valid JSON: { "language": "<ISO 639-1 code>", "confidence": <0-1> }
Supported codes: hi, mr, bn, ta, te, kn, gu, ml, pa, or, as, ur, en`,
      },
      {
        role: "user",
        content: `What language is this text in?\n\n"${text}"`,
      },
    ],
    { temperature: 0.0, maxTokens: 64 }
  );

  const parsed = JSON.parse(response);
  const langCode = parsed.language as SupportedLanguage;

  // Validate code
  if (!LANGUAGE_CONFIGS[langCode]) {
    throw new Error(`Invalid language code from Groq: ${langCode}`);
  }

  return {
    primary_language: langCode,
    confidence: Number(parsed.confidence) || DETECTION_CONFIDENCE_LOW,
    secondary_languages: [],
    is_mixed: false,
    script_detected: LANGUAGE_CONFIGS[langCode].script,
    detection_method: "groq_fallback",
  };
}

// ============================================
// QUICK DETECTION (sync, no API call)
// ============================================

/**
 * Quick synchronous language detection using Unicode ranges only.
 * No API calls. Use when speed matters and approximate result is fine.
 */
export function detectLanguageQuick(text: string): {
  language: SupportedLanguage;
  script: IndianScript;
  confidence: number;
} {
  if (!text || text.length < MIN_CHARS_FOR_DETECTION) {
    return { language: "en", script: "latin", confidence: 1.0 };
  }

  const script = detectScript(text);

  if (script === "devanagari") {
    return { language: disambiguateDevanagari(text), script, confidence: 0.80 };
  }

  if (script === "bengali") {
    return { language: disambiguateBengali(text), script, confidence: 0.80 };
  }

  const language = UNAMBIGUOUS_SCRIPT_LANGUAGES[script] || "en";
  return { language, script, confidence: 0.90 };
}
