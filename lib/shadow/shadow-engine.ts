// ============================================
// SHADOW ENGINE — MAIN ORCHESTRATOR
// Coordinates the full shadow analysis pipeline
// ============================================

import { createClient } from '@/lib/supabase/server';
import { parseEvidence } from './parsers';
import { extractPromises } from './promise-extractor';
import { detectMismatches } from './mismatch-detector';
import { analyzeLegalSignificance } from './legal-analyzer';
import { getShadowSummaryPrompt } from './prompts';
import { callGroqChat } from '@/lib/ai/groq-client';
import type {
  ShadowAnalysisRequest,
  ShadowAnalysisResponse,
  ShadowAnalysis,
  EvidenceSource,
  ExtractedPromise,
  ContractMismatch,
  Clause,
} from '@/types';

/**
 * Generate unique analysis ID
 */
function generateAnalysisId(): string {
  return `sa_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Deduplicate promises across multiple evidence sources
 */
function deduplicateAcrossSources(allPromises: ExtractedPromise[]): ExtractedPromise[] {
  const seen = new Map<string, ExtractedPromise>();

  for (const promise of allPromises) {
    const key = (promise.promise_text + promise.category)
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '')
      .substring(0, 80);

    if (!seen.has(key)) {
      seen.set(key, promise);
    }
  }

  return Array.from(seen.values());
}

/**
 * Main shadow analysis pipeline
 */
export async function analyzeShadowAgreement(
  request: ShadowAnalysisRequest,
  userId: string
): Promise<ShadowAnalysisResponse> {
  const startTime = Date.now();
  const supabase = await createClient();

  // STEP 1: Fetch document + clauses
  console.log(`[ClauseWall] [Shadow] Starting analysis for document ${request.document_id}`);

  const { data: doc, error: docError } = await supabase
    .from('documents')
    .select('*')
    .eq('id', request.document_id)
    .single();

  if (docError || !doc) {
    throw new Error(`Document not found: ${docError?.message || 'not found'}`);
  }

  if (doc.analysis_status !== 'completed') {
    throw new Error('Document must be fully analyzed before shadow analysis');
  }

  const { data: clauseData } = await supabase
    .from('clauses')
    .select('*')
    .eq('document_id', request.document_id)
    .order('clause_number', { ascending: true });

  const clauses: Clause[] = (clauseData || []) as Clause[];
  const entityName = doc.entity_name || null;
  const documentType = doc.document_type || 'other';
  const jurisdiction = doc.jurisdiction || 'pan_india';

  console.log(
    `[ClauseWall] [Shadow] Document loaded: ${clauses.length} clauses, type=${documentType}, entity=${entityName}`
  );

  // STEP 2: Parse all evidence sources
  const evidenceSources: EvidenceSource[] = [];

  for (const evidence of request.evidence.slice(0, 5)) { // Limit to 5 sources
    try {
      const source = await parseEvidence(
        evidence.content,
        evidence.type,
        evidence.format,
        evidence.filename
      );
      evidenceSources.push(source);

      console.log(
        `[ClauseWall] [Shadow] Parsed evidence: ${evidence.type} → ${source.metadata.word_count} words`
      );
    } catch (error) {
      console.error(`[ClauseWall] [Shadow] Evidence parsing failed for ${evidence.type}:`, error);
      // Continue with other sources
    }
  }

  if (evidenceSources.length === 0) {
    throw new Error('No evidence could be parsed. Please check your files and try again.');
  }

  // STEP 3: Extract promises from each evidence source
  let allPromises: ExtractedPromise[] = [];

  for (const source of evidenceSources) {
    try {
      const promises = await extractPromises(source, documentType, entityName);
      allPromises.push(...promises);
      console.log(
        `[ClauseWall] [Shadow] Extracted ${promises.length} promises from ${source.type}`
      );
    } catch (error) {
      console.error(`[ClauseWall] [Shadow] Promise extraction failed for ${source.type}:`, error);
    }
  }

  // Deduplicate across sources
  allPromises = deduplicateAcrossSources(allPromises);
  console.log(`[ClauseWall] [Shadow] Total unique promises: ${allPromises.length}`);

  // STEP 4: Detect mismatches
  let mismatches: ContractMismatch[] = [];
  try {
    mismatches = await detectMismatches(allPromises, clauses, documentType, jurisdiction);
    console.log(`[ClauseWall] [Shadow] Mismatches found: ${mismatches.length}`);
  } catch (error) {
    console.error('[ClauseWall] [Shadow] Mismatch detection failed:', error);
  }

  // STEP 5: Legal significance analysis
  if (mismatches.length > 0) {
    try {
      mismatches = await analyzeLegalSignificance(
        mismatches,
        evidenceSources,
        documentType,
        jurisdiction
      );
      console.log('[ClauseWall] [Shadow] Legal analysis complete');
    } catch (error) {
      console.error('[ClauseWall] [Shadow] Legal analysis failed:', error);
    }
  }

  // STEP 6: Calculate trust score
  const criticalCount = mismatches.filter(m => m.severity === 'critical').length;
  const majorCount = mismatches.filter(m => m.severity === 'major').length;
  const minorCount = mismatches.filter(m => m.severity === 'minor').length;

  let trustScore = 100 - (criticalCount * 25 + majorCount * 15 + minorCount * 5);
  trustScore = Math.max(0, Math.min(100, trustScore));

  // STEP 7: Generate summary
  let summary = '';
  try {
    const topMismatch = mismatches.length > 0
      ? `${mismatches[0].promise_says} vs ${mismatches[0].contract_says}`
      : null;

    const summaryPrompt = getShadowSummaryPrompt(
      entityName,
      allPromises.length,
      mismatches.length,
      criticalCount,
      evidenceSources.map(e => e.type),
      topMismatch
    );

    summary = await callGroqChat(
      [
        { role: 'system', content: 'Generate a brief, clear summary.' },
        { role: 'user', content: summaryPrompt },
      ],
      { temperature: 0.3, maxTokens: 256 }
    );
  } catch (error) {
    console.error('[ClauseWall] [Shadow] Summary generation failed:', error);
    summary = `Shadow analysis found ${mismatches.length} mismatches out of ${allPromises.length} promises checked.`;
  }

  // STEP 8: Build analysis object
  const analysis: ShadowAnalysis = {
    id: generateAnalysisId(),
    document_id: request.document_id,
    user_id: userId,
    evidence_sources: evidenceSources,
    total_promises_found: allPromises.length,
    total_mismatches: mismatches.length,
    critical_mismatches: criticalCount,
    major_mismatches: majorCount,
    minor_mismatches: minorCount,
    promises: allPromises,
    mismatches,
    overall_trust_score: trustScore,
    summary,
    report_url: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  // STEP 9: Save to database
  try {
    const { error: upsertError } = await supabase
      .from('shadow_analyses')
      .upsert(
        {
          document_id: request.document_id,
          user_id: userId,
          evidence_sources: evidenceSources,
          total_promises_found: allPromises.length,
          total_mismatches: mismatches.length,
          critical_mismatches: criticalCount,
          major_mismatches: majorCount,
          minor_mismatches: minorCount,
          promises: allPromises,
          mismatches,
          overall_trust_score: trustScore,
          summary,
          report_url: null,
        },
        { onConflict: 'document_id,user_id' }
      );

    if (upsertError) {
      console.error('[ClauseWall] [Shadow] DB save failed:', upsertError);
    }

    // Also update documents table
    await supabase
      .from('documents')
      .update({
        shadow_analysis_data: {
          trust_score: trustScore,
          total_mismatches: mismatches.length,
          critical_mismatches: criticalCount,
          has_analysis: true,
        },
      })
      .eq('id', request.document_id);
  } catch (dbError) {
    console.error('[ClauseWall] [Shadow] Database operations failed:', dbError);
    // Non-fatal — return analysis anyway
  }

  const processingTime = Date.now() - startTime;
  console.log(
    `[ClauseWall] [Shadow] ✅ Analysis complete in ${processingTime}ms: trust=${trustScore}, mismatches=${mismatches.length}`
  );

  return {
    analysis,
    mismatches,
    report_url: null,
    processing_time_ms: processingTime,
  };
}
