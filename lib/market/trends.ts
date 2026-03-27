// ============================================
// TREND DETECTION ENGINE
// Time-series trend detection from snapshots
// ============================================

import { createClient } from '@/lib/supabase/server';
import type { MarketTrend, TrendType, TrendInsight, MarketBenchmark, AlertSeverity, TrendDataPoint } from '@/types/market';
import { BENCHMARK_TYPE_LABELS } from './constants';

/**
 * Detect trends from benchmark snapshots
 */
export async function detectTrends(
  benchmarkId?: string,
  periodMonths: number = 3
): Promise<MarketTrend[]> {
  const supabase = await createClient();
  const trends: MarketTrend[] = [];

  let query = supabase
    .from('benchmark_snapshots')
    .select('*, market_benchmarks!inner(benchmark_type, scope_type, scope_value, document_type)')
    .order('snapshot_period', { ascending: true });

  if (benchmarkId) {
    query = query.eq('benchmark_id', benchmarkId);
  }

  const { data: snapshots, error } = await query;

  if (error || !snapshots || snapshots.length < 2) return [];

  // Group snapshots by benchmark_id
  const grouped = new Map<string, typeof snapshots>();
  for (const s of snapshots) {
    const existing = grouped.get(s.benchmark_id) || [];
    existing.push(s);
    grouped.set(s.benchmark_id, existing);
  }

  for (const [bmId, snaps] of grouped) {
    if (snaps.length < 2) continue;

    const sorted = snaps.sort(
      (a, b) => a.snapshot_period.localeCompare(b.snapshot_period)
    );

    const latest = sorted[sorted.length - 1];
    const oldest = sorted[0];
    const benchmarkInfo = (latest as any).market_benchmarks;

    // Only look at the last N months
    const recentSnaps = sorted.slice(-periodMonths);
    if (recentSnaps.length < 2) continue;

    const startValue = recentSnaps[0].median_value;
    const endValue = recentSnaps[recentSnaps.length - 1].median_value;

    if (startValue === null || endValue === null || startValue === 0) continue;

    const changePercent = ((endValue - startValue) / Math.abs(startValue)) * 100;
    const roundedChange = Math.round(changePercent * 10) / 10;

    // Determine trend type
    let trendType: TrendType;
    let isSignificant = false;
    let significanceReason: string | null = null;
    let isAlert = false;
    let alertSeverity: AlertSeverity | null = null;

    if (Math.abs(roundedChange) < 2) {
      trendType = 'stable';
    } else if (roundedChange > 20) {
      trendType = 'spike';
      isSignificant = true;
      significanceReason = `${roundedChange}% spike in ${periodMonths} months`;
      isAlert = true;
      alertSeverity = roundedChange > 50 ? 'critical' : 'warning';
    } else if (roundedChange < -20) {
      trendType = 'drop';
      isSignificant = true;
      significanceReason = `${Math.abs(roundedChange)}% drop in ${periodMonths} months`;
      isAlert = true;
      alertSeverity = 'info';
    } else if (roundedChange > 0) {
      trendType = 'increasing';
      if (roundedChange > 10) {
        isSignificant = true;
        significanceReason = `Notable ${roundedChange}% increase`;
      }
    } else {
      trendType = 'decreasing';
      if (Math.abs(roundedChange) > 10) {
        isSignificant = true;
        significanceReason = `Notable ${Math.abs(roundedChange)}% decrease`;
      }
    }

    const label = BENCHMARK_TYPE_LABELS[benchmarkInfo?.benchmark_type as keyof typeof BENCHMARK_TYPE_LABELS] ||
      benchmarkInfo?.benchmark_type || 'Unknown';

    const description = buildTrendDescription(
      trendType,
      label,
      roundedChange,
      periodMonths,
      benchmarkInfo?.scope_value || 'national'
    );

    // Upsert the trend
    const { data: upserted, error: upsertErr } = await supabase
      .from('market_trends')
      .upsert({
        benchmark_id: bmId,
        trend_type: trendType,
        change_percent: roundedChange,
        period_months: periodMonths,
        confidence: Math.min(100, recentSnaps.length * 20),
        start_value: startValue,
        end_value: endValue,
        description,
        is_significant: isSignificant,
        significance_reason: significanceReason,
        is_alert: isAlert,
        alert_severity: alertSeverity,
      }, {
        onConflict: 'benchmark_id,trend_type,period_months',
      })
      .select()
      .single();

    if (!upsertErr && upserted) {
      trends.push(upserted as MarketTrend);
    }
  }

  return trends;
}

