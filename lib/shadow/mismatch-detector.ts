// ============================================
// MISMATCH DETECTOR — CROSS-REFERENCE ENGINE
// Matches extracted promises against contract
// clauses to find contradictions
// ============================================

import { callGroq } from '@/lib/ai/groq-client';
import { getMismatchDetectionPrompt } from './prompts';
import type { ExtractedPromise, Clause, ContractMismatch, MismatchType, MismatchSeverity } from '@/types';

const BATCH_SIZE = 3; // Promises per Groq call
const DELAY_BETWEEN_CALLS_MS = 500;

// Category → clause_type mapping
const CATEGORY_TO_CLAUSE_TYPE: Record<string, string[]> = {
  rent: ['rent', 'monthly_rent', 'rental_amount'],
  deposit: ['security_deposit', 'deposit', 'earnest_money'],
  maintenance: ['maintenance', 'maintenance_charges', 'upkeep'],
  painting: ['painting_charges', 'painting', 'restoration'],
  parking: ['parking', 'parking_allocation', 'vehicle'],
  utilities: ['utilities', 'electricity', 'water'],
  notice_period: ['notice_period', 'termination_notice', 'notice'],
  lock_in: ['lock_in', 'lock_in_period', 'minimum_stay'],
  termination: ['termination', 'exit', 'early_termination'],
  salary: ['compensation', 'salary', 'remuneration', 'ctc'],
  benefits: ['benefits', 'perks', 'allowances'],
  work_hours: ['work_hours', 'working_hours', 'office_hours'],
  wfh: ['work_from_home', 'wfh', 'remote_work', 'work_hours'],
  leave: ['leave', 'holidays', 'annual_leave'],
  bonus: ['bonus', 'incentive', 'performance_bonus'],
  hike: ['increment', 'salary_hike', 'appraisal'],
  non_compete: ['non_compete', 'restrictive_covenant'],
  interest_rate: ['interest_rate', 'interest', 'roi'],
  prepayment: ['prepayment', 'foreclosure', 'early_repayment'],
  emi: ['emi', 'installment', 'monthly_payment'],
  penalty: ['penalty', 'fine', 'liquidated_damages'],
  insurance: ['insurance', 'coverage'],
  refund: ['refund', 'return', 'cancellation'],
  timeline: ['timeline', 'schedule', 'delivery', 'possession'],
  possession: ['possession', 'handover', 'delivery'],
  amenities: ['amenities', 'facilities', 'common_areas'],
};

/**
 * Find potentially matching clauses for a promise category
 */
function findMatchingClauses(
  category: string,
  promiseText: string,
  clauses: Clause[]
): Clause[] {
  const matches: Clause[] = [];

  // Match by category → clause_type mapping
  const mappedTypes = CATEGORY_TO_CLAUSE_TYPE[category] || [];
  for (const clause of clauses) {
    const clauseTypeLower = clause.clause_type.toLowerCase();
    if (mappedTypes.some(t => clauseTypeLower.includes(t))) {
      matches.push(clause);
    }
  }

  // Also do keyword overlap matching
  const promiseWords = promiseText.toLowerCase().split(/\s+/).filter(w => w.length > 3);
  for (const clause of clauses) {
    if (matches.includes(clause)) continue;

    const clauseTextLower = clause.original_text.toLowerCase();
    const overlapCount = promiseWords.filter(w => clauseTextLower.includes(w)).length;
    const overlapRatio = promiseWords.length > 0 ? overlapCount / promiseWords.length : 0;

    if (overlapRatio > 0.2 || overlapCount >= 3) {
      matches.push(clause);
    }
  }

  return matches.slice(0, 5); // Max 5 candidate clauses per promise
}

/**
 * Generate unique mismatch ID
 */
