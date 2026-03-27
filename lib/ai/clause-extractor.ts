// ============================================
// CLAUSE EXTRACTOR
// Splits a document into individual clauses using AI
// WITH ROBUST ENTITY VALIDATION
// ============================================

import { callGroq } from "./groq-client";
import { CLAUSE_EXTRACTION_PROMPT } from "./system-prompt";
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
    console.log(`[ClauseWall] Entity rejected (too short): "${name}"`);
    return false;
  }

  // ---- Check 2: Invalid patterns ----
  for (const pattern of INVALID_ENTITY_PATTERNS) {
    if (pattern.test(name)) {
      console.log(`[ClauseWall] Entity rejected (invalid pattern): "${name}"`);
      return false;
    }
  }

  // ---- Check 3: Single suspicious word ----
  const words = name.toLowerCase().split(/\s+/).filter(w => w.length > 0);
  if (words.length === 1 && SUSPICIOUS_STANDALONE_WORDS.has(words[0])) {
    console.log(`[ClauseWall] Entity rejected (standalone suspicious word): "${name}"`);
    return false;
  }

  // ---- Check 4: Only generic suffix words ----
  // e.g., "Properties Pvt Ltd" is invalid, but "Sharma Properties Pvt Ltd" is valid
  const nonGenericWords = words.filter(w => !SUSPICIOUS_STANDALONE_WORDS.has(w));
  if (nonGenericWords.length === 0) {
    console.log(`[ClauseWall] Entity rejected (only generic words): "${name}"`);
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
      console.log(`[ClauseWall] Entity rejected (not found in document): "${name}"`);
      return false;
    }
  }

  // ---- Check 6: Reject if it's just the document type ----
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

    const parsed = JSON.parse(response) as ExtractionResult;

    // ---- Validate response structure ----
    if (!parsed.clauses || !Array.isArray(parsed.clauses)) {
      throw new Error("Invalid extraction response: missing clauses array");
    }

    if (parsed.clauses.length === 0) {
      throw new Error(
        "No clauses could be extracted from this document. Please check if the text is a valid contract."
      );
    }

    // ---- Sanitize clauses ----
    parsed.clauses = parsed.clauses
      .filter((clause) => clause.text && clause.text.trim().length > 0)
      .map((clause, index) => ({
        clause_number: clause.clause_number || index + 1,
        clause_type: clause.clause_type || "general",
        text: clause.text.trim(),
      }));

    // ---- Validate and sanitize entity name ----
    let entityName = sanitizeEntityName(parsed.document_info?.entity_name);
    
    if (entityName && !isValidEntityName(entityName, documentText)) {
      console.log(`[ClauseWall] AI extracted invalid entity "${entityName}" — setting to null`);
      entityName = null;
    }

    if (entityName) {
      console.log(`[ClauseWall] Valid entity extracted: "${entityName}"`);
    } else {
      console.log(`[ClauseWall] No valid entity found in document`);
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
        console.log(`[ClauseWall] Invalid jurisdiction detected: "${detectedJurisdiction}" — setting to null`);
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

    console.log(
      `[ClauseWall] Extracted ${parsed.clauses.length} clauses | Entity: ${entityName || "none"} | Jurisdiction: ${detectedJurisdiction || "none"}`
    );

    return parsed;
  } catch (error) {
    console.error("[ClauseWall] Clause extraction failed:", error);
    throw new Error(
      `Failed to extract clauses: ${(error as Error).message}`
    );
  }
}