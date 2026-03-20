// ============================================
// PII DETECTOR — Indian Document Patterns
// Detects personal data in contract text
// Runs entirely client-side
// ============================================

import type { PIIDetection, PIIType } from "./types";

interface Pattern {
  type: PIIType;
  regex: RegExp;
  mask: (match: string) => string;
}

const PII_PATTERNS: Pattern[] = [
  // Aadhaar (XXXX XXXX XXXX)
  {
    type: "aadhaar",
    regex: /\b\d{4}\s?\d{4}\s?\d{4}\b/g,
    mask: () => "[AADHAAR]",
  },
  // PAN (ABCDE1234F)
  {
    type: "pan",
    regex: /\b[A-Z]{5}\d{4}[A-Z]\b/g,
    mask: () => "[PAN]",
  },
  // GSTIN
  {
    type: "gstin",
    regex: /\b\d{2}[A-Z]{5}\d{4}[A-Z]\d[Z][A-Z\d]\b/g,
    mask: () => "[GSTIN]",
  },
  // CIN
  {
    type: "cin",
    regex: /\b[UL]\d{5}[A-Z]{2}\d{4}[A-Z]{3}\d{6}\b/g,
    mask: () => "[CIN]",
  },
  // Email
  {
    type: "email",
    regex: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
    mask: () => "[EMAIL]",
  },
  // Phone
  {
    type: "phone",
    regex: /(?:\+91[\-\s]?)?[6-9]\d{9}\b/g,
    mask: () => "[PHONE]",
  },
  // Currency amounts
  {
    type: "amount",
    regex:
      /(?:₹|Rs\.?|INR)\s*[\d,]+(?:\.\d{1,2})?(?:\s*(?:lakhs?|lacs?|crores?|thousands?|only|-\/?))?/gi,
    mask: () => "[AMOUNT]",
  },
  // Large numbers (likely amounts)
  {
    type: "amount",
    regex: /\b\d{1,3}(?:,\d{2,3})+(?:\.\d{1,2})?\b/g,
    mask: () => "[AMOUNT]",
  },
  // Dates (DD/MM/YYYY)
  {
    type: "date",
    regex: /\b\d{1,2}[\/-]\d{1,2}[\/-]\d{2,4}\b/g,
    mask: () => "[DATE]",
  },
  // Dates (1st January, 2024)
  {
    type: "date",
    regex:
      /\b\d{1,2}(?:st|nd|rd|th)?\s+(?:January|February|March|April|May|June|July|August|September|October|November|December),?\s+\d{4}\b/gi,
    mask: () => "[DATE]",
  },
  // PIN codes
  {
    type: "address",
    regex: /\b\d{6}\b/g,
    mask: () => "[PIN]",
  },
  // Addresses (Flat/Plot No + multipart)
  {
    type: "address",
    regex:
      /(?:Flat|Apartment|Unit|Shop|Office|Plot|House|Floor|Wing)\s*(?:No\.?|Number|#)?\s*[\w\-\/]+(?:\s*,\s*[^,\n]+){1,5}\s*[-–]?\s*\d{6}/gi,
    mask: () => "[ADDRESS]",
  },
  // Company names
  {
    type: "company",
    regex:
      /\b[A-Z][A-Za-z\s&]+\s*(?:Private\s+Limited|Pvt\.?\s*Ltd\.?|Limited|Ltd\.?|LLP|Inc\.?|Corporation|Corp\.?)\b/gi,
    mask: () => "[COMPANY]",
  },
  // Person names (Mr./Mrs./Shri + Name)
  {
    type: "name",
    regex:
      /\b(?:Mr\.?|Mrs\.?|Ms\.?|Shri|Smt\.?|Dr\.?|M\/s\.?)\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,3}/gi,
    mask: () => "[PERSON]",
  },
];

// Legal terms to NEVER redact
const LEGAL_TERMS = new Set([
  "security deposit",
  "notice period",
  "lock in",
  "leave and license",
  "rent agreement",
  "service agreement",
  "non disclosure",
  "indian contract",
  "transfer of property",
  "consumer protection",
  "model tenancy",
  "supreme court",
  "high court",
  "district court",
  "stamp duty",
  "registration act",
  "payment of",
  "information technology",
]);

/**
 * Detect all PII in text
 */
export function detectPII(text: string): PIIDetection[] {
  const detections: PIIDetection[] = [];
  const usedRanges: Array<[number, number]> = [];

  for (const pattern of PII_PATTERNS) {
    const regex = new RegExp(pattern.regex.source, pattern.regex.flags);
    let match: RegExpExecArray | null;

    while ((match = regex.exec(text)) !== null) {
      const start = match.index;
      const end = start + match[0].length;

      // Skip if overlaps with existing detection
      const overlaps = usedRanges.some(
        ([s, e]) => start < e && end > s
      );
      if (overlaps) continue;

      // Skip if it's a legal term
      const lower = match[0].toLowerCase();
      const isLegalTerm = Array.from(LEGAL_TERMS).some((term) =>
        lower.includes(term)
      );
      if (isLegalTerm) continue;

      usedRanges.push([start, end]);

      detections.push({
        type: pattern.type,
        value: match[0],
        masked: pattern.mask(match[0]),
        startIndex: start,
        endIndex: end,
      });
    }
  }

  // Sort by position
  detections.sort((a, b) => a.startIndex - b.startIndex);

  return detections;
}