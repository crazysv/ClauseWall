// ============================================
// LEGAL SIGNIFICANCE ANALYZER
// Determines enforceability of each mismatch
// under Indian law using Groq LLM
// ============================================

import { callGroq } from '@/lib/ai/groq-client';
import { getLegalSignificancePrompt } from './prompts';
import type { ContractMismatch, EvidenceSource, LegalEnforceability } from '@/types';

/**
 * Analyze legal significance of all mismatches in one batch call
 */
export async function analyzeLegalSignificance(
  mismatches: ContractMismatch[],
  evidenceSources: EvidenceSource[],
  documentType: string,
  jurisdiction: string
): Promise<ContractMismatch[]> {
  try {
    if (mismatches.length === 0) return mismatches;

    console.log(
      `[ClauseWall] Legal Analyzer: Analyzing ${mismatches.length} mismatches`
    );

    // Collect evidence types
    const evidenceTypes = [...new Set(evidenceSources.map(e => e.type))];

    // Build mismatch list for prompt
    const mismatchData = mismatches.map((m, i) => ({
      index: i,
      promise_text: m.promise_says,
      contract_says: m.contract_says,
      evidence_type: m.promise.evidence_source_id
        ? evidenceSources.find(e => e.id === m.promise.evidence_source_id)?.type || 'unknown'
        : 'unknown',
      date: m.promise.date,
    }));

    const prompt = getLegalSignificancePrompt(mismatchData, evidenceTypes);

    const response = await callGroq(
      [
        {
          role: 'system',
          content: 'You are an Indian legal expert specializing in contract law, evidence law, and consumer protection. Analyze enforceability of verbal promises vs written contracts. Always return valid JSON.',
        },
        { role: 'user', content: prompt },
      ],
      { temperature: 0.1, maxTokens: 4096 }
    );

    const parsed = JSON.parse(response);
    const analyses = parsed.analyses || [];

    // Apply legal analysis to mismatches
    const updatedMismatches = mismatches.map((mismatch, index) => {
      const analysis = analyses.find(
        (a: { mismatch_index: number }) => a.mismatch_index === index
      );

      if (!analysis) return mismatch;

      const validEnforceabilities: LegalEnforceability[] = [
        'strongly_enforceable',
        'moderately_enforceable',
        'weakly_enforceable',
        'not_enforceable',
        'needs_legal_review',
      ];

      return {
        ...mismatch,
        legal_significance: {
          enforceability: validEnforceabilities.includes(analysis.enforceability)
            ? analysis.enforceability
            : 'needs_legal_review',
          applicable_laws: (analysis.applicable_laws || []).map(
            (law: { act: string; section: string; relevance: string }) => ({
              act: law.act || '',
              section: law.section || '',
              relevance: law.relevance || '',
            })
          ),
          reasoning: analysis.reasoning || '',
          evidence_strength: analysis.evidence_strength || '',
          precedent_cases: analysis.precedent_cases || [],
        },
      };
    });

    console.log(
      `[ClauseWall] Legal Analyzer: ${analyses.length} analyses applied`
    );

    return updatedMismatches;
  } catch (error) {
    console.error('[ClauseWall] Legal significance analysis failed:', error);
    // Return mismatches unchanged — legal analysis is non-critical
    return mismatches;
  }
}
