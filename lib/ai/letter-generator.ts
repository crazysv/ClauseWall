// ============================================
// DEMAND LETTER GENERATOR
// Generates Indian legal notices based on analysis
// ============================================

import { callGroq } from "./groq-client";
import { DEMAND_LETTER_PROMPT } from "./system-prompt";
import type { Clause, DemandLetter } from "@/types";
import { translateText } from "@/lib/bhasha/translator";
import type { SupportedLanguage } from "@/types/bhasha";

/**
 * Generate a demand/legal notice letter based on problematic clauses
 */
export async function generateDemandLetter(
  documentType: string,
  jurisdiction: string,
  entityName: string | null,
  problematicClauses: Clause[],
  marketContext?: {
    clause_type: string;
    median_value: number;
    sample_count: number;
    scope_label: string;
    unit: string;
  }[],
  outputLanguage?: string
): Promise<DemandLetter> {
  try {
    // Build clause summary for the AI
    const clauseSummary = problematicClauses
      .map(
        (c, i) => {
          const mc = marketContext?.find(m => m.clause_type === c.clause_type);
          const marketLine = mc
            ? `\n   Market comparison: The said clause demands a value which is significantly above the prevailing market standard of ${mc.median_value} ${mc.unit} (based on analysis of ${mc.sample_count} similar contracts in ${mc.scope_label}).`
            : '';
          return `${i + 1}. [${c.risk_level.toUpperCase()} — Score: ${c.risk_score}/100]
   Clause: "${c.original_text.substring(0, 300)}${c.original_text.length > 300 ? '...' : ''}"
   Issue: ${c.explanation}
   Law: ${c.legal_citation || "Not specified"}${marketLine}`;
        }
      )
      .join("\n\n");

    const response = await callGroq(
      [
        {
          role: "system",
          content: DEMAND_LETTER_PROMPT,
        },
        {
          role: "user",
          content: `Generate a legal notice in JSON format for the following situation:

Document Type: ${documentType}
Jurisdiction: ${jurisdiction}, India
Addressed To: ${entityName || "[Entity Name]"}

Problematic Clauses Found:
${clauseSummary}

Total problematic clauses: ${problematicClauses.length}
Illegal clauses: ${problematicClauses.filter((c) => c.risk_level === "illegal").length}
Dangerous clauses: ${problematicClauses.filter((c) => c.risk_level === "dangerous").length}

Respond with a JSON object containing the legal notice.`,
        },
      ],
      { maxTokens: 6000 }
    );

    const parsed = JSON.parse(response) as DemandLetter;

    // Validate response
    const result: DemandLetter = {
      subject: parsed.subject || "Legal Notice Regarding Contract Violations",
      body: parsed.body || "Error generating letter content.",
      agencies: Array.isArray(parsed.agencies) ? parsed.agencies : [],
      legal_references: Array.isArray(parsed.legal_references)
        ? parsed.legal_references
        : [],
    };

    // If outputLanguage is non-English, translate body (keep legal refs in English)
    if (outputLanguage && outputLanguage !== "en") {
      try {
        const translatedBody = await translateText(
          result.body,
          "en" as SupportedLanguage,
          outputLanguage as SupportedLanguage
        );
        result.body = translatedBody.translated_text;

        const translatedSubject = await translateText(
          result.subject,
          "en" as SupportedLanguage,
          outputLanguage as SupportedLanguage
        );
        result.subject = translatedSubject.translated_text;
      } catch (err) {
        console.warn("[ClauseWall] Letter translation failed, returning English:", err);
      }
    }

    return result;
  } catch (error) {
    console.error("[ClauseWall] Letter generation failed:", error);
    throw new Error(
      `Failed to generate demand letter: ${(error as Error).message}`
    );
  }
}