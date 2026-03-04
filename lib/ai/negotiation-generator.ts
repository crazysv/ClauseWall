// ============================================
// NEGOTIATION PLAYBOOK GENERATOR
// Generates complete playbook from analyzed clauses
// ============================================

import { callGroq, GroqMessage } from "@/lib/ai/groq-client";
import {
  NEGOTIATION_SYSTEM_PROMPT,
  buildNegotiationUserPrompt,
} from "@/lib/ai/negotiation-prompt";
import type { NegotiationPlaybook, NegotiationScript } from "@/types";

interface ClauseInput {
  clause_number: number;
  clause_type: string;
  risk_level: string;
  original_text: string;
  explanation: string;
  legal_citation: string | null;
  fair_alternative: string | null;
  negotiation_script: string | null;
}

export interface GeneratePlaybookResult {
  success: boolean;
  playbook: NegotiationPlaybook | null;
  error?: string;
}

/**
 * Generate a complete negotiation playbook for a document
 */
export async function generateNegotiationPlaybook(
  documentType: string,
  jurisdiction: string,
  entityName: string | null,
  clauses: ClauseInput[]
): Promise<GeneratePlaybookResult> {
  try {
    // Filter to only risky clauses
    const riskyClauses = clauses.filter(
      (c) => c.risk_level === "illegal" || c.risk_level === "dangerous" || c.risk_level === "warning"
    );

    if (riskyClauses.length === 0) {
      return {
        success: true,
        playbook: {
          document_type: documentType,
          jurisdiction,
          entity_name: entityName,
          total_issues: 0,
          priority_order: "No issues to negotiate",
          scripts: [],
          general_tips: ["This contract appears fair. No negotiation needed."],
          opening_approach: "",
          closing_statement: "",
        },
      };
    }

    // Sort by risk: illegal > dangerous > warning
    const riskOrder: Record<string, number> = { illegal: 0, dangerous: 1, warning: 2 };
    const sorted = [...riskyClauses].sort(
      (a, b) => (riskOrder[a.risk_level] ?? 3) - (riskOrder[b.risk_level] ?? 3)
    );

    // Limit to 10 clauses to stay within token limits
    const limited = sorted.slice(0, 10);

    // Build prompt
    const userPrompt = buildNegotiationUserPrompt(
      documentType,
      jurisdiction,
      entityName,
      limited
    );

    const messages: GroqMessage[] = [
      { role: "system", content: NEGOTIATION_SYSTEM_PROMPT },
      { role: "user", content: userPrompt },
    ];

    console.log(`[ClauseWall] Generating negotiation playbook for ${limited.length} clauses...`);

    const rawResponse = await callGroq(messages, {
      temperature: 0.4,
      maxTokens: 8192,
      retries: 3,
    });

    // Parse response
    let parsed: any;
    try {
      parsed = JSON.parse(rawResponse);
    } catch {
      console.error("[ClauseWall] Failed to parse negotiation response");
      return {
        success: false,
        playbook: null,
        error: "AI returned invalid response. Please try again.",
      };
    }

    // Validate
    if (!parsed.scripts || !Array.isArray(parsed.scripts)) {
      return {
        success: false,
        playbook: null,
        error: "AI generated incomplete playbook. Please try again.",
      };
    }

    // Build playbook
    const playbook: NegotiationPlaybook = {
      document_type: documentType,
      jurisdiction,
      entity_name: entityName,
      total_issues: parsed.scripts.length,
      priority_order: `${riskyClauses.filter((c) => c.risk_level === "illegal").length} illegal, ${riskyClauses.filter((c) => c.risk_level === "dangerous").length} dangerous, ${riskyClauses.filter((c) => c.risk_level === "warning").length} warning`,
      scripts: parsed.scripts as NegotiationScript[],
      general_tips: parsed.general_tips || [],
      opening_approach: parsed.opening_approach || "",
      closing_statement: parsed.closing_statement || "",
    };

    console.log(`[ClauseWall] Playbook generated: ${playbook.total_issues} scripts`);

    return {
      success: true,
      playbook,
    };
  } catch (error: any) {
    console.error("[ClauseWall] Playbook generation failed:", error);
    return {
      success: false,
      playbook: null,
      error: error.message || "Failed to generate playbook",
    };
  }
}