// ============================================
// CLAUSE ANONYMIZER
// Strips PII from clause text before community storage
// ============================================

/**
 * Remove personally identifiable information from clause text
 */
export function anonymizeClauseText(text: string): string {
  let a = text;

  // Company names (Pvt. Ltd., LLP, etc.)
  a = a.replace(
    /\b[A-Z][A-Za-z\s&]+\s*(Private\s+Limited|Pvt\.?\s*Ltd\.?|Limited|Ltd\.?|LLP|Inc\.?|Corporation|Corp\.?)\b/gi,
    "[COMPANY]"
  );

  // Honorifics + names
  a = a.replace(
    /\b(Mr\.?|Mrs\.?|Ms\.?|Shri|Smt\.?|Dr\.?|M\/s\.?)\s+[A-Z][a-z]+(\s+[A-Z][a-z]+){0,3}/gi,
    "[PERSON]"
  );

  // Capitalized name sequences (2-4 words, likely names)
  a = a.replace(
    /\b[A-Z][a-z]+(\s+[A-Z][a-z]+){1,3}\b/g,
    (match) => {
      const legalTerms = [
        "Security Deposit", "Notice Period", "Lock In", "Leave And License",
        "Rent Agreement", "Service Agreement", "Non Disclosure", "Indian Contract",
        "Transfer Of Property", "Consumer Protection", "Model Tenancy",
        "Supreme Court", "High Court", "District Court", "Civil Court",
        "Stamp Duty", "Registration Act", "Payment Of", "Information Technology",
      ];
      if (legalTerms.some((t) => match.toLowerCase().includes(t.toLowerCase()))) {
        return match;
      }
      const skipFirst = ["The", "This", "That", "Which", "Where", "When", "Such", "Said", "Above", "Any", "All", "Upon", "After", "Before", "Within", "Without", "During", "Under"];
      const words = match.split(" ");
      if (words.length >= 2 && !skipFirst.includes(words[0])) {
        return "[PARTY]";
      }
      return match;
    }
  );

  // Currency amounts
  a = a.replace(
    /(?:₹|Rs\.?|INR)\s*[\d,]+(?:\.\d{1,2})?(?:\s*(?:lakhs?|lacs?|crores?|thousands?|only|-\/?-))?/gi,
    "[AMOUNT]"
  );

  // Large standalone numbers (likely amounts)
  a = a.replace(
    /\b\d{1,3}(?:,\d{2,3})+(?:\.\d{1,2})?\b/g,
    "[AMOUNT]"
  );

  // Addresses (Flat/Plot/House No + multi-part address)
  a = a.replace(
    /(?:Flat|Apartment|Unit|Shop|Office|Plot|House|Floor|Wing)\s*(?:No\.?|Number|#)?\s*[\w\-\/]+(?:\s*,\s*[^,\n]+){1,5}\s*[-–]?\s*\d{6}/gi,
    "[ADDRESS]"
  );

  // PIN codes
  a = a.replace(/\b\d{6}\b/g, "[PIN]");

  // Phone numbers
  a = a.replace(/(?:\+91[\-\s]?)?[6-9]\d{9}\b/g, "[PHONE]");

  // Email
  a = a.replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, "[EMAIL]");

  // Aadhaar
  a = a.replace(/\b\d{4}\s?\d{4}\s?\d{4}\b/g, "[AADHAAR]");

  // PAN
  a = a.replace(/\b[A-Z]{5}\d{4}[A-Z]\b/g, "[PAN]");

  // Dates (DD/MM/YYYY, DD-MM-YYYY)
  a = a.replace(/\b\d{1,2}[\/-]\d{1,2}[\/-]\d{2,4}\b/g, "[DATE]");

  // Dates (1st January, 2024)
  a = a.replace(
    /\b\d{1,2}(?:st|nd|rd|th)?\s+(?:January|February|March|April|May|June|July|August|September|October|November|December),?\s+\d{4}\b/gi,
    "[DATE]"
  );

  // CIN numbers
  a = a.replace(/\b[UL]\d{5}[A-Z]{2}\d{4}[A-Z]{3}\d{6}\b/g, "[CIN]");

  // GSTIN
  a = a.replace(/\b\d{2}[A-Z]{5}\d{4}[A-Z]\d[Z][A-Z\d]\b/g, "[GSTIN]");

  // Normalize whitespace
  a = a.replace(/\s+/g, " ").trim();

  return a;
}

/**
 * Check if clause has too much PII to be useful after anonymization
 */
export function isOverlyPersonal(text: string): boolean {
  const anonymized = anonymizeClauseText(text);
  const placeholders = (anonymized.match(/\[[A-Z]+\]/g) || []).length;
  const words = anonymized.split(/\s+/).length;
  return words < 10 || placeholders / words > 0.4;
}