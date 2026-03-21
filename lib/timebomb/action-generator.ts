// ============================================
// ACTION LETTER GENERATOR
// AI-powered generation of legal action letters
// for contract deadlines.
// ============================================

import { callGroq } from "@/lib/ai/groq-client";
import type { ContractDeadline } from "@/types";

const ACTION_LETTER_PROMPT = `You are an Indian legal document expert. Generate a formal action letter/legal notice for the following contract deadline.

The letter MUST:
1. Be in standard Indian legal notice format
2. Reference the specific contract details provided
3. Address the counterparty
4. State the specific clause being invoked
5. Cite applicable Indian law (e.g., Indian Contract Act 1872, Transfer of Property Act 1882, RERA 2016, etc.)
6. State the action being taken clearly
7. Include a 15-day deadline for response/compliance
8. Note that the letter is being sent via Registered Post / Speed Post with Acknowledgement Due
9. Include [YOUR NAME], [YOUR ADDRESS], [DATE], [PLACE] placeholders for the sender
10. Be professional, firm, and legally sound

Format the letter as:
- "LEGAL NOTICE" header (or appropriate header for the action type)
- Date: [DATE]
- Place: [PLACE]
- To: [counterparty details]
- Subject: [specific subject]
- Ref: [contract reference]
- Body paragraphs (facts → legal basis → demand → deadline → consequences)
- Signature block with [YOUR NAME] and [YOUR ADDRESS]
- "Sent via Registered Post AD / Speed Post"

Return ONLY the letter text. No JSON wrapping. No markdown formatting. Plain text only.`;

/**
 * Generate a contextual action letter for a deadline
 */
export async function generateActionTemplate(
  deadline: ContractDeadline,
  documentInfo: {
    entity_name: string;
    document_type: string;
    jurisdiction: string;
  },
  signingDate: string
): Promise<string> {
  try {
    // Skip if no action needed
    if (!deadline.action_required || deadline.action_required === "none") {
      return "";
    }

    const response = await callGroq(
      [
        { role: "system", content: ACTION_LETTER_PROMPT },
        {
          role: "user",
          content: `Generate a ${getLetterTypeLabel(deadline.deadline_type)} for:

Contract Details:
- Type: ${documentInfo.document_type}
- Jurisdiction: ${documentInfo.jurisdiction}
- Counterparty: ${documentInfo.entity_name || "[COUNTERPARTY NAME]"}
- Signed on: ${signingDate}

Deadline Details:
- Type: ${deadline.deadline_type}
- Title: ${deadline.title}
- Description: ${deadline.description}
- Deadline Date: ${deadline.deadline_date}
- Action Required: ${deadline.action_required}
- Financial Impact: ${deadline.financial_description || "Not specified"}
- Consequence if Missed: ${deadline.consequence_if_missed}
- Severity: ${deadline.consequence_severity}

Generate the complete letter. The user should only need to fill in their name, address, date, and sign.`,
        },
      ],
      {
        temperature: 0.1,
        maxTokens: 2048,
      }
    );

    // The response is plain text (not JSON mode for letters)
    // But our groq-client forces JSON mode. So we parse the JSON response
    // and extract the content.
    try {
      const parsed = JSON.parse(response);
      // The AI might return { "letter": "..." } or { "content": "..." } or just the text in a field
      const letter =
        parsed.letter ||
        parsed.content ||
        parsed.text ||
        parsed.notice ||
        parsed.legal_notice ||
        JSON.stringify(parsed, null, 2);
      return typeof letter === "string" ? letter : JSON.stringify(letter, null, 2);
    } catch {
      // If it's not JSON, return as-is
      return response;
    }
  } catch (error) {
    console.error("[TimeBomb] Action letter generation failed:", error);

    // Return a basic fallback template
    return generateFallbackTemplate(deadline, documentInfo, signingDate);
  }
}

/**
 * Get human-readable letter type label
 */
function getLetterTypeLabel(deadlineType: string): string {
  switch (deadlineType) {
    case "notice_period":
    case "termination_window":
      return "termination notice / notice of intent to vacate";
    case "renewal_window":
    case "auto_renewal":
      return "notice of non-renewal / rejection of auto-renewal";
    case "lock_in_expiry":
      return "notice regarding lock-in period expiry";
    case "grace_period":
      return "formal notice regarding grace period";
    case "payment_due":
      return "payment reminder notice";
    case "penalty_trigger":
      return "notice to avoid penalty imposition";
    default:
      return "formal legal notice";
  }
}

/**
 * Generate a basic fallback template when AI fails
 */
function generateFallbackTemplate(
  deadline: ContractDeadline,
  documentInfo: {
    entity_name: string;
    document_type: string;
    jurisdiction: string;
  },
  signingDate: string
): string {
  return `LEGAL NOTICE

Date: [DATE]
Place: [PLACE]

To,
${documentInfo.entity_name || "[COUNTERPARTY NAME]"}
[COUNTERPARTY ADDRESS]

Subject: ${deadline.title}

Ref: ${documentInfo.document_type} Agreement dated ${signingDate}

Dear Sir/Madam,

I am writing to you in reference to the above-mentioned agreement.

${deadline.description}

As per the terms of our agreement, I am required to: ${deadline.action_required}

The deadline for this action is: ${deadline.deadline_date}

${deadline.financial_description ? `Financial implications: ${deadline.financial_description}` : ""}

${deadline.consequence_if_missed ? `Please note that failure to comply may result in: ${deadline.consequence_if_missed}` : ""}

You are hereby called upon to comply with the above within 15 (fifteen) days of receipt of this notice, failing which I shall be constrained to initiate appropriate legal proceedings without any further notice, at your risk and cost.

This notice is being issued without prejudice to my other rights and remedies available under law.

Yours faithfully,

[YOUR NAME]
[YOUR ADDRESS]
[CONTACT NUMBER]

Sent via Registered Post AD / Speed Post
`;
}
