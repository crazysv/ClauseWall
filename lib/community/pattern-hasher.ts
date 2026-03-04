// ============================================
// PATTERN HASHER
// Generates consistent hash for clause matching
// ============================================

/**
 * Normalize text for hashing — strips variation, keeps meaning
 */
function normalizeForHashing(text: string): string {
  return text
    .toLowerCase()
    .replace(/\[(person|party|company|amount|address|pin|phone|email|aadhaar|pan|date|cin|gstin)\]/gi, "[X]")
    .replace(/\s+/g, " ")
    .replace(/[.,;:!?'"()[\]{}]/g, "")
    .replace(/\bshall\b/g, "will")
    .replace(/\bhereby\b/g, "")
    .replace(/\bherein\b/g, "")
    .replace(/\bthereof\b/g, "")
    .replace(/\bwhereof\b/g, "")
    .replace(/\baforesaid\b/g, "said")
    .replace(/\bhereunder\b/g, "under this")
    .replace(/\bhereinafter\b/g, "")
    .trim();
}

/**
 * djb2 hash — fast, good distribution for pattern matching
 */
function djb2Hash(str: string): string {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash) + str.charCodeAt(i);
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16).padStart(8, "0");
}

/**
 * Generate exact pattern hash for a clause
 */
export function generatePatternHash(
  anonymizedText: string,
  clauseType: string
): string {
  const normalized = normalizeForHashing(anonymizedText);
  const typePart = clauseType.toLowerCase().replace(/[^a-z_]/g, "").substring(0, 8);
  return `${typePart}_${djb2Hash(`${typePart}:${normalized}`)}`;
}

/**
 * Generate fuzzy hash based on key phrases (matches similar clauses)
 */
export function generateFuzzyHash(
  anonymizedText: string,
  clauseType: string
): string {
  const keyPhrases = [
    "security deposit", "shall forfeit", "forfeiture",
    "lock in", "lock-in", "notice period",
    "non-compete", "non compete", "non-solicitation",
    "termination", "terminate", "penalty",
    "liquidated damages", "indemnify", "indemnification",
    "waiver", "waive", "arbitration",
    "jurisdiction", "governing law",
    "confidential", "intellectual property",
    "training bond", "service bond",
    "repayment", "interest rate", "prepayment",
    "painting charges", "maintenance charges",
    "subletting", "sub-let",
    "automatic renewal", "auto-renewal",
    "unilateral", "sole discretion",
    "without cause", "without reason",
    "no refund", "non-refundable",
  ];

  const normalized = normalizeForHashing(anonymizedText);
  const found = keyPhrases
    .filter((phrase) => normalized.includes(phrase))
    .sort()
    .join("|");

  const typePart = clauseType.toLowerCase().replace(/[^a-z_]/g, "").substring(0, 8);
  return `fz_${typePart}_${djb2Hash(found || "none")}`;
}