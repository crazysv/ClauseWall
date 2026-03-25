// ============================================
// COMPLAINT GENERATOR
// AI-powered complaint document creation
// ============================================

import { callGroq } from '@/lib/ai/groq-client';
import { COMPLAINT_GENERATION_PROMPT, AFFIDAVIT_TEMPLATE, SYNOPSIS_TEMPLATE } from './prompts';
import type { ComplaintDocument, ComplaintFiling, AuthorityType } from '@/types';

interface GenerateInput {
  authorityType: AuthorityType;
  complainantName: string;
  complainantAddress: string;
  complainantPhone: string;
  respondentName: string;
  respondentAddress: string;
  respondentType: string;
  claimAmount: number;
  contractClauses: Array<{
    clause_number: number;
    clause_type: string;
    risk_level: string;
    original_text: string;
    explanation: string;
    legal_citation: string | null;
  }>;
  documentType: string;
  jurisdiction: string;
  overallRiskScore: number;
  additionalContext?: string;
}

/**
 * Generate formal complaint document using AI + templates
 */
export async function generateComplaint(input: GenerateInput): Promise<{
  complaint: ComplaintDocument;
  affidavit: ComplaintDocument;
  synopsis: ComplaintDocument;
  reliefItems: string[];
  factsCount: number;
  citations: string[];
}> {
  // Build clause context
  const clauseContext = input.contractClauses
    .filter(c => c.risk_level === 'dangerous' || c.risk_level === 'illegal')
    .map(c =>
      `[Clause #${c.clause_number}] (Type: ${c.clause_type}, Risk: ${c.risk_level})\n` +
      `Text: "${c.original_text}"\n` +
      `Violation: ${c.explanation}\n` +
      `Legal Citation: ${c.legal_citation || 'None'}`
    )
    .join('\n\n---\n\n');

  const response = await callGroq(
    [
      { role: 'system', content: COMPLAINT_GENERATION_PROMPT },
      {
        role: 'user',
        content: `Generate a formal complaint for filing at ${input.authorityType}.

COMPLAINANT: ${input.complainantName}, ${input.complainantAddress}, Phone: ${input.complainantPhone}
RESPONDENT: ${input.respondentName} (${input.respondentType}), ${input.respondentAddress}
CLAIM AMOUNT: ₹${input.claimAmount.toLocaleString('en-IN')}
DOCUMENT TYPE: ${input.documentType}
JURISDICTION: ${input.jurisdiction}
OVERALL RISK SCORE: ${input.overallRiskScore}/100

DANGEROUS/ILLEGAL CLAUSES:
${clauseContext}

${input.additionalContext ? `ADDITIONAL CONTEXT:\n${input.additionalContext}` : ''}`,
      },
    ],
    { maxTokens: 6000 }
  );

  let parsed;
  try {
    let cleaned = response.trim();
    if (cleaned.startsWith('```json')) cleaned = cleaned.slice(7);
    if (cleaned.startsWith('```')) cleaned = cleaned.slice(3);
    if (cleaned.endsWith('```')) cleaned = cleaned.slice(0, -3);
    parsed = JSON.parse(cleaned.trim());
  } catch {
    console.error('[ClauseWall] Complaint generation JSON parse failed');
    parsed = {
      complaint_text: response,
      document_type: 'consumer_complaint_form',
      fields: {},
      relief_items: [`Compensation of ₹${input.claimAmount.toLocaleString('en-IN')}`],
      facts_count: 5,
      citations: [],
    };
  }

  const today = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });

  // Generate complaint document
  const complaint: ComplaintDocument = {
    id: `complaint-${Date.now()}`,
    type: parsed.document_type || 'consumer_complaint_form',
    title: `Complaint — ${input.complainantName} v. ${input.respondentName}`,
    content: String(parsed.complaint_text || ''),
    pdf_url: null,
    fields: parsed.fields || {},
    format_notes: 'Print on A4 paper, file 3 copies (1 for Forum, 1 for each Opposite Party, 1 for self)',
  };

  // Generate affidavit
  const affidavitContent = AFFIDAVIT_TEMPLATE
    .replace('{complainant_name}', input.complainantName)
    .replace('{age}', '___')
    .replace('{relation}', 'S/o / D/o / W/o')
    .replace('{parent_name}', '___')
    .replace('{address}', input.complainantAddress)
    .replace('{city}', input.jurisdiction)
    .replace('{date}', today);

  const affidavit: ComplaintDocument = {
    id: `affidavit-${Date.now()}`,
    type: 'affidavit',
    title: 'Affidavit in Support of Complaint',
    content: affidavitContent,
    pdf_url: null,
    fields: { complainant_name: input.complainantName, date: today },
    format_notes: 'Must be notarized. Notary fee: ₹50-₹200. Take original ID proof.',
  };

  // Generate synopsis / index
  const synopsis: ComplaintDocument = {
    id: `synopsis-${Date.now()}`,
    type: 'synopsis',
    title: 'Synopsis & Index of Documents',
    content: SYNOPSIS_TEMPLATE
      .replace('{complaint_pages}', '3-6')
      .replace('{affidavit_page}', '7')
      .replace('{contract_pages}', '8-15')
      .replace('{report_pages}', '16-20')
      .replace('{id_page}', '21')
      .replace('{additional_docs}', '')
      .replace('{total_pages}', '~21')
      .replace('{complaint_summary}', `unfair trade practices and deficiency in service by ${input.respondentName}`)
      .replace('{relief_summary}', (parsed.relief_items || []).join('\n')),
    pdf_url: null,
    fields: {},
    format_notes: 'Place this as the first page of the complaint bundle',
  };

  return {
    complaint,
    affidavit,
    synopsis,
    reliefItems: Array.isArray(parsed.relief_items) ? parsed.relief_items.map(String) : [],
    factsCount: Number(parsed.facts_count) || 5,
    citations: Array.isArray(parsed.citations) ? parsed.citations.map(String) : [],
  };
}
