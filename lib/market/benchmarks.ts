// ============================================
// BENCHMARK CRUD OPERATIONS
// Database read/write for market_benchmarks table
// ============================================

import { createClient } from '@/lib/supabase/server';
import type { MarketBenchmark, BenchmarkQuery } from '@/types/market';
import { SEED_BENCHMARKS, BENCHMARK_TYPE_LABELS } from './constants';

/**
 * Get a single benchmark by type and scope with cascading fallback
 * Tries: city → state → document_type → national
 */
export async function getBenchmark(query: BenchmarkQuery): Promise<MarketBenchmark | null> {
  const supabase = await createClient();

  // Build fallback chain
  const lookups: Array<{
    scope_type: string;
    scope_value: string;
    city?: string | null;
    jurisdiction?: string | null;
    document_type?: string | null;
  }> = [];

  // Level 1: City-specific
  if (query.city) {
    lookups.push({
      scope_type: 'city',
      scope_value: query.city,
      document_type: query.document_type || null,
    });
  }

  // Level 2: State-specific
  if (query.jurisdiction) {
    lookups.push({
      scope_type: 'state',
      scope_value: query.jurisdiction,
      document_type: query.document_type || null,
    });
  }

  // Level 3: Document type
  if (query.document_type) {
    lookups.push({
      scope_type: 'document_type',
      scope_value: query.document_type,
      document_type: query.document_type,
    });
  }

  // Level 4: National
  lookups.push({
    scope_type: 'national',
    scope_value: 'all',
    document_type: query.document_type || null,
  });

  // Try each level
  for (const lookup of lookups) {
    let q = supabase
      .from('market_benchmarks')
      .select('*')
      .eq('benchmark_type', query.benchmark_type)
      .eq('scope_type', lookup.scope_type)
      .eq('scope_value', lookup.scope_value);

    if (lookup.document_type) {
      q = q.eq('document_type', lookup.document_type);
    }

    if (query.is_sufficient !== undefined) {
      q = q.eq('is_sufficient', query.is_sufficient);
    }

    const { data, error } = await q.maybeSingle();

    if (!error && data && data.sample_count > 0) {
      return data as MarketBenchmark;
    }
  }

  // Fallback: Try seed data
  return getSeedBenchmark(query);
}

/**
 * Get all benchmarks of a given type
 */
export async function getBenchmarksByType(
  benchmarkType: string,
  options?: {
    document_type?: string;
    scope_type?: string;
    is_sufficient?: boolean;
    limit?: number;
  }
): Promise<MarketBenchmark[]> {
  const supabase = await createClient();

  let query = supabase
    .from('market_benchmarks')
    .select('*')
    .eq('benchmark_type', benchmarkType)
    .order('sample_count', { ascending: false });

  if (options?.document_type) {
    query = query.eq('document_type', options.document_type);
  }
  if (options?.scope_type) {
    query = query.eq('scope_type', options.scope_type);
  }
  if (options?.is_sufficient !== undefined) {
    query = query.eq('is_sufficient', options.is_sufficient);
  }
  if (options?.limit) {
    query = query.limit(options.limit);
  }

  const { data, error } = await query;

  if (error || !data) return [];
  return data as MarketBenchmark[];
}

/**
 * Get all benchmarks for a specific scope
 */
export async function getBenchmarksByScope(
  scopeType: string,
  scopeValue: string,
  documentType?: string
): Promise<MarketBenchmark[]> {
  const supabase = await createClient();

  let query = supabase
    .from('market_benchmarks')
    .select('*')
    .eq('scope_type', scopeType)
    .eq('scope_value', scopeValue);

  if (documentType) {
    query = query.eq('document_type', documentType);
  }

  const { data, error } = await query;
  if (error || !data) return [];
  return data as MarketBenchmark[];
}

/**
 * Upsert a benchmark — create or update
 */
export async function upsertBenchmark(
  benchmarkData: Partial<MarketBenchmark>
): Promise<MarketBenchmark | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('market_benchmarks')
    .upsert(
      {
        ...benchmarkData,
        last_computed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: 'benchmark_type,scope_type,scope_value,document_type,sub_type,jurisdiction,city,area,industry,role_level,property_type,lender_category',
      }
    )
    .select()
    .single();

  if (error) {
    console.error('[Market] Upsert benchmark failed:', error.message);
    return null;
  }

  return data as MarketBenchmark;
}

/**
 * Get platform stats
 */
export async function getPlatformStats() {
  const supabase = await createClient();

  const [
    { count: totalBenchmarks },
    { count: totalTrends },
  ] = await Promise.all([
    supabase.from('market_benchmarks').select('*', { count: 'exact', head: true }),
    supabase.from('market_trends').select('*', { count: 'exact', head: true }),
  ]);

  const { data: lastComputation } = await supabase
    .from('market_benchmarks')
    .select('last_computed_at')
    .order('last_computed_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  return {
    benchmarks_computed: totalBenchmarks || 0,
    trends_detected: totalTrends || 0,
    last_computation: lastComputation?.last_computed_at || null,
  };
}

// ============================================
// SEED DATA FALLBACK
// ============================================

function getSeedBenchmark(query: BenchmarkQuery): MarketBenchmark | null {
  const typeSeeds = SEED_BENCHMARKS[query.benchmark_type];
  if (!typeSeeds) return null;

  // Try jurisdiction-specific seed
  let seed = query.jurisdiction ? typeSeeds[query.jurisdiction] : null;

  // Fall back to national seed
  if (!seed) seed = typeSeeds['national'];
  if (!seed) {
    // Try first available seed
    const firstKey = Object.keys(typeSeeds)[0];
    if (firstKey) seed = typeSeeds[firstKey];
  }
  if (!seed) return null;

  const p25 = seed.p25 ?? seed.median * 0.7;
  const p75 = seed.p75 ?? seed.median * 1.3;

  return {
    id: `seed-${query.benchmark_type}-${query.jurisdiction || 'national'}`,
    benchmark_type: query.benchmark_type,
    scope_type: query.jurisdiction ? 'state' : 'national',
    scope_value: query.jurisdiction || 'all',
    document_type: query.document_type || null,
    sub_type: null,
    jurisdiction: query.jurisdiction || null,
    city: query.city || null,
    area: null,
    industry: null,
    role_level: null,
    property_type: null,
    lender_category: null,
    sample_count: 0,
    mean_value: seed.median,
    median_value: seed.median,
    p10_value: p25 * 0.7,
    p25_value: p25,
    p75_value: p75,
    p90_value: p75 * 1.3,
    min_value: p25 * 0.5,
    max_value: p75 * 1.5,
    stddev_value: (p75 - p25) / 1.35,
    value_unit: seed.unit,
    distribution_buckets: [],
    risk_distribution: {},
    last_computed_at: new Date().toISOString(),
    data_freshness_days: 0,
    is_sufficient: false,
    minimum_sample_count: 10,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}
