// ============================================
// CLAUSE EXTRACTOR
// Splits a document into individual clauses using AI
// ============================================

import { callGroq } from "./groq-client";
import { CLAUSE_EXTRACTION_PROMPT } from "./system-prompt";
import type { ExtractedClause, DocumentInfo, ExtractionResult } from "@/types";

/**
 * Extract individual clauses from a document
 */
export async function extractClauses(
  documentText: string
): Promise<ExtractionResult> {
  try {
    // Truncate if too long (Groq has context limits)
    const maxLength = 15000;
    const truncatedText =
      documentText.length > maxLength
        ? documentText.substring(0, maxLength) +
          "\n\n[Document truncated due to length — remaining clauses not shown]"
        : documentText;

    const response = await callGroq([
      {
        role: "system",
        content: CLAUSE_EXTRACTION_PROMPT,
      },
      {
        role: "user",
        content: `Extract all clauses from this Indian legal document and respond in JSON format:\n\n${truncatedText}`,
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

    // Sanitize clauses — ensure all have required fields
    parsed.clauses = parsed.clauses
      .filter((clause) => clause.text && clause.text.trim().length > 0)
      .map((clause, index) => ({
        clause_number: clause.clause_number || index + 1,
        clause_type: clause.clause_type || "general",
        text: clause.text.trim(),
      }));

    // Ensure document_info exists with defaults
    parsed.document_info = {
      detected_type: parsed.document_info?.detected_type || "other",
      detected_jurisdiction: parsed.document_info?.detected_jurisdiction || null,
      entity_name: parsed.document_info?.entity_name || null,
      parties: parsed.document_info?.parties || [],
      agreement_date: parsed.document_info?.agreement_date || null,
      is_stamp_paper: parsed.document_info?.is_stamp_paper || false,
      stamp_value: parsed.document_info?.stamp_value || null,
    };

    console.log(
      `[ClauseWall] Extracted ${parsed.clauses.length} clauses from document`
    );

    return parsed;
  } catch (error) {
    console.error("[ClauseWall] Clause extraction failed:", error);
    throw new Error(
      `Failed to extract clauses: ${(error as Error).message}`
    );
  }
}