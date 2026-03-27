// ============================================
// MARKET INTELLIGENCE MODULE — PUBLIC API
// All market intelligence logic re-exports
// ============================================

/*
═══════════════════════════════════════════════════════════════════════════════
SQL MIGRATION — Run this in Supabase SQL Editor
═══════════════════════════════════════════════════════════════════════════════

-- ================================================================
-- 1. Add opt-out column to documents table
-- ================================================================
ALTER TABLE documents ADD COLUMN IF NOT EXISTS contribute_to_benchmarks BOOLEAN DEFAULT true;

-- ================================================================
-- 2. Precomputed benchmark statistics
-- ================================================================
CREATE TABLE IF NOT EXISTS market_benchmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Categorization (what this benchmark measures)
  benchmark_type TEXT NOT NULL CHECK (benchmark_type IN (
    'security_deposit',
    'notice_period',
    'lock_in_period',
    'penalty_amount',
    'interest_rate',
    'maintenance_charge',
    'rent_increase_cap',
    'non_compete_duration',
    'non_compete_radius',
    'termination_notice',
    'refund_period',
    'liability_cap',
    'auto_renewal_period',
    'late_payment_penalty',
    'advance_rent',
    'brokerage_fee',
    'overall_risk_score',
    'power_balance_skew',
    'illegal_clause_ratio',
    'clause_count'
  )),

  -- Scope dimensions (what population this benchmark covers)
  scope_type TEXT NOT NULL CHECK (scope_type IN (
    'national',
    'state',
    'city',
    'area',
    'industry',
    'entity',
    'document_type',
    'lender_category'
  )),
  scope_value TEXT NOT NULL,

  -- Secondary filters (optional, for cross-dimensional queries)
  document_type TEXT,
  sub_type TEXT,
  jurisdiction TEXT,
  city TEXT,
  area TEXT,
  industry TEXT,
  role_level TEXT,
  property_type TEXT,
  lender_category TEXT,

  -- Statistical values
  sample_count INT NOT NULL DEFAULT 0,
  mean_value NUMERIC,
  median_value NUMERIC,
  p10_value NUMERIC,
  p25_value NUMERIC,
  p75_value NUMERIC,
  p90_value NUMERIC,
  min_value NUMERIC,
  max_value NUMERIC,
  stddev_value NUMERIC,
  value_unit TEXT,

  -- Distribution buckets (for histogram rendering)
  distribution_buckets JSONB DEFAULT '[]',

  -- Risk distribution (for clause/risk benchmarks)
  risk_distribution JSONB DEFAULT '{}',

  -- Metadata
  last_computed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  data_freshness_days INT DEFAULT 0,
  is_sufficient BOOLEAN DEFAULT false,
  minimum_sample_count INT DEFAULT 10,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Unique constraint
  UNIQUE(benchmark_type, scope_type, scope_value, document_type, sub_type,
         jurisdiction, city, area, industry, role_level, property_type, lender_category)
);

-- ================================================================
-- 3. Historical snapshots for trend detection
-- ================================================================
CREATE TABLE IF NOT EXISTS benchmark_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  benchmark_id UUID NOT NULL REFERENCES market_benchmarks(id) ON DELETE CASCADE,

  snapshot_period TEXT NOT NULL,

  sample_count INT NOT NULL,
  mean_value NUMERIC,
  median_value NUMERIC,
  p25_value NUMERIC,
  p75_value NUMERIC,

  snapshot_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(benchmark_id, snapshot_period)
);

-- ================================================================
-- 4. Detected trends and AI-generated insights
-- ================================================================
CREATE TABLE IF NOT EXISTS market_trends (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  benchmark_id UUID NOT NULL REFERENCES market_benchmarks(id) ON DELETE CASCADE,

  trend_type TEXT NOT NULL CHECK (trend_type IN (
    'increasing',
    'decreasing',
    'stable',
    'spike',
    'drop',
    'seasonal',
    'convergence',
    'divergence'
  )),

  change_percent NUMERIC NOT NULL,
  period_months INT NOT NULL,
  confidence NUMERIC,
  start_value NUMERIC,
  end_value NUMERIC,

  description TEXT NOT NULL,
  ai_narrative TEXT,
  is_significant BOOLEAN DEFAULT false,
  significance_reason TEXT,

  is_alert BOOLEAN DEFAULT false,
  alert_severity TEXT CHECK (alert_severity IN ('info', 'warning', 'critical')),

  detected_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,

  UNIQUE(benchmark_id, trend_type, period_months)
);

-- ================================================================
-- 5. Indexes for performance
-- ================================================================
CREATE INDEX IF NOT EXISTS idx_benchmarks_type ON market_benchmarks(benchmark_type);
CREATE INDEX IF NOT EXISTS idx_benchmarks_scope ON market_benchmarks(scope_type, scope_value);
CREATE INDEX IF NOT EXISTS idx_benchmarks_document ON market_benchmarks(document_type);
CREATE INDEX IF NOT EXISTS idx_benchmarks_city ON market_benchmarks(city);
CREATE INDEX IF NOT EXISTS idx_benchmarks_sufficient ON market_benchmarks(is_sufficient) WHERE is_sufficient = true;
CREATE INDEX IF NOT EXISTS idx_benchmarks_lookup ON market_benchmarks(benchmark_type, document_type, jurisdiction, city);
CREATE INDEX IF NOT EXISTS idx_snapshots_benchmark ON benchmark_snapshots(benchmark_id, snapshot_period);
CREATE INDEX IF NOT EXISTS idx_trends_benchmark ON market_trends(benchmark_id);
CREATE INDEX IF NOT EXISTS idx_trends_significant ON market_trends(is_significant) WHERE is_significant = true;
CREATE INDEX IF NOT EXISTS idx_trends_alert ON market_trends(is_alert) WHERE is_alert = true;

-- ================================================================
-- 6. Materialized view for fast geographic aggregation
-- ================================================================
CREATE MATERIALIZED VIEW IF NOT EXISTS geographic_risk_summary AS
SELECT
  d.jurisdiction AS state_code,
  COALESCE(d.detected_jurisdiction, d.jurisdiction) AS display_jurisdiction,
  d.document_type,
  COUNT(*) AS total_contracts,
  ROUND(AVG(d.overall_risk_score), 1) AS avg_risk_score,
  ROUND(AVG(
    CASE WHEN d.total_clauses > 0
    THEN d.illegal_count::numeric / d.total_clauses * 100
    ELSE 0 END
  ), 1) AS avg_illegal_pct,
  ROUND(AVG(
    CASE WHEN d.total_clauses > 0
    THEN d.dangerous_count::numeric / d.total_clauses * 100
    ELSE 0 END
  ), 1) AS avg_dangerous_pct,
  COUNT(*) FILTER (WHERE d.overall_risk_score > 70) AS high_risk_count,
  COUNT(*) FILTER (WHERE d.overall_risk_score <= 30) AS low_risk_count,
  MAX(d.created_at) AS last_analysis_date
FROM documents d
WHERE d.analysis_status = 'completed'
  AND d.overall_risk_score IS NOT NULL
  AND (d.contribute_to_benchmarks IS NOT false)
GROUP BY d.jurisdiction, COALESCE(d.detected_jurisdiction, d.jurisdiction), d.document_type;

CREATE UNIQUE INDEX IF NOT EXISTS idx_geo_risk_summary
  ON geographic_risk_summary(state_code, document_type);

-- ================================================================
-- 7. Materialized view for entity comparison
-- ================================================================
CREATE MATERIALIZED VIEW IF NOT EXISTS entity_risk_summary AS
SELECT
  d.entity_name,
  d.document_type,
  d.jurisdiction,
  COUNT(*) AS total_contracts,
  ROUND(AVG(d.overall_risk_score), 1) AS avg_risk_score,
  SUM(d.illegal_count) AS total_illegal_clauses,
  SUM(d.dangerous_count) AS total_dangerous_clauses,
  ROUND(AVG(
    CASE WHEN d.total_clauses > 0
    THEN d.illegal_count::numeric / d.total_clauses * 100
    ELSE 0 END
  ), 1) AS avg_illegal_pct,
  MIN(d.created_at) AS first_seen,
  MAX(d.created_at) AS last_seen
FROM documents d
WHERE d.analysis_status = 'completed'
  AND d.entity_name IS NOT NULL
  AND d.entity_name != ''
  AND d.overall_risk_score IS NOT NULL
  AND (d.contribute_to_benchmarks IS NOT false)
GROUP BY d.entity_name, d.document_type, d.jurisdiction
HAVING COUNT(*) >= 2;

CREATE UNIQUE INDEX IF NOT EXISTS idx_entity_risk_summary
  ON entity_risk_summary(entity_name, document_type, jurisdiction);

-- ================================================================
-- 8. RLS Policies
-- ================================================================
-- NO RLS on market_benchmarks, benchmark_snapshots, market_trends —
-- These contain ANONYMIZED aggregate data, readable by all users.
-- Individual contract data is NEVER stored in these tables.
-- The materialized views also contain only aggregated data.

-- Enable RLS but allow public reads
ALTER TABLE market_benchmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE benchmark_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE market_trends ENABLE ROW LEVEL SECURITY;

-- Allow all users to read benchmark data (public market intelligence)
CREATE POLICY "Public read access for benchmarks"
  ON market_benchmarks FOR SELECT
  USING (true);

CREATE POLICY "Service role can manage benchmarks"
  ON market_benchmarks FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Public read access for snapshots"
  ON benchmark_snapshots FOR SELECT
  USING (true);

CREATE POLICY "Service role can manage snapshots"
  ON benchmark_snapshots FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Public read access for trends"
  ON market_trends FOR SELECT
  USING (true);

CREATE POLICY "Service role can manage trends"
  ON market_trends FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

═══════════════════════════════════════════════════════════════════════════════
END SQL MIGRATION
═══════════════════════════════════════════════════════════════════════════════
*/

// Re-exports
export { recomputeAllBenchmarks, incrementalBenchmarkUpdate } from './aggregator';
export { getBenchmark, getBenchmarksByType, upsertBenchmark } from './benchmarks';
export { compareClauseToMarket, compareDocumentToMarket } from './comparator';
export { computePercentileRank, computeMedian, getPositionLabel, formatComparisonNarrative } from './percentile';
export { detectTrends } from './trends';
export { getGeographicRiskData, getStateBreakdown } from './geographic';
export { generateMarketNarrative } from './narrative';
export { generateAmmunitionReport } from './ammunition';
export { shouldRecompute } from './scheduler';
