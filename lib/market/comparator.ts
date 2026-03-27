// ============================================
// MARKET COMPARISON ENGINE
// Compare clauses/documents against market benchmarks
// ============================================

import type {
  ComparisonInput,
  ComparisonResult,
  ClauseMarketContext,
  BenchmarkType,
} from '@/types/market';
import { getBenchmark } from './benchmarks';
import {
  computePercentileRankFromBenchmark,
  getPositionLabel,
  getPositionDescription,
  formatComparisonNarrative,
} from './percentile';
import {
  CLAUSE_TO_BENCHMARK,
  HIGHER_IS_WORSE,
  BENCHMARK_TYPE_LABELS,
  UNIT_LABELS,
  getPercentileColor,
  normalizeJurisdiction,
  normalizeCity,
} from './constants';
import { createClient } from '@/lib/supabase/server';

/**
 * Compare a single clause value against market benchmarks
 * Uses cascading scope fallback: city → state → doc_type → national → seed
 */
export async function compareClauseToMarket(
  input: ComparisonInput
): Promise<ComparisonResult | null> {
  const benchmarkType = CLAUSE_TO_BENCHMARK[input.clause_type];
  if (!benchmarkType) return null;

  const jurisdiction = input.jurisdiction
    ? normalizeJurisdiction(input.jurisdiction)
    : undefined;

  const city = input.city ? normalizeCity(input.city) : undefined;

  // Fetch best-match benchmark with fallback
  const benchmark = await getBenchmark({
    benchmark_type: benchmarkType,
    jurisdiction: jurisdiction || undefined,
    city: city || undefined,
    document_type: input.document_type,
    industry: input.industry,
    role_level: input.role_level,
    property_type: input.property_type,
    lender_category: input.lender_category,
  });

  if (!benchmark) return null;

  // Compute percentile rank
  const percentileRank = computePercentileRankFromBenchmark(
    input.value,
    benchmark.p10_value,
    benchmark.p25_value,
    benchmark.median_value,
    benchmark.p75_value,
    benchmark.p90_value,
    benchmark.min_value,
    benchmark.max_value
  );

  const higherIsWorse = HIGHER_IS_WORSE[benchmarkType] ?? true;
  const position = getPositionLabel(percentileRank);
  const positionLabel = getPositionDescription(position, higherIsWorse);

  // Determine scope label
  const scopeLabel = buildScopeLabel(benchmark.scope_type, benchmark.scope_value, input.document_type);

  // Build narrative
  const narrative = formatComparisonNarrative(
    input.value,
    input.unit,
    percentileRank,
    benchmarkType,
    scopeLabel,
    benchmark.median_value || 0
  );

  // Is this favorable for the user?
  const isFavorable = higherIsWorse
    ? percentileRank <= 50
    : percentileRank >= 50;

  return {
    percentile_rank: percentileRank,
    position,
    position_label: positionLabel,
    benchmark,
    narrative,
    scope_used: scopeLabel,
    chart_data: {
      distribution: benchmark.distribution_buckets || [],
      user_value: input.value,
      median: benchmark.median_value || 0,
      mean: benchmark.mean_value || 0,
      p25: benchmark.p25_value || 0,
      p75: benchmark.p75_value || 0,
    },
    is_favorable: isFavorable,
    color: getPercentileColor(percentileRank, higherIsWorse),
  };
}

/**
 * Compare ALL clauses of a document against market benchmarks
 */
export async function compareDocumentToMarket(
  documentId: string
): Promise<ClauseMarketContext[]> {
  const supabase = await createClient();

  // Fetch document + clauses
  const { data: doc, error: docError } = await supabase
    .from('documents')
    .select('jurisdiction, document_type')
    .eq('id', documentId)
    .single();

  if (docError || !doc) return [];

  const { data: clauses, error: clauseError } = await supabase
    .from('clauses')
    .select('id, clause_type, extracted_value, extracted_unit, risk_level')
    .eq('document_id', documentId);

  if (clauseError || !clauses) return [];

  const results: ClauseMarketContext[] = [];

  for (const clause of clauses) {
    if (!clause.extracted_value || !clause.clause_type) {
      results.push({
        clause_id: clause.id,
        comparison: null,
        benchmark: null,
        has_data: false,
        sample_count: 0,
        data_quality: 'none',
      });
      continue;
    }

    const benchmarkType = CLAUSE_TO_BENCHMARK[clause.clause_type];
    if (!benchmarkType) {
      results.push({
        clause_id: clause.id,
        comparison: null,
        benchmark: null,
        has_data: false,
        sample_count: 0,
        data_quality: 'none',
      });
      continue;
    }

    try {
      const comparison = await compareClauseToMarket({
        value: Number(clause.extracted_value),
        unit: clause.extracted_unit || 'unknown',
        clause_type: clause.clause_type,
        document_type: doc.document_type,
        jurisdiction: doc.jurisdiction,
      });

      if (comparison) {
        const isSeed = comparison.benchmark.id.startsWith('seed-');
        results.push({
          clause_id: clause.id,
          comparison,
          benchmark: comparison.benchmark,
          has_data: true,
          sample_count: comparison.benchmark.sample_count,
          data_quality: isSeed ? 'seed' : comparison.benchmark.is_sufficient ? 'sufficient' : 'partial',
        });
      } else {
        results.push({
          clause_id: clause.id,
          comparison: null,
          benchmark: null,
          has_data: false,
          sample_count: 0,
          data_quality: 'none',
        });
      }
    } catch {
      results.push({
        clause_id: clause.id,
        comparison: null,
        benchmark: null,
        has_data: false,
        sample_count: 0,
        data_quality: 'none',
      });
    }
  }

  return results;
}

// ============================================
// HELPERS
// ============================================

function buildScopeLabel(scopeType: string, scopeValue: string, documentType?: string): string {
  const docLabel = documentType || 'contracts';

  switch (scopeType) {
    case 'city':
      return `${capitalize(scopeValue)} ${docLabel}`;
    case 'state':
      return `${capitalize(scopeValue.replace(/_/g, ' '))} ${docLabel}`;
    case 'national':
      return `India-wide ${docLabel}`;
    case 'document_type':
      return `all ${docLabel} in India`;
    case 'industry':
      return `${capitalize(scopeValue)} industry ${docLabel}`;
    case 'entity':
      return `${capitalize(scopeValue)} ${docLabel}`;
    default:
      return `market ${docLabel}`;
  }
}

function capitalize(str: string): string {
  return str
    .split(' ')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}
