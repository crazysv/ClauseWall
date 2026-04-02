// ============================================
// PROMISE EXTRACTOR
// Extracts promises/commitments from evidence
// using Groq LLM with chunking for long texts
// ============================================

import { callGroq } from '@/lib/ai/groq-client';
import { getPromiseExtractionPrompt } from './prompts';
import type { EvidenceSource, ExtractedPromise } from '@/types';

const CHUNK_SIZE = 3000;
const MAX_PROMISES_HARD_LIMIT = 50;

/**
 * Generate unique promise ID
 */
function generatePromiseId(): string {
  return `pr_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Split text into chunks for processing
 */
function chunkText(text: string, chunkSize: number): string[] {
  if (text.length <= chunkSize) return [text];

  const chunks: string[] = [];
  const lines = text.split('\n');
  let current = '';

  for (const line of lines) {
    if ((current + '\n' + line).length > chunkSize && current.length > 0) {
      chunks.push(current);
      current = line;
    } else {
      current = current ? current + '\n' + line : line;
    }
  }

  if (current) chunks.push(current);
  return chunks;
}

/**
 * Deduplicate promises by checking for similar promise_text
 */
function deduplicatePromises(promises: ExtractedPromise[]): ExtractedPromise[] {
  const seen = new Map<string, ExtractedPromise>();

  for (const promise of promises) {
    // Normalize for comparison
    const key = promise.promise_text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, ' ')
      .trim()
      .substring(0, 100);

    const existing = seen.get(key);
    if (!existing) {
      seen.set(key, promise);
    } else {
      // Keep the higher confidence one
      const confidenceOrder: Record<string, number> = { high: 3, medium: 2, low: 1 };
      if ((confidenceOrder[promise.confidence] || 0) > (confidenceOrder[existing.confidence] || 0)) {
        seen.set(key, promise);
      }
    }
  }

  return Array.from(seen.values());
}

/**
 * Extract promises from a single evidence source
 */
export async function extractPromises(
  evidenceSource: EvidenceSource,
  documentType: string,
  entityName: string | null
): Promise<ExtractedPromise[]> {
  try {
    const text = evidenceSource.raw_text;
    if (!text || text.trim().length < 10) {
      return [];
    }

    const chunks = chunkText(text, CHUNK_SIZE);
    const allPromises: ExtractedPromise[] = [];


    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];

      try {
        const prompt = getPromiseExtractionPrompt(documentType, entityName, chunk);

        const response = await callGroq(
          [
            { role: 'system', content: 'You are a legal evidence analyst. Extract promises from communication texts. Always return valid JSON.' },
            { role: 'user', content: prompt },
          ],
          { temperature: 0.1, maxTokens: 4096 }
        );

        const parsed = JSON.parse(response);
        const promises = parsed.promises || [];

        for (const p of promises) {
          allPromises.push({
            id: generatePromiseId(),
            evidence_source_id: evidenceSource.id,
            promise_text: p.promise_text || '',
            context_text: p.context_text || '',
            promised_by: p.promised_by || 'Other Party',
            promised_to: p.promised_to || 'User',
            date: p.date || null,
            category: p.category || 'other',
            specific_value: p.specific_value || null,
            confidence: (['high', 'medium', 'low'].includes(p.confidence) ? p.confidence : 'medium') as 'high' | 'medium' | 'low',
          });
        }


      } catch (chunkError) {
        console.error(`[ClauseWall] Promise extraction chunk ${i + 1} failed:`, chunkError);
        // Continue with other chunks
      }

      // Rate limiting between chunks
      if (i < chunks.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    // Deduplicate
    let deduplicated = deduplicatePromises(allPromises);

    // If too many promises, filter to high/medium confidence only
    if (deduplicated.length > 20) {
      deduplicated = deduplicated.filter(p => p.confidence !== 'low');
    }

    // Hard limit
    if (deduplicated.length > MAX_PROMISES_HARD_LIMIT) {
      deduplicated = deduplicated.slice(0, MAX_PROMISES_HARD_LIMIT);
    }


    return deduplicated;
  } catch (error) {
    console.error('[ClauseWall] Promise extraction failed:', error);
    return [];
  }
}
