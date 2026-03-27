// ============================================
// BENCHMARK AGGREGATION ENGINE
// Full recomputation + incremental update
// ============================================

import { createClient } from '@/lib/supabase/server';
import type { MarketBenchmark, DistributionBucket, BenchmarkType, ScopeType } from '@/types/market';
import { CLAUSE_TO_BENCHMARK, MINIMUM_SAMPLES, OUTLIER_THRESHOLDS, normalizeJurisdiction, normalizeCity } from './constants';
import { updateRunningStats, initFromExisting } from './percentile';
import { upsertBenchmark } from './benchmarks';

// ============================================
// FULL RECOMPUTATION
// ============================================

/**
 * Recompute ALL benchmarks from scratch using SQL aggregation
 * Should run periodically (daily/weekly) or on admin trigger
 */
export async function recomputeAllBenchmarks(): Promise<{
  benchmarks_computed: number;
  snapshots_taken: number;
  errors: string[];
}> {
  const supabase = await createClient();
  const errors: string[] = [];
  let benchmarksComputed = 0;
  let snapshotsTaken = 0;

  try {
    console.log('[Market] Starting full benchmark recomputation...');

    // Step 1: Get all distinct clause types with extracted values
    const { data: clauseData, error: clauseError } = await supabase
      .from('clauses')
      .select(`
        clause_type,
        extracted_value,
        extracted_unit,
        risk_level,
        document_id,
        documents!inner (
          jurisdiction,
          document_type,
          entity_name,
          analysis_status,
          contribute_to_benchmarks
        )
      `)
      .not('extracted_value', 'is', null)
      .eq('documents.analysis_status', 'completed');

    if (clauseError) {
      throw new Error(`Failed to fetch clause data: ${clauseError.message}`);
    }

    if (!clauseData || clauseData.length === 0) {
      console.log('[Market] No clause data available for benchmarks');
      return { benchmarks_computed: 0, snapshots_taken: 0, errors: [] };
    }

    // Filter out opted-out documents
    const eligibleClauses = clauseData.filter((c: any) => {
      const doc = c.documents;
      return doc && doc.contribute_to_benchmarks !== false;
    });

    console.log(`[Market] Processing ${eligibleClauses.length} eligible clauses...`);

    // Step 2: Group by benchmark dimensions
    const groups = new Map<string, {
      benchmark_type: BenchmarkType;
      scope_type: ScopeType;
      scope_value: string;
      document_type: string | null;
      jurisdiction: string | null;
      city: string | null;
      values: number[];
      unit: string;
      risk_levels: string[];
    }>();

    for (const clause of eligibleClauses) {
      const benchmarkType = CLAUSE_TO_BENCHMARK[clause.clause_type];
      if (!benchmarkType) continue;

      const doc = (clause as any).documents;
      const value = Number(clause.extracted_value);
      if (isNaN(value)) continue;

      // Check outlier thresholds
      const thresholds = OUTLIER_THRESHOLDS[benchmarkType];
      if (thresholds && (value < thresholds.min || value > thresholds.max)) {
        continue; // skip outliers
      }

      const jurisdiction = normalizeJurisdiction(doc.jurisdiction) || null;
      const unit = clause.extracted_unit || 'unknown';

      // Add to national group
      const nationalKey = `${benchmarkType}|national|all|${doc.document_type}`;
      if (!groups.has(nationalKey)) {
        groups.set(nationalKey, {
          benchmark_type: benchmarkType,
          scope_type: 'national',
          scope_value: 'all',
          document_type: doc.document_type,
          jurisdiction: null,
          city: null,
          values: [],
          unit,
          risk_levels: [],
        });
      }
      groups.get(nationalKey)!.values.push(value);
      groups.get(nationalKey)!.risk_levels.push(clause.risk_level);

      // Add to state group
      if (jurisdiction && jurisdiction !== 'national') {
        const stateKey = `${benchmarkType}|state|${jurisdiction}|${doc.document_type}`;
        if (!groups.has(stateKey)) {
          groups.set(stateKey, {
            benchmark_type: benchmarkType,
            scope_type: 'state',
            scope_value: jurisdiction,
            document_type: doc.document_type,
            jurisdiction,
            city: null,
            values: [],
            unit,
            risk_levels: [],
          });
        }
        groups.get(stateKey)!.values.push(value);
        groups.get(stateKey)!.risk_levels.push(clause.risk_level);
      }

      // Add to document_type group (national, all types)
      const docTypeKey = `${benchmarkType}|document_type|${doc.document_type}|null`;
      if (!groups.has(docTypeKey)) {
        groups.set(docTypeKey, {
          benchmark_type: benchmarkType,
          scope_type: 'document_type',
          scope_value: doc.document_type,
          document_type: doc.document_type,
          jurisdiction: null,
          city: null,
          values: [],
          unit,
          risk_levels: [],
        });
      }
      groups.get(docTypeKey)!.values.push(value);
      groups.get(docTypeKey)!.risk_levels.push(clause.risk_level);
    }

    // Step 3: Compute statistics for each group and upsert
    const currentPeriod = new Date().toISOString().substring(0, 7); // YYYY-MM

    for (const [, group] of groups) {
      try {
        const sorted = [...group.values].sort((a, b) => a - b);
        const n = sorted.length;
        if (n < 1) continue;

        const mean = sorted.reduce((s, v) => s + v, 0) / n;
        const median = n % 2 !== 0
          ? sorted[Math.floor(n / 2)]
          : (sorted[n / 2 - 1] + sorted[n / 2]) / 2;

        const p10 = interpolatePercentile(sorted, 10);
        const p25 = interpolatePercentile(sorted, 25);
        const p75 = interpolatePercentile(sorted, 75);
        const p90 = interpolatePercentile(sorted, 90);
        const min = sorted[0];
        const max = sorted[n - 1];

        const squaredDiffs = sorted.map((v) => (v - mean) ** 2);
        const stddev = Math.sqrt(squaredDiffs.reduce((s, v) => s + v, 0) / n);

        // Distribution buckets
        const bucketCount = Math.min(10, Math.max(3, Math.ceil(n / 5)));
        const buckets = generateBuckets(sorted, bucketCount);

        // Risk distribution
        const riskDist = {
          safe_pct: Math.round((group.risk_levels.filter(r => r === 'safe').length / n) * 100),
          warning_pct: Math.round((group.risk_levels.filter(r => r === 'warning').length / n) * 100),
          dangerous_pct: Math.round((group.risk_levels.filter(r => r === 'dangerous').length / n) * 100),
          illegal_pct: Math.round((group.risk_levels.filter(r => r === 'illegal').length / n) * 100),
        };

        const minSamples = MINIMUM_SAMPLES[group.scope_type] || 10;
        const isSufficient = n >= minSamples;

        const benchmarkData: Partial<MarketBenchmark> = {
          benchmark_type: group.benchmark_type,
          scope_type: group.scope_type,
          scope_value: group.scope_value,
          document_type: group.document_type,
          jurisdiction: group.jurisdiction,
          city: group.city,
          sample_count: n,
          mean_value: Math.round(mean * 100) / 100,
          median_value: Math.round(median * 100) / 100,
          p10_value: Math.round(p10 * 100) / 100,
          p25_value: Math.round(p25 * 100) / 100,
          p75_value: Math.round(p75 * 100) / 100,
          p90_value: Math.round(p90 * 100) / 100,
          min_value: Math.round(min * 100) / 100,
          max_value: Math.round(max * 100) / 100,
          stddev_value: Math.round(stddev * 100) / 100,
          value_unit: group.unit,
          distribution_buckets: buckets,
          risk_distribution: riskDist,
          is_sufficient: isSufficient,
          minimum_sample_count: minSamples,
          data_freshness_days: 0,
        };

        const benchmark = await upsertBenchmark(benchmarkData);
        if (benchmark) {
          benchmarksComputed++;

          // Take monthly snapshot
          const { error: snapError } = await supabase
            .from('benchmark_snapshots')
            .upsert({
              benchmark_id: benchmark.id,
              snapshot_period: currentPeriod,
              sample_count: n,
              mean_value: benchmarkData.mean_value,
              median_value: benchmarkData.median_value,
              p25_value: benchmarkData.p25_value,
              p75_value: benchmarkData.p75_value,
            }, {
              onConflict: 'benchmark_id,snapshot_period',
            });

          if (!snapError) snapshotsTaken++;
        }
      } catch (err) {
        errors.push(`Group ${group.benchmark_type}/${group.scope_value}: ${(err as Error).message}`);
      }
    }

    // Step 4: Refresh materialized views
    try {
      await supabase.rpc('refresh_materialized_view', { view_name: 'geographic_risk_summary' }).throwOnError();
    } catch {
      // Materialized view refresh via RPC may not be available
      // This is expected — views can be refreshed manually
      console.log('[Market] Note: Materialized view refresh requires a custom RPC function');
    }

    console.log(`[Market] ✅ Recomputation complete: ${benchmarksComputed} benchmarks, ${snapshotsTaken} snapshots`);

  } catch (err) {
    const msg = `Full recomputation failed: ${(err as Error).message}`;
    console.error(`[Market] ❌ ${msg}`);
    errors.push(msg);
  }

  return { benchmarks_computed: benchmarksComputed, snapshots_taken: snapshotsTaken, errors };
}

