// ============================================
// ACTION GENERATOR — AI-Powered Legal Document Generation
// Uses Groq to generate joint notices, complaints, RTI applications
// ============================================

import { callGroq } from "@/lib/ai/groq-client";
import type {
  Collective,
  CommonViolation,
  CollectiveActionType,
  MediaReport,
} from "@/types";

const COLLECTIVE_DOCUMENT_PROMPT = `You are an expert Indian legal document generator specializing in collective/group legal actions.

You generate professional legal documents in JSON format. Documents must:
1. Be legally accurate under Indian law
2. Reference specific statutes and sections
3. Use formal legal language
4. Include placeholders for personal details as [PLACEHOLDER]
5. Never include individual member identities — use collective identity only
6. Be addressed from "Members of [Collective Name]" or "Affected Consumers/Tenants/Employees"

For legal notices: Follow Section 80 CPC format.
For consumer complaints: Follow Consumer Protection Act 2019 format.
For RTI applications: Follow Right to Information Act 2005 format.
For media reports: Use investigative journalism format.

Respond ONLY with valid JSON.`;

/**
 * Generate a collective legal document based on action type
 */
export async function generateCollectiveDocument(
  collective: Collective,
  actionType: CollectiveActionType,
  additionalContext?: string
): Promise<string> {
  try {
    const violationSummary = collective.common_violations
      .slice(0, 5)
      .map(
        (v: CommonViolation, i: number) =>
          `${i + 1}. ${v.clause_type}: ${v.violation_description} (${v.occurrence_count} occurrences${v.legal_citation ? `, ${v.legal_citation}` : ""})`
      )
      .join("\n");

    const prompts: Record<string, string> = {
      joint_legal_notice: `Generate a joint legal notice in JSON format with fields: {subject, body, legal_references[], agencies[], deadline_days}.

Details:
- From: ${collective.member_count} affected individuals (collective)
- Against: ${collective.entity_name} (${collective.entity_type})
- Jurisdiction: ${collective.primary_jurisdiction}, India
- Document Type: ${collective.document_type}
- Total Financial Exposure: ₹${(collective.total_financial_exposure || 0).toLocaleString("en-IN")}

Common Violations:
${violationSummary}

${additionalContext ? `Additional Context: ${additionalContext}` : ""}

Generate a formal legal notice under Section 80 CPC / Consumer Protection Act 2019.`,

      consumer_forum_complaint: `Generate a consumer forum complaint in JSON format with fields: {title, complaint_body, reliefs_sought[], legal_citations[], supporting_facts[], prayer}.

Details:
- Complainants: ${collective.member_count} affected consumers (representative complaint under Section 35(1)(c) of Consumer Protection Act 2019)
- Opposite Party: ${collective.entity_name} (${collective.entity_type})
- Jurisdiction: ${collective.primary_jurisdiction}, India
- Total Financial Exposure: ₹${(collective.total_financial_exposure || 0).toLocaleString("en-IN")}

Common Violations:
${violationSummary}

${additionalContext ? `Additional Context: ${additionalContext}` : ""}`,

      rti_application: `Generate an RTI application in JSON format with fields: {subject, applicant_description, questions[], department, fee_details, legal_basis}.

Details:
- Applicant: Concerned Citizens collective (${collective.member_count} members)
- Entity Under Query: ${collective.entity_name} (${collective.entity_type})
- Jurisdiction: ${collective.primary_jurisdiction}, India

Common Issues:
${violationSummary}

Generate questions to expose regulatory compliance failures.
${additionalContext ? `Additional Context: ${additionalContext}` : ""}`,

      media_report: `Generate an investigative media report brief in JSON format with fields: {title, subtitle, summary, key_findings[], statistics[], affected_demographics, legal_implications, recommendations[], contact_for_comment}.

Details:
- Entity: ${collective.entity_name} (${collective.entity_type})
- Affected People: ${collective.member_count}
- Total Financial Impact: ₹${(collective.total_financial_exposure || 0).toLocaleString("en-IN")}
- Primary Jurisdiction: ${collective.primary_jurisdiction}

Common Violations:
${violationSummary}

${additionalContext ? `Additional Context: ${additionalContext}` : ""}`,

      authority_complaint: `Generate a complaint to regulatory authority in JSON format with fields: {subject, body, authority_name, legal_basis[], evidence_summary, relief_sought, urgency}.

Details:
- From: ${collective.member_count} affected parties
- Against: ${collective.entity_name} (${collective.entity_type})
- Jurisdiction: ${collective.primary_jurisdiction}, India

Common Violations:
${violationSummary}

${additionalContext ? `Additional Context: ${additionalContext}` : ""}`,

      negotiation_demand: `Generate a collective negotiation demand letter in JSON format with fields: {subject, body, demands[], deadline_days, consequences[], legal_backing[]}.

Details:
- From: ${collective.member_count} affected individuals
- To: ${collective.entity_name} (${collective.entity_type})
- Jurisdiction: ${collective.primary_jurisdiction}, India

Common Violations:
${violationSummary}

${additionalContext ? `Additional Context: ${additionalContext}` : ""}`,
    };

    const prompt = prompts[actionType] || prompts.joint_legal_notice;

    const response = await callGroq(
      [
        { role: "system", content: COLLECTIVE_DOCUMENT_PROMPT },
        { role: "user", content: prompt },
      ],
      { maxTokens: 6000 }
    );

    return response;
  } catch (error) {
    console.error("[ClauseWall] [Collective] Document generation error:", error);

    // Return a fallback template
    const fallback = {
      subject: `Collective ${actionType.replace(/_/g, " ")} regarding ${collective.entity_name}`,
      body: `This document is being generated on behalf of ${collective.member_count} affected individuals against ${collective.entity_name}. The entity has been flagged for ${collective.common_violations.length} types of violations. Please consult a lawyer before using this template.`,
      error: "AI generation failed. Please retry or consult a legal professional.",
    };
    return JSON.stringify(fallback);
  }
}