/**
 * Get recent trends for display
 */
export async function getRecentTrends(options?: {
  limit?: number;
  significant_only?: boolean;
  alerts_only?: boolean;
}): Promise<TrendInsight[]> {
  const supabase = await createClient();

  let query = supabase
    .from('market_trends')
    .select('*, market_benchmarks(*)')
    .order('detected_at', { ascending: false });

  if (options?.significant_only) {
    query = query.eq('is_significant', true);
  }

  if (options?.alerts_only) {
    query = query.eq('is_alert', true);
  }

  query = query.limit(options?.limit || 10);

  const { data, error } = await query;

  if (error || !data) return [];

  return data.map((row: any) => ({
    trend: {
      id: row.id,
      benchmark_id: row.benchmark_id,
      trend_type: row.trend_type,
      change_percent: row.change_percent,
      period_months: row.period_months,
      confidence: row.confidence,
      start_value: row.start_value,
      end_value: row.end_value,
      description: row.description,
      ai_narrative: row.ai_narrative,
      is_significant: row.is_significant,
      significance_reason: row.significance_reason,
      is_alert: row.is_alert,
      alert_severity: row.alert_severity,
      detected_at: row.detected_at,
      expires_at: row.expires_at,
    },
    benchmark: row.market_benchmarks as MarketBenchmark,
    narrative: row.description,
    severity: row.alert_severity || 'info',
    actionable_advice: buildActionableAdvice(row.trend_type, row.change_percent),
  }));
}

/**
 * Get trend data points for charting
 */
export async function getTrendDataPoints(
  benchmarkId: string
): Promise<TrendDataPoint[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('benchmark_snapshots')
    .select('snapshot_period, median_value, sample_count')
    .eq('benchmark_id', benchmarkId)
    .order('snapshot_period', { ascending: true });

  if (error || !data) return [];

  return data.map((row: any) => ({
    period: row.snapshot_period,
    value: row.median_value,
    sample_count: row.sample_count,
  }));
}

// ============================================
// HELPERS
// ============================================

function buildTrendDescription(
  type: TrendType,
  label: string,
  change: number,
  months: number,
  scope: string
): string {
  const scopeLabel = scope === 'all' ? 'nationally' : `in ${scope.replace(/_/g, ' ')}`;
  const absChange = Math.abs(change);

  switch (type) {
    case 'increasing':
      return `${label} has increased ${absChange}% over the last ${months} months ${scopeLabel}`;
    case 'decreasing':
      return `${label} has decreased ${absChange}% over the last ${months} months ${scopeLabel}`;
    case 'stable':
      return `${label} has remained stable ${scopeLabel} (< 2% change)`;
    case 'spike':
      return `⚠️ ${label} spiked ${absChange}% in ${months} months ${scopeLabel}`;
    case 'drop':
      return `📉 ${label} dropped ${absChange}% in ${months} months ${scopeLabel}`;
    default:
      return `${label} ${type} ${absChange}% over ${months} months ${scopeLabel}`;
  }
}

function buildActionableAdvice(type: TrendType, change: number): string {
  switch (type) {
    case 'spike':
      return 'Consider negotiating this term more aggressively — market values are rising rapidly.';
    case 'drop':
      return 'Market conditions are improving — use this as leverage in your negotiation.';
    case 'increasing':
      return 'Values are trending upward. Compare your terms against the current market carefully.';
    case 'decreasing':
      return 'Market values are declining. You may have room to negotiate better terms.';
    case 'stable':
      return 'Market conditions are stable — focus on other negotiation points.';
    default:
      return 'Monitor this trend and adjust your negotiation strategy accordingly.';
  }
}