function generateMismatchId(): string {
  return `mm_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Detect mismatches between promises and contract clauses
 */
export async function detectMismatches(
  promises: ExtractedPromise[],
  clauses: Clause[],
  documentType: string,
  jurisdiction: string
): Promise<ContractMismatch[]> {
  try {
    if (promises.length === 0) return [];

    console.log(
      `[ClauseWall] Mismatch Detector: Checking ${promises.length} promises against ${clauses.length} clauses`
    );

    // Pre-compute matching clauses for each promise
    const promiseWithClauses = promises.map(promise => ({
      promise,
      matchedClauses: findMatchingClauses(promise.category, promise.promise_text, clauses),
    }));

    const allMismatches: ContractMismatch[] = [];

    // Batch promises for Groq calls
    for (let i = 0; i < promiseWithClauses.length; i += BATCH_SIZE) {
      const batch = promiseWithClauses.slice(i, i + BATCH_SIZE);

      try {
        // Build batch prompt data
        const batchPromises = batch.map(({ promise }) => ({
          promise_text: promise.promise_text,
          context_text: promise.context_text,
          promised_by: promise.promised_by,
          date: promise.date,
          specific_value: promise.specific_value,
          evidence_type: 'evidence',
        }));

        // Collect all relevant clauses for the batch
        const relevantClauseIds = new Set<string>();
        const relevantClauses: Array<{
          clause_number: number;
          original_text: string;
          clause_type: string;
          risk_level: string;
        }> = [];

        for (const { matchedClauses } of batch) {
          for (const clause of matchedClauses) {
            if (!relevantClauseIds.has(clause.id)) {
              relevantClauseIds.add(clause.id);
              relevantClauses.push({
                clause_number: clause.clause_number,
                original_text: clause.original_text,
                clause_type: clause.clause_type,
                risk_level: clause.risk_level,
              });
            }
          }
        }

        // If no clauses match any promise in this batch, all are "missing"
        if (relevantClauses.length === 0) {
          for (const { promise } of batch) {
            allMismatches.push({
              id: generateMismatchId(),
              promise,
              clause_number: null,
              clause_id: null,
              clause_text: null,
              mismatch_type: 'missing_promise',
              severity: 'major',
              promise_says: promise.promise_text,
              contract_says: 'Not mentioned in the contract at all',
              explanation: `"${promise.promised_by}" promised "${promise.promise_text}" but the contract has no clause addressing this.`,
              legal_significance: {
                enforceability: 'needs_legal_review',
                applicable_laws: [],
                reasoning: '',
                evidence_strength: '',
                precedent_cases: [],
              },
              financial_impact: null,
              financial_description: null,
              recommendation: 'Ask for this promise to be included in the contract before signing.',
            });
          }
          continue;
        }

        const prompt = getMismatchDetectionPrompt(batchPromises, relevantClauses);

        const response = await callGroq(
          [
            { role: 'system', content: 'You are a contract analysis expert. Compare promises against contract clauses and identify mismatches. Always return valid JSON.' },
            { role: 'user', content: prompt },
          ],
          { temperature: 0.1, maxTokens: 4096 }
        );

        const parsed = JSON.parse(response);
        const results = parsed.results || [];

        for (const result of results) {
          if (!result.has_mismatch) continue;

          const promiseIndex = (result.promise_index || 1) - 1;
          const batchItem = batch[promiseIndex];
          if (!batchItem) continue;

          const matchedClause = result.matched_clause_number
            ? clauses.find(c => c.clause_number === result.matched_clause_number)
            : null;

          allMismatches.push({
            id: generateMismatchId(),
            promise: batchItem.promise,
            clause_number: result.matched_clause_number || null,
            clause_id: matchedClause?.id || null,
            clause_text: matchedClause?.original_text || null,
            mismatch_type: (result.mismatch_type || 'missing_promise') as MismatchType,
            severity: (result.severity || 'major') as MismatchSeverity,
            promise_says: result.promise_says || batchItem.promise.promise_text,
            contract_says: result.contract_says || 'See contract',
            explanation: result.explanation || '',
            legal_significance: {
              enforceability: 'needs_legal_review',
              applicable_laws: [],
              reasoning: '',
              evidence_strength: '',
              precedent_cases: [],
            },
            financial_impact: result.financial_impact || null,
            financial_description: result.financial_description || null,
            recommendation: result.recommendation || '',
          });
        }

        console.log(
          `[ClauseWall] Mismatch Detector: Batch ${Math.floor(i / BATCH_SIZE) + 1} → ${results.filter((r: { has_mismatch: boolean }) => r.has_mismatch).length} mismatches`
        );
      } catch (batchError) {
        console.error(`[ClauseWall] Mismatch detection batch failed:`, batchError);
        // Continue with other batches
      }

      // Rate limiting
      if (i + BATCH_SIZE < promiseWithClauses.length) {
        await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_CALLS_MS));
      }
    }

    // Sort by severity
    const severityOrder: Record<string, number> = { critical: 0, major: 1, minor: 2, info: 3 };
    allMismatches.sort((a, b) =>
      (severityOrder[a.severity] ?? 4) - (severityOrder[b.severity] ?? 4)
    );

    console.log(
      `[ClauseWall] Mismatch Detector: Total ${allMismatches.length} mismatches found`
    );

    return allMismatches;
  } catch (error) {
    console.error('[ClauseWall] Mismatch detection failed:', error);
    return [];
  }
}
