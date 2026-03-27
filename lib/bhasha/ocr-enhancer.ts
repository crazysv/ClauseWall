// ============================================
// CLAUSEWALL — OCR ENHANCER
// Enhanced multilingual OCR prompts for Gemini
// ============================================

import type { SupportedLanguage, MultilingualOCRResult } from "@/types/bhasha";
import { LANGUAGE_CONFIGS } from "./constants";
import { detectLanguageQuick } from "./language-detector";

// ============================================
// ENHANCED OCR PROMPT
// ============================================

/**
 * Generate an enhanced OCR prompt for Gemini with language hints.
 */
export function getMultilingualOCRPrompt(
  languageHint?: SupportedLanguage,
  isHandwritten?: boolean
): string {
  const langSection = languageHint && languageHint !== "en"
    ? `This document is written in ${LANGUAGE_CONFIGS[languageHint].name} using ${LANGUAGE_CONFIGS[languageHint].script} script.`
    : "Auto-detect the language and script of this document.";

  const handwrittenSection = isHandwritten
    ? `This is a HANDWRITTEN document. Pay extra attention to:
- Letter forms that may vary from printed text
- Spacing between words
- Inconsistent character sizes
- Ink smudges or unclear marks`
    : "";

  return `Extract ALL text from this document image.

${langSection}
${handwrittenSection}

CRITICAL INSTRUCTIONS:
1. Preserve the ORIGINAL script — do NOT transliterate or translate to English
2. Preserve original formatting (paragraphs, numbered lists, tables)
3. For mixed-language text, preserve BOTH languages as they appear
4. For unclear/ambiguous characters, provide best guess and mark with [?]
5. Preserve regional numerals as-is (do not convert १२३ to 123)
6. For stamps, seals, or watermarks, note their presence but focus on body text
7. If handwritten and a word is illegible, write [illegible] in that position
8. Detect and preserve section/clause numbering (may be in regional numerals: १, २, ३ or ௧, ௨, ௩)
9. For legal documents, pay special attention to:
   - Party names
   - Dates
   - Monetary amounts
   - Duration/period mentions
   - Signature blocks

Return the extracted text maintaining original layout as closely as possible.`;
}

// ============================================
// POST-PROCESS OCR RESULT
// ============================================

/**
 * Post-process OCR extracted text.
 * Detects language, calculates confidence.
 */
export function postProcessOCR(
  extractedText: string,
  languageHint?: SupportedLanguage
): MultilingualOCRResult {
  if (!extractedText || extractedText.trim().length < 10) {
    return {
      text: extractedText || "",
      language_detected: languageHint || "en",
      confidence: 0,
      uncertain_regions: [],
    };
  }

  // Detect language from extracted text
  const detection = detectLanguageQuick(extractedText);
  const language = languageHint || detection.language;

  // Calculate confidence based on uncertain markers
  const uncertainMarkers = (extractedText.match(/\[\?\]/g) || []).length;
  const illegibleMarkers = (extractedText.match(/\[illegible\]/g) || []).length;
  const totalWords = extractedText.split(/\s+/).length;

  let confidence = detection.confidence;
  if (totalWords > 0) {
    const uncertainRatio = (uncertainMarkers + illegibleMarkers * 2) / totalWords;
    confidence = Math.max(0.1, confidence - uncertainRatio);
  }

  // Extract uncertain regions
  const uncertainRegions: MultilingualOCRResult["uncertain_regions"] = [];
  const uncertainPattern = /\[(\?[^\]]*)\]/g;
  let match;
  while ((match = uncertainPattern.exec(extractedText)) !== null) {
    uncertainRegions.push({
      text: match[1],
      confidence: 0.3,
    });
  }

  return {
    text: extractedText,
    language_detected: language,
    confidence: Math.round(confidence * 100) / 100,
    uncertain_regions: uncertainRegions.length > 0 ? uncertainRegions : undefined,
  };
}
