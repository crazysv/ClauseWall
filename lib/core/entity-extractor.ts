// ============================================
// ENTITY EXTRACTOR — Production Implementation
// Regex fallback + normalization + type detection
// ============================================

// ============================================
// ENTITY VALIDATION — Reject hallucinated names
// ============================================

/**
 * List of generic/fake entity names that AI tends to hallucinate
 */
const INVALID_ENTITY_PATTERNS: RegExp[] = [
  // Generic role words (not actual names)
  /^(the\s+)?(landlord|tenant|lessor|lessee|licensor|licensee|owner|renter)s?$/i,
  /^(the\s+)?(employer|employee|company|organization|firm|business)s?$/i,
  /^(the\s+)?(lender|borrower|creditor|debtor|bank|financer)s?$/i,
  /^(the\s+)?(party|parties|first\s+party|second\s+party|party\s+[a-z])$/i,
  /^(the\s+)?(seller|buyer|vendor|purchaser|customer|client)s?$/i,
  /^(the\s+)?(service\s+provider|contractor|consultant|freelancer)s?$/i,
  
  // Fabricated generic company names
  /^(rent|rental|lease|property|real\s*estate)\s*(inc|co|corp|llc|ltd|company)?\.?$/i,
  /^(tech|software|solutions|services|consulting)\s*(inc|co|corp|llc|ltd|company)?\.?$/i,
  /^(loan|finance|credit|capital)\s*(inc|co|corp|llc|ltd|company)?\.?$/i,
  /^(abc|xyz|sample|test|demo|example)\s*(inc|co|corp|llc|ltd|pvt|company|properties)?\.?$/i,
  
  // Single generic words
  /^(agreement|contract|document|terms|conditions|policy)$/i,
  /^(rental|employment|loan|service|license|lease)$/i,
  /^(properties|solutions|services|enterprises|group|holdings)$/i,
  /^(pvt|ltd|llc|inc|corp|private|limited)\.?$/i,
  
  // Too short (likely not a real name)
  /^.{1,2}$/,
  
  // Only numbers or special characters
  /^[\d\s\-_.]+$/,
  /^[^a-zA-Z]*$/,
];

/**
 * Words that should NOT appear alone as entity names
 */
const SUSPICIOUS_STANDALONE_WORDS = new Set([
  "rent", "rental", "lease", "property", "properties",
  "tech", "software", "solutions", "services", "consulting",
  "loan", "finance", "credit", "capital", "bank",
  "inc", "co", "corp", "llc", "ltd", "company", "pvt", "private", "limited",
  "enterprise", "enterprises", "group", "holdings", "ventures",
  "the", "a", "an", "and", "or", "of", "for", "in", "at", "by",
]);

/**
 * Validate if an extracted entity name is real or hallucinated
 */
export function isValidEntityName(
  entityName: string | null | undefined,
  documentText: string
): boolean {
  // Null/empty is valid (means no entity found)
  if (!entityName || entityName.trim().length === 0) {
    return true;
  }

  const name = entityName.trim();

  // Check 1: Minimum length
  if (name.length < 3) {
    console.log(`[ClauseWall] Entity rejected (too short): "${name}"`);
    return false;
  }

  // Check 2: Invalid patterns
  for (const pattern of INVALID_ENTITY_PATTERNS) {
    if (pattern.test(name)) {
      console.log(`[ClauseWall] Entity rejected (invalid pattern): "${name}"`);
      return false;
    }
  }

  // Check 3: Single suspicious word
  const words = name.toLowerCase().split(/\s+/).filter(w => w.length > 0);
  if (words.length === 1 && SUSPICIOUS_STANDALONE_WORDS.has(words[0])) {
    console.log(`[ClauseWall] Entity rejected (standalone suspicious word): "${name}"`);
    return false;
  }

  // Check 4: Only generic suffix words
  const nonGenericWords = words.filter(w => !SUSPICIOUS_STANDALONE_WORDS.has(w));
  if (nonGenericWords.length === 0) {
    console.log(`[ClauseWall] Entity rejected (only generic words): "${name}"`);
    return false;
  }

  // Check 5: Must appear in document
  const coreAppearsInDoc = nonGenericWords.some(word => 
    word.length >= 3 && documentText.toLowerCase().includes(word)
  );
  
  if (!coreAppearsInDoc && nonGenericWords.length > 0) {
    const exactMatch = documentText.toLowerCase().includes(name.toLowerCase());
    if (!exactMatch) {
      console.log(`[ClauseWall] Entity rejected (not found in document): "${name}"`);
      return false;
    }
  }

  // Check 6: Reject if it's just document type words
  const docTypeWords = ["rental", "employment", "loan", "lease", "service", "agreement", "contract", "offer", "letter"];
  const allWordsAreDocType = words.every(w => 
    docTypeWords.includes(w) || SUSPICIOUS_STANDALONE_WORDS.has(w)
  );
  if (allWordsAreDocType) {
    console.log(`[ClauseWall] Entity rejected (document type words only): "${name}"`);
    return false;
  }

  return true;
}

