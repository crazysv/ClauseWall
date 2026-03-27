// ============================================
// CLAUSEWALL — SCRIPT UTILITIES
// Unicode script detection and manipulation
// ============================================

import type { IndianScript, SupportedLanguage } from "@/types/bhasha";
import { SCRIPT_UNICODE_RANGES, LANGUAGE_CONFIGS } from "./constants";

// ============================================
// SCRIPT DETECTION
// ============================================

/**
 * Detect the primary script in a text string.
 */
export function detectScript(text: string): IndianScript {
  const distribution = getScriptDistribution(text);
  let maxScript: IndianScript = "latin";
  let maxCount = 0;

  for (const [script, count] of distribution.entries()) {
    if (count > maxCount) {
      maxCount = count;
      maxScript = script;
    }
  }

  return maxScript;
}

/**
 * Get character count distribution by script.
 */
export function getScriptDistribution(text: string): Map<IndianScript, number> {
  const distribution = new Map<IndianScript, number>();

  // Order matters: check specific scripts before overlapping ones
  const scriptOrder: IndianScript[] = [
    "devanagari", "tamil", "telugu", "kannada", "gujarati",
    "malayalam", "gurmukhi", "odia", "bengali", // bengali after odia to avoid overlap
    "nastaliq", "latin",
  ];

  for (const script of scriptOrder) {
    const regex = SCRIPT_UNICODE_RANGES[script];
    // Create new RegExp to avoid lastIndex issues
    const freshRegex = new RegExp(regex.source, "g");
    const matches = text.match(freshRegex);
    if (matches && matches.length > 0) {
      distribution.set(script, matches.length);
    }
  }

  return distribution;
}

/**
 * Check if text contains multiple scripts (mixed-language document).
 */
export function containsMultipleScripts(text: string): boolean {
  const distribution = getScriptDistribution(text);
  const totalChars = Array.from(distribution.values()).reduce((a, b) => a + b, 0);
  if (totalChars === 0) return false;

  let scriptsAboveThreshold = 0;
  for (const count of distribution.values()) {
    if (count / totalChars > 0.15) {
      scriptsAboveThreshold++;
    }
  }

  return scriptsAboveThreshold > 1;
}

/**
 * Get the script used by a language.
 */
export function getScriptForLanguage(language: SupportedLanguage): IndianScript {
  return LANGUAGE_CONFIGS[language].script;
}

/**
 * Get all languages that use a given script.
 */
export function getLanguagesForScript(script: IndianScript): SupportedLanguage[] {
  return Object.values(LANGUAGE_CONFIGS)
    .filter(c => c.script === script)
    .map(c => c.code);
}

// ============================================
// CHARACTER CLASSIFICATION
// ============================================

export function isDevanagari(char: string): boolean {
  const code = char.charCodeAt(0);
  return code >= 0x0900 && code <= 0x097F;
}

export function isBengali(char: string): boolean {
  const code = char.charCodeAt(0);
  return code >= 0x0980 && code <= 0x09FF;
}

export function isTamil(char: string): boolean {
  const code = char.charCodeAt(0);
  return code >= 0x0B80 && code <= 0x0BFF;
}

export function isTelugu(char: string): boolean {
  const code = char.charCodeAt(0);
  return code >= 0x0C00 && code <= 0x0C7F;
}

export function isKannada(char: string): boolean {
  const code = char.charCodeAt(0);
  return code >= 0x0C80 && code <= 0x0CFF;
}

export function isGujarati(char: string): boolean {
  const code = char.charCodeAt(0);
  return code >= 0x0A80 && code <= 0x0AFF;
}

export function isMalayalam(char: string): boolean {
  const code = char.charCodeAt(0);
  return code >= 0x0D00 && code <= 0x0D7F;
}

export function isGurmukhi(char: string): boolean {
  const code = char.charCodeAt(0);
  return code >= 0x0A00 && code <= 0x0A7F;
}

export function isOdia(char: string): boolean {
  const code = char.charCodeAt(0);
  return code >= 0x0B00 && code <= 0x0B7F;
}

export function isNastaliq(char: string): boolean {
  const code = char.charCodeAt(0);
  return (code >= 0x0600 && code <= 0x06FF) ||
         (code >= 0xFB50 && code <= 0xFDFF) ||
         (code >= 0xFE70 && code <= 0xFEFF);
}

// ============================================
// TEXT NORMALIZATION
// ============================================

/**
 * Normalize text: NFC form, clean whitespace.
 */
export function normalizeText(text: string): string {
  // Apply Unicode NFC normalization
  let normalized = text.normalize("NFC");

  // Normalize whitespace
  normalized = normalized.replace(/\s+/g, " ").trim();

  return normalized;
}

/**
 * Remove diacritical/combining marks while preserving base characters.
 * Useful for fuzzy matching.
 */
export function stripDiacritics(text: string): string {
  return text.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}
