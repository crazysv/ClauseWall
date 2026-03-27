// ============================================
// CLAUSEWALL — COMPLAINT EMAIL/LETTER DRAFTER
// AI-powered complaint generation
// ============================================

import type { ComplaintDraft, ComplaintEmailData, LegalAuthority } from "@/types/authority";
import { callGroq, type GroqMessage } from "@/lib/ai/groq-client";

const COMPLAINT_SYSTEM_PROMPT = `You are an expert Indian legal complaint drafter. Draft formal complaints to regulatory authorities.
Return VALID JSON only.

RULES:
1. Use a formal, firm but respectful tone
2. Cite specific laws, sections, and rules violated
3. Include date, reference numbers, and timeline of events
4. State the relief sought clearly
5. Mention that legal action will be pursued if no response within the stated period
6. Keep the complaint concise but thorough (500-800 words)

Return this EXACT JSON format:
{
  "subject": "Clear, descriptive complaint subject line",
  "body": "Full complaint letter body text",
  "attachments_needed": ["List of documents to attach"]
}`;

/**
 * Draft a complaint email/letter to an authority.
 */
export async function draftComplaintEmail(
  authority: LegalAuthority,
  documentContext: {
    document_type: string;
    entity_name: string;
    jurisdiction: string;
    violations: string[];
    summary: string;
    claim_amount?: number;
  },
  complainantName: string,
  complainantAddress: string
): Promise<ComplaintDraft> {
  const userMessage = `Draft a complaint to ${authority.name} (${authority.authority_type}) regarding:

Entity/Company: ${documentContext.entity_name}
Document Type: ${documentContext.document_type}
Jurisdiction: ${documentContext.jurisdiction}
Violations Found:
${documentContext.violations.map((v, i) => `${i + 1}. ${v}`).join("\n")}

Summary: ${documentContext.summary}
${documentContext.claim_amount ? `Claim Amount: ₹${documentContext.claim_amount.toLocaleString("en-IN")}` : ""}

Complainant: ${complainantName}, ${complainantAddress}
Date: ${new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}`;

  const messages: GroqMessage[] = [
    { role: "system", content: COMPLAINT_SYSTEM_PROMPT },
    { role: "user", content: userMessage },
  ];

  try {
    const response = await callGroq(messages, { temperature: 0.2, maxTokens: 3000 });
    const parsed = JSON.parse(response);

    return {
      subject: parsed.subject || `Complaint against ${documentContext.entity_name}`,
      body: parsed.body || "",
      authority_name: authority.name,
      authority_type: authority.authority_type,
      format: "email",
      attachments_needed: parsed.attachments_needed || [
        "Copy of contract/agreement",
        "Legal notice sent (if any)",
        "Supporting evidence",
        "ID proof of complainant",
      ],
    };
  } catch (error) {
    console.error("[ClauseWall] Complaint drafting failed:", error);
    // Fallback template
    return {
      subject: `Complaint against ${documentContext.entity_name} — ${documentContext.document_type} violations`,
      body: generateFallbackComplaint(authority, documentContext, complainantName, complainantAddress),
      authority_name: authority.name,
      authority_type: authority.authority_type,
      format: "email",
      attachments_needed: [
        "Copy of contract/agreement",
        "Legal notice sent (if any)",
        "Supporting evidence / screenshots",
        "ID proof of complainant",
      ],
    };
  }
}

/**
 * Convert a complaint draft to email data (ready for mailto: link).
 */
export function complaintToEmailData(
  draft: ComplaintDraft,
  authorityEmail: string | null,
  ccEmail?: string
): ComplaintEmailData {
  return {
    to: authorityEmail || "",
    subject: draft.subject,
    body: draft.body,
    cc: ccEmail || null,
    attachments_needed: draft.attachments_needed,
  };
}

function generateFallbackComplaint(
  authority: LegalAuthority,
  ctx: { document_type: string; entity_name: string; jurisdiction: string; violations: string[]; summary: string; claim_amount?: number },
  name: string,
  address: string
): string {
  const date = new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });

  return `To,
${authority.presiding_officer_designation || "The Presiding Officer"},
${authority.name},
${authority.physical_address || "[Address]"}

Date: ${date}

Subject: Formal Complaint against ${ctx.entity_name} — Violations of Consumer Rights

Respected Sir/Madam,

I, ${name}, residing at ${address}, hereby lodge this formal complaint against ${ctx.entity_name} for the following violations identified in their ${ctx.document_type} agreement:

${ctx.violations.map((v, i) => `${i + 1}. ${v}`).join("\n")}

Brief Summary:
${ctx.summary}

${ctx.claim_amount ? `The estimated financial impact is ₹${ctx.claim_amount.toLocaleString("en-IN")}.` : ""}

These practices constitute unfair trade practices and deficiency in service. I request your esteemed authority to:

1. Investigate the above violations
2. Direct ${ctx.entity_name} to cease such unfair practices
3. Award appropriate compensation for the damages suffered
4. Impose penalties as deemed appropriate under applicable law

I request you to kindly take cognizance of this complaint and initiate appropriate proceedings. Copies of relevant documents are annexed herewith.

Yours faithfully,
${name}
${address}

Enclosures:
1. Copy of the agreement/contract
2. Supporting evidence
3. Copy of ID proof`;
}