// ============================================
// INCREMENTAL UPDATE
// ============================================

/**
 * Lightweight update after a single document analysis
 * Uses Welford's online algorithm for running mean/variance
 */
export async function incrementalBenchmarkUpdate(documentId: string): Promise<void> {
  const supabase = await createClient();

  try {
    // Fetch clauses for this document
    const { data: clauses, error: clauseError } = await supabase
      .from('clauses')
      .select('clause_type, extracted_value, extracted_unit, risk_level')
      .eq('document_id', documentId)
      .not('extracted_value', 'is', null);

    if (clauseError || !clauses || clauses.length === 0) return;

    // Fetch document info
    const { data: doc, error: docError } = await supabase
      .from('documents')
      .select('jurisdiction, document_type, contribute_to_benchmarks')
      .eq('id', documentId)
      .single();

    if (docError || !doc || doc.contribute_to_benchmarks === false) return;

    const jurisdiction = normalizeJurisdiction(doc.jurisdiction) || null;

    for (const clause of clauses) {
      const benchmarkType = CLAUSE_TO_BENCHMARK[clause.clause_type];
      if (!benchmarkType) continue;

      const value = Number(clause.extracted_value);
      if (isNaN(value)) continue;

      // Check outliers
      const thresholds = OUTLIER_THRESHOLDS[benchmarkType];
      if (thresholds && (value < thresholds.min || value > thresholds.max)) continue;

      // Update national benchmark
      await updateSingleBenchmark(supabase, benchmarkType, 'national', 'all', doc.document_type, null, value);

      // Update state benchmark
      if (jurisdiction && jurisdiction !== 'national') {
        await updateSingleBenchmark(supabase, benchmarkType, 'state', jurisdiction, doc.document_type, jurisdiction, value);
      }

      // Update document_type benchmark
      await updateSingleBenchmark(supabase, benchmarkType, 'document_type', doc.document_type, doc.document_type, null, value);
    }

    console.log(`[Market] ✅ Incremental update for document ${documentId}`);
  } catch (err) {
    console.error(`[Market] Incremental update failed for ${documentId}:`, err);
  }
}

