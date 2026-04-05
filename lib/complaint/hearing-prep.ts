// ============================================
// HEARING PREPARATION — AI-POWERED
// Prepares complainant for hearings
// ============================================

import { callGroq } from '@/lib/ai/groq-client';
import { HEARING_PREP_PROMPT } from './prompts';
import type { ComplaintFiling } from '@/types';
import { getAuthorityTypeLabel } from './authority-data';
import { safeParseJson, safeString, safeStringArray, safeArrayMap } from '@/lib/ai/output-guards';

interface HearingPrepResult {
  documents_to_carry: string[];
  what_to_expect: string;
  what_to_say: string;
  counter_arguments: Array<{ they_say: string; you_say: string }>;
  tips: string[];
}

const DEFAULT_HEARING_PREP: HearingPrepResult = {
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

  const parsed = safeParseJson(response);
  if (!parsed) {
    console.error('[ClauseWall] Hearing prep JSON parse failed');
    return DEFAULT_HEARING_PREP;
  }

  return {
    documents_to_carry: safeStringArray(parsed.documents_to_carry).length > 0
      ? safeStringArray(parsed.documents_to_carry)
      : DEFAULT_HEARING_PREP.documents_to_carry,
    what_to_expect: safeString(parsed.what_to_expect, DEFAULT_HEARING_PREP.what_to_expect),
    what_to_say: safeString(parsed.what_to_say, DEFAULT_HEARING_PREP.what_to_say),
    counter_arguments: safeArrayMap(parsed.counter_arguments, (ca) => {
      const item = ca as Record<string, unknown> | null;
      if (!item) return null;
      return {
        they_say: safeString(item.they_say, ''),
        you_say: safeString(item.you_say, ''),
      };
    }),
    tips: safeStringArray(parsed.tips).length > 0
      ? safeStringArray(parsed.tips)
      : DEFAULT_HEARING_PREP.tips,
  };
}
