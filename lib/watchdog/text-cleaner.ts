// ============================================
// TEXT CLEANER FOR ToS PAGES
// HTML → clean text extraction + normalization
// ============================================

import * as cheerio from "cheerio";
import type { CleanTextResult, TextSection } from "./types";

/**
 * Clean and extract text from raw HTML
 */
export function cleanHtml(html: string, contentSelector?: string): CleanTextResult {
  const $ = cheerio.load(html);

  // Remove unwanted elements
  const removeSelectors = [
    "script", "style", "noscript", "iframe",
    "nav", "footer", "header",
    "[class*='cookie']", "[id*='cookie']",
    "[class*='banner']", "[class*='popup']",
    "[class*='modal']", "[class*='overlay']",
    "[class*='sidebar']", "[class*='widget']",
    "[class*='ad-']", "[class*='ads']",
  ];
  removeSelectors.forEach((sel) => $(sel).remove());

  // Select content area
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let $content: any = $("body");
  if (contentSelector) {
    $content = $(contentSelector);
    if ($content.length === 0) $content = $("body");
  } else {
    const candidates = ["main", "article", "[role='main']", ".content", "#content"];
    for (const sel of candidates) {
      const $found = $(sel);
      if ($found.length > 0 && ($found.text() || "").trim().length > 200) {
        $content = $found;
        break;
      }
    }
  }

  // Extract sections
  const sections: TextSection[] = [];
  let currentTitle = "General";
  let currentContent = "";

  $content.find("h1, h2, h3, h4, h5, h6, p, li, td, blockquote").each((_: number, el: unknown) => {
    const $el = $(el as never);
    const tagName = (el as unknown as { tagName?: string }).tagName?.toLowerCase() || "";

    if (tagName.match(/^h[1-6]$/)) {
      if (currentContent.trim()) {
        sections.push({ title: currentTitle, content: currentContent.trim() });
      }
      currentTitle = $el.text().trim();
      currentContent = "";
    } else {
      const text = $el.text().trim();
      if (text) {
        currentContent += text + "\n";
      }
    }
  });

  if (currentContent.trim()) {
    sections.push({ title: currentTitle, content: currentContent.trim() });
  }

  const cleanText = sections
    .map((s) => `## ${s.title}\n\n${s.content}`)
    .join("\n\n");

  const normalizedText = normalizeWhitespace(cleanText);
  const wordCount = normalizedText.split(/\s+/).filter(Boolean).length;

  return {
    clean_text: normalizedText,
    sections,
    word_count: wordCount,
  };
}

/**
 * Split text into paragraphs for diffing
 */
export function splitIntoParagraphs(text: string): string[] {
  return text
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter((p) => p.length > 10); // Skip tiny fragments
}

/**
 * Calculate a simple readability score (Flesch-Kincaid approximation)
 * Returns grade level (lower = simpler)
 */
export function calculateReadability(text: string): number {
  const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 0);
  const words = text.split(/\s+/).filter((w) => w.length > 0);
  const syllables = words.reduce((count, word) => count + estimateSyllables(word), 0);

  if (sentences.length === 0 || words.length === 0) return 0;

  const wordsPerSentence = words.length / sentences.length;
  const syllablesPerWord = syllables / words.length;

  // Flesch-Kincaid Grade Level
  const grade = 0.39 * wordsPerSentence + 11.8 * syllablesPerWord - 15.59;
  return Math.max(0, Math.min(20, Math.round(grade * 10) / 10));
}

/**
 * Estimate syllable count for a word
 */
function estimateSyllables(word: string): number {
  const w = word.toLowerCase().replace(/[^a-z]/g, "");
  if (w.length <= 3) return 1;

  let count = 0;
  const vowels = "aeiouy";
  let prevVowel = false;

  for (let i = 0; i < w.length; i++) {
    const isVowel = vowels.includes(w[i]);
    if (isVowel && !prevVowel) count++;
    prevVowel = isVowel;
  }

  // Adjust for silent e
  if (w.endsWith("e")) count--;
  // Adjust for -le ending
  if (w.endsWith("le") && w.length > 2 && !vowels.includes(w[w.length - 3])) count++;

  return Math.max(1, count);
}

/**
 * Normalize whitespace and special characters
 */
function normalizeWhitespace(text: string): string {
  return text
    .replace(/[\u200B-\u200D\uFEFF]/g, "")
    .replace(/\u00A0/g, " ")
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
