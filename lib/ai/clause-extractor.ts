// ============================================
// CLAUSE EXTRACTOR
// Splits a document into individual clauses using AI
// WITH ROBUST ENTITY VALIDATION
// ============================================

import { callGroq } from "./groq-client";
import { CLAUSE_EXTRACTION_PROMPT } from "./system-prompt";
import { log } from "@/lib/logger";
import { safeParseJson, safeString, safeArray, safeBoolean, safeStringArray, safeStringOrNull, safeInt } from "./output-guards";
import type { ExtractedClause, DocumentInfo, ExtractionResult } from "@/types";
import type { SupportedLanguage } from "@/types/bhasha";
import { getMultilingualExtractionPrompt } from "@/lib/bhasha/multilingual-prompts";
import { convertNumerals } from "@/lib/bhasha/numeral-converter";

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
 * but are valid as PART of a name (e.g., "Sharma Properties" is valid)
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
 * Minimum requirements for a valid entity name
 */
const MIN_ENTITY_LENGTH = 3;
const MIN_WORD_COUNT_FOR_GENERIC_SUFFIX = 2; // "Properties Ltd" invalid, "Sharma Properties Ltd" valid

/**
 * Validate if an extracted entity name is real or hallucinated
 */
function isValidEntityName(
  entityName: string | null | undefined,
  documentText: string
): boolean {
  // Null/empty is valid (means no entity found)
  if (!entityName || entityName.trim().length === 0) {
    return true; // Will be treated as "not found" downstream
  }

  const name = entityName.trim();

  // ---- Check 1: Minimum length ----
  if (name.length < MIN_ENTITY_LENGTH) {
    log.debug("extractor", "Entity rejected: too short", { length: name.length });
    return false;
  }

  // ---- Check 2: Invalid patterns ----
  for (const pattern of INVALID_ENTITY_PATTERNS) {
    if (pattern.test(name)) {
      log.debug("extractor", "Entity rejected: invalid pattern");
      return false;
    }
  }

  // ---- Check 3: Single suspicious word ----
  const words = name.toLowerCase().split(/\s+/).filter(w => w.length > 0);
  if (words.length === 1 && SUSPICIOUS_STANDALONE_WORDS.has(words[0])) {
    log.debug("extractor", "Entity rejected: standalone suspicious word");
    return false;
  }

  // ---- Check 4: Only generic suffix words ----
  // e.g., "Properties Pvt Ltd" is invalid, but "Sharma Properties Pvt Ltd" is valid
  const nonGenericWords = words.filter(w => !SUSPICIOUS_STANDALONE_WORDS.has(w));
  if (nonGenericWords.length === 0) {
    log.debug("extractor", "Entity rejected: only generic words");
    return false;
  }

  // ---- Check 5: Must appear in document (fuzzy match) ----
  // The core part of the name should exist in the document
  const coreWords = nonGenericWords.slice(0, 3).join(" "); // First 3 non-generic words
  const docLower = documentText.toLowerCase();
  
  // Check if core words appear in document (allow some flexibility)
  const coreAppearsInDoc = nonGenericWords.some(word => 
    word.length >= 3 && docLower.includes(word)
  );
  
  if (!coreAppearsInDoc && nonGenericWords.length > 0) {
    // Extra check: maybe it's a proper name that appears exactly
    const exactMatch = docLower.includes(name.toLowerCase());
    if (!exactMatch) {
      log.debug("extractor", "Entity rejected: not found in document");
      return false;
    }
  }

  // ---- Check 6: Reject if it's just the document type ----
  const docTypeWords = ["rental", "employment", "loan", "lease", "service", "agreement", "contract", "offer", "letter"];
  const allWordsAreDocType = words.every(w => 
    docTypeWords.includes(w) || SUSPICIOUS_STANDALONE_WORDS.has(w)
  );
  if (allWordsAreDocType) {
    log.debug("extractor", "Entity rejected: document type words only");
    return false;
  }

  return true;
}

/**
 * Sanitize entity name — clean up but don't reject
 */
