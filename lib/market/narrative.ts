// ============================================
// MARKET NARRATIVE GENERATOR
// AI-generated market insights using Groq
// ============================================

import type { MarketBenchmark, MarketTrend, AmmunitionReport } from '@/types/market';
import { BENCHMARK_TYPE_LABELS, UNIT_LABELS } from './constants';

/**
 * Generate an AI market narrative for a benchmark
 */
export async function generateMarketNarrative(
  benchmark: MarketBenchmark,
  trend?: MarketTrend | null,
  context?: string
): Promise<string> {
  const label = BENCHMARK_TYPE_LABELS[benchmark.benchmark_type] || benchmark.benchmark_type;
  const unit = UNIT_LABELS[benchmark.value_unit || ''] || benchmark.value_unit || '';

  // Build a data-driven narrative without AI call for now (fast)
  const parts: string[] = [];

  parts.push(`Based on ${benchmark.sample_count} analyzed ${benchmark.document_type || 'contracts'}, `);
  parts.push(`the typical ${label.toLowerCase()} is ${benchmark.median_value} ${unit}. `);

  if (benchmark.p25_value !== null && benchmark.p75_value !== null) {
    parts.push(`Most values fall between ${benchmark.p25_value} and ${benchmark.p75_value} ${unit} `);
    parts.push(`(interquartile range). `);
  }

  if (benchmark.scope_type === 'state' && benchmark.scope_value) {
    parts.push(`This data is specific to ${benchmark.scope_value.replace(/_/g, ' ')}. `);
  }

  if (trend) {
    if (trend.trend_type === 'increasing') {
      parts.push(`📈 This has been increasing by ${Math.abs(trend.change_percent)}% over the last ${trend.period_months} months. `);
    } else if (trend.trend_type === 'decreasing') {
      parts.push(`📉 This has been decreasing by ${Math.abs(trend.change_percent)}% recently. `);
    } else if (trend.trend_type === 'spike') {
      parts.push(`⚠️ Alert: A ${Math.abs(trend.change_percent)}% spike was detected. `);
    }
  }

  if (!benchmark.is_sufficient) {
    parts.push(`Note: This benchmark is based on limited data and may not be fully representative. `);
  }

  return parts.join('');
}

/**
 * Generate an ammunition report narrative
 * This can optionally call Groq for premium narratives
 */
export async function generateAmmunitionNarrative(
  report: Partial<AmmunitionReport>,
  useAI: boolean = false
): Promise<string> {
  if (!report.sections || report.sections.length === 0) {
    return 'No comparable market data available for ammunition generation.';
  }

  const parts: string[] = [];

  parts.push(`## Market Benchmark Ammunition Report\n\n`);
  parts.push(`**Document Type:** ${report.document_type || 'Unknown'}\n`);
  parts.push(`**Jurisdiction:** ${report.jurisdiction || 'India'}\n`);
  if (report.entity_name) {
    parts.push(`**Entity:** ${report.entity_name}\n`);
  }
  parts.push(`\n---\n\n`);

  for (const section of report.sections) {
    const position = section.percentile_rank > 75
      ? '⚠️ Significantly above market average'
      : section.percentile_rank > 50
        ? '📊 Above market average'
        : section.percentile_rank > 25
          ? '✅ Near market average'
          : '✅ Below market average (favorable)';

    parts.push(`### ${section.heading}\n\n`);
    parts.push(`- **Your Value:** ${section.user_value} ${section.user_unit}\n`);
    parts.push(`- **Market Median:** ${section.market_median} ${section.user_unit}\n`);
    parts.push(`- **Your Position:** ${position} (${section.percentile_rank}th percentile)\n`);
    parts.push(`- **Sample Size:** ${section.sample_count} contracts\n\n`);
    parts.push(`${section.narrative}\n\n`);
  }

  return parts.join('');
}