/**
 * Update a single benchmark using Welford's online algorithm
 */
async function updateSingleBenchmark(
  supabase: any,
  benchmarkType: BenchmarkType,
  scopeType: ScopeType,
  scopeValue: string,
  documentType: string,
  jurisdiction: string | null,
  newValue: number
): Promise<void> {
  // Fetch existing benchmark
  let query = supabase
    .from('market_benchmarks')
    .select('*')
    .eq('benchmark_type', benchmarkType)
    .eq('scope_type', scopeType)
    .eq('scope_value', scopeValue);

  if (documentType) {
    query = query.eq('document_type', documentType);
  } else {
    query = query.is('document_type', null);
  }

  const { data: existing } = await query.maybeSingle();

  if (existing) {
    // Update using Welford's
    const stats = initFromExisting(
      existing.mean_value || 0,
      (existing.stddev_value || 0) ** 2,
      existing.sample_count || 0
    );
    const updated = updateRunningStats(stats, newValue);
    const minSamples = MINIMUM_SAMPLES[scopeType] || 10;

    await supabase
      .from('market_benchmarks')
      .update({
        sample_count: updated.count,
        mean_value: Math.round(updated.mean * 100) / 100,
        stddev_value: Math.round(Math.sqrt(updated.variance) * 100) / 100,
        min_value: existing.min_value !== null ? Math.min(existing.min_value, newValue) : newValue,
        max_value: existing.max_value !== null ? Math.max(existing.max_value, newValue) : newValue,
        is_sufficient: updated.count >= minSamples,
        updated_at: new Date().toISOString(),
      })
      .eq('id', existing.id);
  } else {
    // Create new benchmark
    const minSamples = MINIMUM_SAMPLES[scopeType] || 10;

    await supabase
      .from('market_benchmarks')
      .insert({
        benchmark_type: benchmarkType,
        scope_type: scopeType,
        scope_value: scopeValue,
        document_type: documentType || null,
        jurisdiction: jurisdiction,
        sample_count: 1,
        mean_value: newValue,
        median_value: newValue,
        min_value: newValue,
        max_value: newValue,
        stddev_value: 0,
        p10_value: newValue,
        p25_value: newValue,
        p75_value: newValue,
        p90_value: newValue,
        is_sufficient: 1 >= minSamples,
        minimum_sample_count: minSamples,
        data_freshness_days: 0,
      });
  }
}

// ============================================
// HELPER: Percentile interpolation
// ============================================

function interpolatePercentile(sorted: number[], percentile: number): number {
  if (sorted.length === 0) return 0;
  if (sorted.length === 1) return sorted[0];

  const p = percentile / 100;
  const index = p * (sorted.length - 1);
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  const fraction = index - lower;

  if (lower === upper) return sorted[lower];
  return sorted[lower] + fraction * (sorted[upper] - sorted[lower]);
}

// ============================================
// HELPER: Generate distribution buckets
// ============================================

function generateBuckets(sorted: number[], bucketCount: number): DistributionBucket[] {
  if (sorted.length === 0) return [];

  const min = sorted[0];
  const max = sorted[sorted.length - 1];

  if (min === max) {
    return [{ bucket_min: min, bucket_max: max, count: sorted.length, percentage: 100 }];
  }

  const buckets: DistributionBucket[] = [];
  const width = (max - min) / bucketCount;

  for (let i = 0; i < bucketCount; i++) {
    const bMin = min + i * width;
    const bMax = i === bucketCount - 1 ? max : min + (i + 1) * width;

    const count = sorted.filter(
      (v) => v >= bMin && (i === bucketCount - 1 ? v <= max : v < bMax)
    ).length;

    buckets.push({
      bucket_min: Math.round(bMin * 100) / 100,
      bucket_max: Math.round(bMax * 100) / 100,
      count,
      percentage: Math.round((count / sorted.length) * 100),
    });
  }

  return buckets;
}