function sanitizeEntityName(name: string | null | undefined): string | null {
  if (!name) return null;

  let sanitized = name.trim();

  // Remove surrounding quotes
  sanitized = sanitized.replace(/^["']+|["']+$/g, "");

  // Remove trailing punctuation
  sanitized = sanitized.replace(/[,;:.]+$/, "");

  // Remove common prefixes that shouldn't be part of the name
  sanitized = sanitized.replace(/^(M\/s\.?\s*|Messrs\.?\s*)/i, "");

  // Normalize whitespace
  sanitized = sanitized.replace(/\s+/g, " ").trim();

  // If empty after sanitization, return null
  if (sanitized.length === 0) return null;

  return sanitized;
}

// ============================================
// MAIN EXTRACTION FUNCTION
// ============================================

/**
 * Extract individual clauses from a document
 */
export async function extractClauses(
  documentText: string,
  sourceLanguage?: SupportedLanguage
): Promise<ExtractionResult> {
  try {
    // Truncate if too long (Groq has context limits)
    const maxLength = 15000;
    const truncatedText =
      documentText.length > maxLength
        ? documentText.substring(0, maxLength) +
          "\n\n[Document truncated due to length — remaining clauses not shown]"
        : documentText;

    // Use multilingual prompt for non-English documents
    const isMultilingual = sourceLanguage && sourceLanguage !== "en";
    const systemPrompt = isMultilingual
      ? getMultilingualExtractionPrompt(sourceLanguage)
      : CLAUSE_EXTRACTION_PROMPT;
    const userMessage = isMultilingual
      ? `Extract all clauses from this ${sourceLanguage} legal document and respond in JSON format:\n\n${truncatedText}`
      : `Extract all clauses from this Indian legal document and respond in JSON format:\n\n${truncatedText}`;

    const response = await callGroq([
      {
        role: "system",
        content: systemPrompt,
      },
      {
        role: "user",
        content: userMessage,
      },
    ]);

    const raw = safeParseJson(response);
    if (!raw) {
      throw new Error("Invalid extraction response: could not parse JSON");
    }

    // ---- Build typed result from guarded fields ----
    const rawDocInfo = (raw.document_info != null && typeof raw.document_info === "object")
      ? raw.document_info as Record<string, unknown>
      : {} as Record<string, unknown>;

    const parsed: ExtractionResult = {
      clauses: [],
      document_info: {
        detected_type: safeString(rawDocInfo.detected_type, "other", 50),
        detected_jurisdiction: safeStringOrNull(rawDocInfo.detected_jurisdiction, 100),
        entity_name: safeStringOrNull(rawDocInfo.entity_name, 200),
        parties: safeStringArray(rawDocInfo.parties, 10),
        agreement_date: safeStringOrNull(rawDocInfo.agreement_date, 50),
        is_stamp_paper: safeBoolean(rawDocInfo.is_stamp_paper, false),
        stamp_value: rawDocInfo.stamp_value != null ? safeString(rawDocInfo.stamp_value, "") || null : null,
      },
    };

    // ---- Validate response structure ----
    const rawClauses = safeArray(raw.clauses);
    if (rawClauses.length === 0) {
      throw new Error(
        "No clauses could be extracted from this document. Please check if the text is a valid contract."
      );
    }

    // ---- Sanitize clauses with per-item guards ----
    parsed.clauses = rawClauses
      .map((c: unknown, index: number) => {
        const item = c as Record<string, unknown> | null;
        if (!item) return null;
        const text = safeString(item.text, "").trim();
        if (text.length === 0) return null;
        return {
          clause_number: safeInt(item.clause_number, index + 1, 0),
          clause_type: safeString(item.clause_type, "general", 100),
          text,
        };
      })
      .filter((c): c is ExtractedClause => c !== null);

    // ---- Validate and sanitize entity name ----
    let entityName = sanitizeEntityName(parsed.document_info?.entity_name);
    
    if (entityName && !isValidEntityName(entityName, documentText)) {
      log.debug("extractor", "AI extracted entity rejected by validation");
      entityName = null;
    }

    if (entityName) {
      log.info("extractor", "Valid entity extracted", { hasEntity: true });
    } else {
      log.info("extractor", "No valid entity found");
    }

    // ---- Validate jurisdiction ----
    let detectedJurisdiction = parsed.document_info?.detected_jurisdiction || null;
    
    // Basic jurisdiction validation (should be Indian state code or name)
    if (detectedJurisdiction) {
      const validJurisdictionPatterns = [
        /^IN-[A-Z]{2}$/i,  // IN-MH, IN-KA, etc.
        /maharashtra|karnataka|delhi|tamil\s*nadu|uttar\s*pradesh|gujarat|rajasthan|west\s*bengal|kerala|telangana|andhra\s*pradesh|punjab|haryana|madhya\s*pradesh|bihar|odisha|assam|jharkhand|chhattisgarh|uttarakhand|himachal|goa/i,
      ];
      
      const isValidJurisdiction = validJurisdictionPatterns.some(p => p.test(detectedJurisdiction!));
      
      if (!isValidJurisdiction) {
        log.debug("extractor", "Invalid jurisdiction detected, nullified");
        detectedJurisdiction = null;
      }
    }

    // ---- Build final document_info ----
    parsed.document_info = {
      detected_type: parsed.document_info?.detected_type || "other",
      detected_jurisdiction: detectedJurisdiction,
      entity_name: entityName,
      parties: parsed.document_info?.parties || [],
      agreement_date: parsed.document_info?.agreement_date || null,
      is_stamp_paper: parsed.document_info?.is_stamp_paper || false,
      stamp_value: parsed.document_info?.stamp_value || null,
    };

    log.info("extractor", "Clause extraction complete", {
      clauseCount: parsed.clauses.length,
      hasEntity: !!entityName,
      hasJurisdiction: !!detectedJurisdiction,
    });

    return parsed;
  } catch (error) {
    log.errorWithCause("extractor", "Clause extraction failed", error);
    throw new Error(
      `Failed to extract clauses: ${(error as Error).message}`
    );
  }
}