// ============================================
// AMMUNITION REPORT GENERATOR
// Generate data-backed negotiation arguments
// ============================================

import { createClient } from '@/lib/supabase/server';
import type { AmmunitionReport, AmmunitionSection, ClauseMarketContext } from '@/types/market';
import { compareDocumentToMarket } from './comparator';
import { BENCHMARK_TYPE_LABELS, UNIT_LABELS, HIGHER_IS_WORSE, CLAUSE_TO_BENCHMARK } from './constants';

/**
 * Generate a full ammunition report for a document
 */
export async function generateAmmunitionReport(
  documentId: string,
  targetAudience: 'counterparty' | 'consumer_forum' | 'lawyer' = 'counterparty',
  clauseIds?: string[]
): Promise<AmmunitionReport> {
  const supabase = await createClient();

  // Fetch document
  const { data: doc, error: docError } = await supabase
    .from('documents')
    .select('document_type, jurisdiction, entity_name')
    .eq('id', documentId)
    .single();

  if (docError || !doc) {
    throw new Error(`Document not found: ${documentId}`);
  }

  // Get market comparisons
  const comparisons = await compareDocumentToMarket(documentId);

  // Filter to requested clauses if specified
  let relevantComparisons = comparisons.filter(c => c.has_data && c.comparison);
  if (clauseIds && clauseIds.length > 0) {
    relevantComparisons = relevantComparisons.filter(c => clauseIds.includes(c.clause_id));
  }

  // Fetch clause details
  const { data: clauses } = await supabase
    .from('clauses')
    .select('id, clause_type, clause_number, extracted_value, extracted_unit')
    .eq('document_id', documentId);

  const clauseMap = new Map(clauses?.map(c => [c.id, c]) || []);

  // Build sections
  const sections: AmmunitionSection[] = [];

  for (const ctx of relevantComparisons) {
    if (!ctx.comparison || !ctx.benchmark) continue;

    const clause = clauseMap.get(ctx.clause_id);
    if (!clause) continue;

    const benchmarkType = CLAUSE_TO_BENCHMARK[clause.clause_type];
    if (!benchmarkType) continue;

    const label = BENCHMARK_TYPE_LABELS[benchmarkType] || clause.clause_type;
    const higherIsWorse = HIGHER_IS_WORSE[benchmarkType] ?? true;

    // Only include unfavorable comparisons in ammunition
    const isUnfavorable = higherIsWorse
      ? ctx.comparison.percentile_rank > 50
      : ctx.comparison.percentile_rank < 50;

    if (!isUnfavorable) continue;

    const narrative = buildAmmunitionNarrative(
      label,
      Number(clause.extracted_value),
      clause.extracted_unit || '',
      ctx.comparison.percentile_rank,
      ctx.benchmark.median_value || 0,
      ctx.benchmark.sample_count,
      ctx.comparison.scope_used,
      targetAudience,
      higherIsWorse
    );

    sections.push({
      heading: label,
      clause_number: clause.clause_number || null,
      clause_type: clause.clause_type,
      user_value: Number(clause.extracted_value),
      user_unit: clause.extracted_unit || '',
      market_median: ctx.benchmark.median_value || 0,
      percentile_rank: ctx.comparison.percentile_rank,
      sample_count: ctx.benchmark.sample_count,
      narrative,
      chart_data: ctx.benchmark.distribution_buckets || null,
    });
  }

  // Sort by most unfavorable first
  sections.sort((a, b) => b.percentile_rank - a.percentile_rank);

  // Build overall summary
  const overallSummary = buildOverallSummary(sections, doc, targetAudience);

  return {
    title: `Market Benchmark Ammunition — ${doc.document_type || 'Contract'} Analysis`,
    target_audience: targetAudience,
    document_type: doc.document_type || 'unknown',
    jurisdiction: doc.jurisdiction || 'India',
    entity_name: doc.entity_name || null,
    sections,
    overall_summary: overallSummary,
    generated_at: new Date().toISOString(),
  };
}

// ============================================
// NARRATIVE BUILDERS
// ============================================

function buildAmmunitionNarrative(
  label: string,
  userValue: number,
  unit: string,
  percentileRank: number,
  marketMedian: number,
  sampleCount: number,
  scopeUsed: string,
  audience: string,
  higherIsWorse: boolean
): string {
  const unitLabel = UNIT_LABELS[unit] || unit;
  const direction = higherIsWorse ? 'higher' : 'lower';
  const pctAbove = Math.abs(percentileRank - 50);

  switch (audience) {
    case 'counterparty':
      return `Your proposed ${label.toLowerCase()} of ${userValue} ${unitLabel} is ${direction} than ${percentileRank}% of similar ${scopeUsed}. ` +
        `The market standard is ${marketMedian} ${unitLabel} (based on ${sampleCount} contracts). ` +
        `We request alignment with prevailing market norms.`;

    case 'consumer_forum':
      return `The ${label.toLowerCase()} of ${userValue} ${unitLabel} imposed by the service provider is ${direction} than ${percentileRank}% of comparable agreements in ${scopeUsed}. ` +
        `The median market value is ${marketMedian} ${unitLabel} across ${sampleCount} analyzed contracts. ` +
        `This deviation from standard market practice constitutes an unfair trade practice under Section 2(1)(r) of the Consumer Protection Act, 2019.`;

    case 'lawyer':
      return `The ${label.toLowerCase()} term (${userValue} ${unitLabel}) deviates significantly from market benchmarks — ` +
        `it falls in the ${percentileRank}th percentile against ${sampleCount} comparable agreements (${scopeUsed}). ` +
        `Market median: ${marketMedian} ${unitLabel}. This may be argued as unconscionable under Section 16 of the Indian Contract Act, 1872, ` +
        `or as an unfair contract term under Section 2(46) of the Consumer Protection Act, 2019.`;

    default:
      return `${label}: ${userValue} ${unitLabel} is ${direction} than ${percentileRank}% of the market (median: ${marketMedian} ${unitLabel}, n=${sampleCount}).`;
  }
}

function buildOverallSummary(
  sections: AmmunitionSection[],
  doc: { document_type: string | null; jurisdiction: string | null; entity_name: string | null },
  audience: string
): string {
  if (sections.length === 0) {
    return 'All terms in this contract are within standard market ranges. No ammunition points identified.';
  }

  const count = sections.length;
  const worstSection = sections[0];

  switch (audience) {
    case 'counterparty':
      return `${count} term${count > 1 ? 's' : ''} in this ${doc.document_type || 'contract'} ${count > 1 ? 'are' : 'is'} above market standards. ` +
        `The most significant deviation is in ${worstSection.heading} (${worstSection.percentile_rank}th percentile). ` +
        `We recommend revision to align with prevailing market norms.`;

    case 'consumer_forum':
      return `This analysis identifies ${count} unfair term${count > 1 ? 's' : ''} that deviate from standard market practice. ` +
        `${doc.entity_name ? `${doc.entity_name} ` : 'The service provider '}has imposed terms significantly worse than market benchmarks. ` +
        `The most egregious deviation is in ${worstSection.heading}, where the value exceeds ${worstSection.percentile_rank}% of comparable contracts.`;

    case 'lawyer':
      return `Market benchmark analysis reveals ${count} term${count > 1 ? 's' : ''} with statistically significant deviations from market norms. ` +
        `Strongest ground for challenge: ${worstSection.heading} (${worstSection.percentile_rank}th percentile, n=${worstSection.sample_count}).`;

    default:
      return `Found ${count} terms above market standard.`;
  }
}
