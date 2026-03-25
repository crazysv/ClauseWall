// ============================================
// SHADOW ANALYSIS PROMPTS
// All LLM prompts for promise extraction,
// mismatch detection, and legal analysis
// ============================================

/**
 * Promise extraction prompt template
 */
export function getPromiseExtractionPrompt(
  documentType: string,
  entityName: string | null,
  evidenceText: string
): string {
  return `You are analyzing communications (WhatsApp chats, emails, messages, notes) to find PROMISES and COMMITMENTS made by one party to another.

Context: This evidence relates to a ${documentType} agreement.
The other party (promisor) is: ${entityName || 'unknown'}

Evidence text:
${evidenceText.substring(0, 10000)}

Find EVERY promise, commitment, assurance, or representation made. Look for:

1. EXPLICIT PROMISES: 'I will...', 'We will...', 'You will get...', 'hum karenge', 'main karunga', 'aapko milega'
2. ASSURANCES: 'Don't worry about...', 'That's included', 'No extra charges', 'tension mat lo', 'included hai'
3. REPRESENTATIONS: Statements of fact about terms — 'Rent is only X', 'Deposit is X months', 'Notice period is X days', 'Salary will be X', 'WFH available'
4. OFFERS: 'I'm offering...', 'The deal is...', 'Price is...'
5. COMMITMENTS BY IMPLICATION: 'Of course parking is included', 'Obviously maintenance is our responsibility'
6. DENIALS OF NEGATIVES: 'No hidden charges', 'No prepayment penalty', 'No lock-in period'

For EACH promise found, provide:
- promise_text: The exact quote (or close paraphrase) of the promise
- context_text: 1-2 sentences of surrounding context
- promised_by: Who made the promise (name from chat, or 'Other Party')
- promised_to: Who it was made to (usually the user, or 'User')
- date: Date of the promise (from chat timestamp if available, null if unknown)
- category: One of: rent, deposit, maintenance, painting, parking, utilities, notice_period, lock_in, termination, salary, benefits, work_hours, wfh, leave, bonus, hike, non_compete, interest_rate, prepayment, emi, penalty, insurance, refund, timeline, possession, amenities, other
- specific_value: The specific amount/duration/detail if mentioned (e.g., '₹20,000', '2 months', '5 days WFH', 'no penalty')
- confidence: high (explicit promise), medium (likely promise), low (implied)

Return ONLY valid JSON:
{
  "promises": [{
    "promise_text": "...",
    "context_text": "...",
    "promised_by": "...",
    "promised_to": "...",
    "date": "..." or null,
    "category": "...",
    "specific_value": "..." or null,
    "confidence": "high" | "medium" | "low"
  }]
}

Include ALL promises, even minor ones. We filter later.
If no promises found, return { "promises": [] }.
Handle Hindi/Hinglish/regional language text — many Indian communications use mixed English-Hindi.`;
}

/**
 * Mismatch detection prompt template
 */
export function getMismatchDetectionPrompt(
  promises: Array<{
    promise_text: string;
    context_text: string;
    promised_by: string;
    date: string | null;
    specific_value: string | null;
    evidence_type: string;
  }>,
  clauses: Array<{
    clause_number: number;
    original_text: string;
    clause_type: string;
    risk_level: string;
  }>
): string {
  const promiseList = promises.map((p, i) =>
    `Promise #${i + 1}:
  Text: "${p.promise_text}"
  Context: "${p.context_text}"
  By: ${p.promised_by}
  Date: ${p.date || 'unknown'}
  Value: ${p.specific_value || 'none'}
  Source: ${p.evidence_type}`
  ).join('\n\n');

  const clauseList = clauses.map(c =>
    `Clause ${c.clause_number} (${c.clause_type}, ${c.risk_level}):
  "${c.original_text.substring(0, 300)}"`
  ).join('\n\n');

  return `You are a legal analyst comparing verbal/written promises against a formal contract. Determine if there are mismatches.

PROMISES MADE:
${promiseList}

CONTRACT CLAUSES:
${clauseList}

For each promise, determine if it matches or contradicts the contract. Analyze each promise separately.

For each promise, return:
- promise_index: The promise number (1-based)
- has_mismatch: true if there is ANY discrepancy
- matched_clause_number: The clause number that relates to this promise (null if no matching clause found — that means the promise is MISSING from the contract)
- mismatch_type: One of: direct_contradiction, missing_promise, weakened_promise, hidden_condition, amount_mismatch, timeline_mismatch, scope_mismatch
- severity: critical (major financial/fundamental term), major (significant), minor (small difference), info (noted but not actionable)
- promise_says: What was promised (simple words)
- contract_says: What the contract says (simple words), or "Not mentioned in contract" if missing
- explanation: Human-readable explanation
- financial_impact: Number (₹ amount if quantifiable) or null
- financial_description: Text description of financial impact or null
- recommendation: What the user should do

Return ONLY valid JSON:
{
  "results": [{
    "promise_index": 1,
    "has_mismatch": true,
    "matched_clause_number": 8,
    "mismatch_type": "direct_contradiction",
    "severity": "critical",
    "promise_says": "...",
    "contract_says": "...",
    "explanation": "...",
    "financial_impact": null,
    "financial_description": null,
    "recommendation": "..."
  }]
}

Be conservative — flag as mismatch when in doubt. False positives are better than false negatives.
If a promise has no matching clause at all, that is a "missing_promise" mismatch.`;
}