/**
 * Fallback entity extraction using regex patterns
 * Used when AI fails to detect entity_name
 */
export function extractEntityFallback(
  text: string,
  documentType?: string
): string | null {
  if (!text || text.trim().length === 0) return null;

  // ---- PRIORITY 1: Company names with legal suffixes ----
  const companyPatterns = [
    // "Sharma Properties Pvt Ltd", "ABC Realty LLP", etc.
    /([A-Z][a-zA-Z\s&.'\-]{2,60}(?:Pvt\.?\s*Ltd\.?|Private\s+Limited|Ltd\.?|LLP|LLC|Inc\.?|Corporation|Corp\.?))/g,
    // "XYZ Developers", "ABC Properties", etc.
    /([A-Z][a-zA-Z\s&.'\-]{2,40}(?:Developers|Properties|Realty|Enterprises|Solutions|Technologies|Associates|Consultants|Group|Holdings|Builders|Infra|Infrastructure)(?:\s+(?:Pvt\.?\s*Ltd\.?|Private\s+Limited|Ltd\.?|LLP))?)/g,
  ];

  for (const pattern of companyPatterns) {
    const matches = [...text.matchAll(pattern)];
    if (matches.length > 0) {
      const cleaned = matches[0][1].trim();
      if (cleaned.length > 3 && cleaned.length < 100) {
        return cleaned;
      }
    }
  }

  // ---- PRIORITY 2: Text after specific markers ----
  const markerPatterns = [
    // "Licensor: Sharma Properties" or "Owner: Mr. Rajesh"
    /(?:Licensor|Lessor|Owner|First\s+Party|Employer|Company|Lender|Bank)\s*[:\-]\s*([^\n,()]{3,80})/i,
    // "between ABC Realty LLP and Mr. Rahul"
    /(?:between|by\s+and\s+between|entered\s+into\s+by|executed\s+by)\s+([A-Z][^\n,()]{3,80}?)(?:\s*\(|\s*,|\s+and\s+|\s+AND\s+)/i,
    // "ABC Realty LLP (hereinafter referred to as the Licensor)"
    /([A-Z][a-zA-Z\s&.'\-]{3,80}?)\s*\(\s*hereinafter/i,
    // "1. Mr. Rajesh Sharma" or "1) Sharma Properties"
    /(?:^|\n)\s*(?:1[\.\)]\s*)([A-Z][a-zA-Z\s&.'\-]{3,60}?)(?:\s*\(|\s*,|\s*\n)/m,
  ];

  for (const pattern of markerPatterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      const cleaned = match[1].trim().replace(/[,;:\s]+$/, "").trim();
      if (cleaned.length > 2 && cleaned.length < 100) {
        return cleaned;
      }
    }
  }

  // ---- PRIORITY 3: ToS-specific patterns ----
  if (documentType === "tos") {
    const tosPatterns = [
      /(?:Terms\s+of\s+(?:Service|Use)\s+(?:of|for)\s+)([A-Z][a-zA-Z\s&.'\-]+)/i,
      /(?:Welcome\s+to\s+)([A-Z][a-zA-Z\s&.'\-]+)/i,
      /(?:operated\s+by\s+)([A-Z][a-zA-Z\s&.'\-]+)/i,
      /(?:provided\s+by\s+)([A-Z][a-zA-Z\s&.'\-]+)/i,
    ];

    for (const pattern of tosPatterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        const cleaned = match[1].trim().replace(/[,;:\s]+$/, "").trim();
        if (cleaned.length > 2 && cleaned.length < 80) {
          return cleaned;
        }
      }
    }
  }

  // ---- PRIORITY 4: Person names (Mr./Mrs./Shri/Smt.) ----
  const personPatterns = [
    // "Mr. Rajesh Sharma (son of...)" or "Mr. Rajesh Sharma,"
    /(?:Mr\.?|Mrs\.?|Ms\.?|Shri\.?|Smt\.?|Dr\.?)\s+([A-Z][a-zA-Z\s]{3,40}?)(?:\s*[,(]|\s+(?:son|wife|daughter|s\/o|w\/o|d\/o|S\/o|W\/o|D\/o))/i,
    // "Mr. Rajesh Sharma" (end of line or generic)
    /(?:Mr\.?|Mrs\.?|Ms\.?|Shri\.?|Smt\.?|Dr\.?)\s+([A-Z][a-zA-Z\s]{3,40})/i,
  ];

  for (const pattern of personPatterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      const cleaned = match[1].trim().replace(/[,;:\s]+$/, "").trim();
      if (cleaned.length > 3 && cleaned.length < 60) {
        // Return with honorific
        const fullMatch = match[0].trim().replace(/[,;:\s]+$/, "").trim();
        return fullMatch;
      }
    }
  }

  return null;
}

/**
 * Normalize entity name for consistent DB matching
 * Preserves mixed-case brand names like "TechNova", "InfoSys"
 */
export function normalizeEntityName(name: string): string {
  if (!name) return name;

  let normalized = name.trim();

  // Remove extra whitespace
  normalized = normalized.replace(/\s+/g, " ");

  // Remove trailing punctuation
  normalized = normalized.replace(/[,;:.]+$/, "").trim();

  // Normalize common legal suffixes (standardize variations)
  normalized = normalized
    .replace(/Private\s+Limited/gi, "Pvt Ltd")
    .replace(/Pvt\.\s*Ltd\./gi, "Pvt Ltd")
    .replace(/Pvt\s+Ltd\./gi, "Pvt Ltd")
    .replace(/Pvt\.\s*Ltd/gi, "Pvt Ltd")
    .replace(/\bLtd\./gi, "Ltd")
    .replace(/\bInc\./gi, "Inc")
    .replace(/\bCorp\./gi, "Corp");

  // Split into words for smart casing
  const preserveUpper = new Set([
    "LLP", "LLC", "NDA", "RBI", "RERA", "HDFC", "ICICI", "SBI",
    "HCL", "TCS", "IT", "IP", "HR", "AI", "ML", "API",
  ]);
  const suffixes = new Set(["Pvt", "Ltd", "Inc", "Corp"]);
  const lowercase = new Set(["and", "of", "the", "for", "in", "at", "by"]);

  normalized = normalized
    .split(" ")
    .map((word, index) => {
      const upper = word.toUpperCase();

      // Preserve known abbreviations
      if (preserveUpper.has(upper)) return upper;

      // Preserve known suffixes as-is
      if (suffixes.has(word) || suffixes.has(upper.charAt(0) + upper.slice(1).toLowerCase())) {
        return upper.charAt(0) + upper.slice(1).toLowerCase();
      }

      // Preserve mixed-case brand names (TechNova, InfoSys, etc.)
      // Detect: has uppercase letter after a lowercase letter
      if (/[a-z][A-Z]/.test(word)) {
        return word; // Keep original casing
      }

      // ALL CAPS word longer than 3 chars → Title Case
      if (word === word.toUpperCase() && word.length > 3) {
        return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
      }

      // Lowercase articles (but not first word)
      if (index > 0 && lowercase.has(word.toLowerCase())) {
        return word.toLowerCase();
      }

      // Already looks properly cased → keep it
      if (word.charAt(0) === word.charAt(0).toUpperCase() && word.length > 1) {
        return word;
      }

      // Default: Title case
      if (word.length > 0) {
        return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
      }

      return word;
    })
    .join(" ");

  return normalized;
}

/**
 * Detect entity type based on document type first, name patterns second
 */
export function detectEntityType(
  entityName: string,
  documentType: string
): "landlord" | "employer" | "company" | "lender" | "platform" | "other" {
  // PRIORITY 1: Document type (most reliable signal)
  switch (documentType) {
    case "rental":
    case "lease":
      return "landlord";
    case "employment":
      return "employer";
    case "loan":
      return "lender";
    case "tos":
      return "platform";
  }

  // PRIORITY 2: Name-based detection (fallback for "other" document types)
  const nameLower = entityName.toLowerCase();

  if (
    /(?:properties|realty|developers|builders|estate|housing|apartment|residenc)/i.test(
      nameLower
    )
  ) {
    return "landlord";
  }
  if (
    /(?:bank|finance|capital|lending|credit|loan|finserv|fincorp)/i.test(
      nameLower
    )
  ) {
    return "lender";
  }
  if (
    /(?:technologies|tech|software|solutions|digital|app|platform|media)/i.test(
      nameLower
    )
  ) {
    return "platform";
  }

  return "company";
}

/**
 * Get display label for entity type
 */
export function getEntityTypeLabel(
  type: "landlord" | "employer" | "company" | "lender" | "platform" | "other"
): { label: string; emoji: string; color: string } {
  const map: Record<string, { label: string; emoji: string; color: string }> = {
    landlord: {
      label: "Landlord / Property Owner",
      emoji: "🏠",
      color: "text-orange-400",
    },
    employer: {
      label: "Employer",
      emoji: "💼",
      color: "text-blue-400",
    },
    company: {
      label: "Company",
      emoji: "🏢",
      color: "text-gray-400",
    },
    lender: {
      label: "Lender / Financial Institution",
      emoji: "🏦",
      color: "text-green-400",
    },
    platform: {
      label: "Platform / Service Provider",
      emoji: "🌐",
      color: "text-purple-400",
    },
    other: {
      label: "Entity",
      emoji: "📋",
      color: "text-gray-400",
    },
  };

  return map[type] || map.other;
}