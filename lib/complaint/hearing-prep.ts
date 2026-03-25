// ============================================
// HEARING PREPARATION — AI-POWERED
// Prepares complainant for hearings
// ============================================

import { callGroq } from '@/lib/ai/groq-client';
import { HEARING_PREP_PROMPT } from './prompts';
import type { ComplaintFiling } from '@/types';
import { getAuthorityTypeLabel } from './authority-data';

interface HearingPrepResult {
  documents_to_carry: string[];
  what_to_expect: string;
  what_to_say: string;
  counter_arguments: Array<{ they_say: string; you_say: string }>;
  tips: string[];
}

/**
 * Generate hearing preparation advice
 */
export async function prepareForHearing(
  filing: ComplaintFiling
): Promise<HearingPrepResult> {
  const authorityLabel = getAuthorityTypeLabel(filing.authority_type);

  const response = await callGroq(
    [
      { role: 'system', content: HEARING_PREP_PROMPT },
      {
        role: 'user',
        content: `Prepare the complainant for a hearing at:
Authority: ${authorityLabel}
Case Number: ${filing.case_number || 'Not yet assigned'}
Hearing Date: ${filing.next_hearing_date || 'TBD'}

Complaint Title: ${filing.complaint_title}
Complainant: ${filing.complainant_name}
Respondent: ${filing.respondent_name} (${filing.respondent_type})
Claim Amount: ₹${filing.claim_amount.toLocaleString('en-IN')}

Facts: ${filing.facts_of_case || 'See complaint document'}

Legal Grounds: ${(filing.legal_grounds || []).join(', ')}

Relief Sought:
${(filing.relief_sought || []).join('\n')}

Previous Hearings: ${filing.hearing_history?.length ? filing.hearing_history.map(h => `${h.date}: ${h.summary || 'No notes'}`).join('; ') : 'First hearing'}`,
      },
    ],
    { maxTokens: 3000 }
  );

  let parsed: HearingPrepResult;
  try {
    let cleaned = response.trim();
    if (cleaned.startsWith('```json')) cleaned = cleaned.slice(7);
    if (cleaned.startsWith('```')) cleaned = cleaned.slice(3);
    if (cleaned.endsWith('```')) cleaned = cleaned.slice(0, -3);
    parsed = JSON.parse(cleaned.trim());
  } catch {
    parsed = {
      documents_to_carry: [
        'Original complaint (2 extra copies)',
        'All supporting documents (2 copies each)',
        'ID proof (Aadhaar/PAN)',
        'Previous hearing orders (if any)',
        'Evidence of payments/transactions',
      ],
      what_to_expect: 'The hearing typically lasts 15-30 minutes. Both parties present their case. The Judge/President may ask questions. Be prepared for adjournments.',
      what_to_say: 'State your case briefly and clearly. Reference specific clause violations and legal sections. Emphasize the financial loss and unfair practices.',
      counter_arguments: [
        { they_say: 'The contract was signed voluntarily', you_say: 'Consent obtained through unequal bargaining power and unfair terms under CPA 2019 §2(46)' },
        { they_say: 'The terms are standard industry practice', you_say: 'Standard practice does not make illegal clauses legal — Section 23 of Indian Contract Act' },
      ],
      tips: [
        'Dress formally — business attire',
        'Arrive 30 minutes early',
        'Address the bench as "Sir" or "Madam"',
        'Stand when speaking',
        'Do not interrupt when the other party is speaking',
        'Bring a pen and notebook to take notes',
        'Stay calm and factual — emotions weaken your case',
      ],
    };
  }

  return {
    documents_to_carry: Array.isArray(parsed.documents_to_carry)
      ? parsed.documents_to_carry.map(String)
      : ['Complaint copies', 'ID proof', 'Supporting documents'],
    what_to_expect: String(parsed.what_to_expect || ''),
    what_to_say: String(parsed.what_to_say || ''),
    counter_arguments: Array.isArray(parsed.counter_arguments)
      ? parsed.counter_arguments.map(ca => ({
          they_say: String(ca.they_say || ''),
          you_say: String(ca.you_say || ''),
        }))
      : [],
    tips: Array.isArray(parsed.tips) ? parsed.tips.map(String) : [],
  };
}