/**
 * Legal significance analysis prompt template
 */
export function getLegalSignificancePrompt(
  mismatches: Array<{
    index: number;
    promise_text: string;
    contract_says: string;
    evidence_type: string;
    date: string | null;
  }>,
  evidenceTypes: string[]
): string {
  const mismatchList = mismatches.map(m =>
    `#${m.index}: "${m.promise_text}" vs "${m.contract_says}"
  Evidence: ${m.evidence_type} from ${m.date || 'unknown date'}`
  ).join('\n');

  return `You are an Indian legal expert analyzing the enforceability of verbal/written promises that contradict a formal contract.

EVIDENCE TYPES AVAILABLE: ${evidenceTypes.join(', ')}

MISMATCHES FOUND:
${mismatchList}

For EACH mismatch, determine LEGAL SIGNIFICANCE under Indian law:

1. ENFORCEABILITY:
   - strongly_enforceable: Written evidence (WhatsApp/email under IT Act 2000 Section 65B). Clear promise. Section 92 Proviso allows challenge.
   - moderately_enforceable: Some evidence but general/vague promise.
   - weakly_enforceable: Oral only, no Section 65B certificate.
   - not_enforceable: Parol Evidence Rule (Section 92) bars. Entire agreement clause.
   - needs_legal_review: Complex situation.

2. APPLICABLE LAWS (select only relevant):
   - Indian Evidence Act, 1872: Sections 91, 92, 92 Provisos 1-3
   - Indian Contract Act, 1872: Sections 17, 18, 19, 19A
   - IT Act, 2000: Sections 65A, 65B
   - Consumer Protection Act, 2019: Sections 2(47), 2(9)
   - Specific Relief Act, 1963: Section 15

3. EVIDENCE STRENGTH: Brief note on how strong the evidence is.

4. RELEVANT PRECEDENTS: Any Supreme Court or High Court cases (e.g., Ambalal Sarabhai Enterprise Ltd v KS Infraspace LLP for WhatsApp evidence).

Return ONLY valid JSON:
{
  "analyses": [{
    "mismatch_index": 0,
    "enforceability": "strongly_enforceable",
    "applicable_laws": [{ "act": "...", "section": "...", "relevance": "..." }],
    "reasoning": "...",
    "evidence_strength": "...",
    "precedent_cases": ["case name"]
  }]
}`;
}

/**
 * Summary generation prompt
 */
export function getShadowSummaryPrompt(
  entityName: string | null,
  totalPromises: number,
  totalMismatches: number,
  criticalCount: number,
  evidenceTypes: string[],
  topMismatch: string | null
): string {
  return `Generate a 2-3 sentence summary of this shadow agreement analysis.

Entity: ${entityName || 'The other party'}
Total promises found: ${totalPromises}
Total mismatches: ${totalMismatches}
Critical mismatches: ${criticalCount}
Evidence types: ${evidenceTypes.join(', ')}
Most critical mismatch: ${topMismatch || 'none'}

Write in simple English that an Indian user can understand. Include:
1. How many promises were checked
2. How many don't match the contract
3. The most critical finding (if any)
4. The strongest evidence type

Return ONLY the summary text, no JSON, no formatting.`;
}
