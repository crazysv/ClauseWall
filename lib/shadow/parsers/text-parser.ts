// ============================================
// GENERIC TEXT PARSER
// Handles pasted text evidence — job postings,
// property listings, broker messages, etc.
// Cleans and extracts metadata
// ============================================

import type { EvidenceType, EvidenceMetadata } from '@/types';

// Common date patterns
const DATE_PATTERNS = [
  /\b(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})\b/g,
  /\b(\d{1,2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{4})\b/gi,
  /\b((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{1,2},?\s+\d{4})\b/gi,
];

// Party name indicators
const PARTY_INDICATORS = [
  /(?:Mr\.|Mrs\.|Ms\.|Dr\.|Shri|Smt\.)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,3})/g,
  /(?:landlord|owner|tenant|employer|employee|lender|borrower|seller|buyer|broker|agent)[\s:]+([A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,2})/gi,
  /(?:name|party|from|to|by)[\s:]+([A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,2})/gi,
];

// Language detection (very simple)
const HINDI_CHARS = /[\u0900-\u097F]/;
const HINDI_WORDS = ['hai', 'ka', 'ki', 'ke', 'se', 'mein', 'ko', 'aur', 'nahi', 'hoga', 'dena', 'lena', 'karna', 'bola', 'baat'];

/**
 * Detect primary language of text
 */
function detectLanguage(text: string): string {
  if (HINDI_CHARS.test(text)) return 'hindi';

  const lower = text.toLowerCase();
  const words = lower.split(/\s+/);
  const hindiWordCount = words.filter(w => HINDI_WORDS.includes(w)).length;

  if (hindiWordCount > words.length * 0.15) return 'hinglish';
  return 'english';
}

/**
 * Extract dates mentioned in text
 */
function extractDates(text: string): string[] {
  const dates: string[] = [];
  for (const pattern of DATE_PATTERNS) {
    const allMatches = text.matchAll(new RegExp(pattern.source, pattern.flags));
    for (const match of allMatches) {
      if (match[1] && !dates.includes(match[1])) {
        dates.push(match[1]);
      }
    }
  }
  return dates.slice(0, 10); // Limit to 10 dates max
}

/**
 * Extract party names mentioned in text
 */
function extractPartyNames(text: string): string[] {
  const names = new Set<string>();

  for (const pattern of PARTY_INDICATORS) {
    const allMatches = text.matchAll(new RegExp(pattern.source, pattern.flags));
    for (const match of allMatches) {
      if (match[1]) {
        const name = match[1].trim();
        if (name.length > 2 && name.length < 50) {
          names.add(name);
        }
      }
    }
  }

  return Array.from(names).slice(0, 10);
}

/**
 * Parse and clean generic text evidence
 */
export function parseGenericText(
  text: string,
  type: EvidenceType
): { cleanedText: string; metadata: Partial<EvidenceMetadata> } {
  if (!text || text.trim().length === 0) {
    return {
      cleanedText: '',
      metadata: { word_count: 0, processing_time_ms: 0 },
    };
  }

  const startTime = Date.now();

  // Clean up text
  let cleaned = text
    // Remove non-printable characters (keep newlines, tabs)
    .replace(/[^\x09\x0A\x0D\x20-\x7E\u0080-\uFFFF]/g, '')
    // Normalize whitespace
    .replace(/[ \t]+/g, ' ')
    // Remove excessive newlines
    .replace(/\n{3,}/g, '\n\n')
    // Trim each line
    .split('\n')
    .map(line => line.trim())
    .join('\n')
    .trim();

  // For property listings: try to extract structured info
  if (type === 'property_listing') {
    // Common property listing fields
    const priceMatch = cleaned.match(/(?:price|rent|₹|rs\.?|inr)\s*[:\-]?\s*([\d,]+(?:\.\d+)?(?:\s*(?:lakhs?|lacs?|cr|crore|k|per\s*month|\/\s*month|pm))?)/i);
    if (priceMatch) {
      console.log(`[ClauseWall] Property listing: price detected = ${priceMatch[1]}`);
    }
  }

  // For job postings: extract key terms
  if (type === 'job_posting') {
    const salaryMatch = cleaned.match(/(?:salary|ctc|compensation|package)\s*[:\-]?\s*([\d,]+(?:\.\d+)?(?:\s*(?:lakhs?|lacs?|lpa|per\s*annum|pa|\/\s*year))?)/i);
    if (salaryMatch) {
      console.log(`[ClauseWall] Job posting: salary detected = ${salaryMatch[1]}`);
    }
  }

  const words = cleaned.split(/\s+/).filter(w => w.length > 0);
  const language = detectLanguage(cleaned);
  const dates = extractDates(cleaned);

  const metadata: Partial<EvidenceMetadata> = {
    word_count: words.length,
    language_detected: language,
    processing_time_ms: Date.now() - startTime,
  };

  console.log(
    `[ClauseWall] Text parser: ${words.length} words, lang=${language}, dates=${dates.length}, type=${type}`
  );

  return { cleanedText: cleaned, metadata };
}
