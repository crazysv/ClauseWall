// ============================================
// CLAUSEWALL MARKET INTELLIGENCE TYPES
// Market benchmarks, comparisons, trends, and geographic data
// ============================================

// ============================================
// BENCHMARK TYPES
// ============================================

export type BenchmarkType =
  | 'security_deposit'
  | 'notice_period'
  | 'lock_in_period'
  | 'penalty_amount'
  | 'interest_rate'
  | 'maintenance_charge'
  | 'rent_increase_cap'
  | 'non_compete_duration'
  | 'non_compete_radius'
  | 'termination_notice'
  | 'refund_period'
  | 'liability_cap'
  | 'auto_renewal_period'
  | 'late_payment_penalty'
  | 'advance_rent'
  | 'brokerage_fee'
  | 'overall_risk_score'
  | 'power_balance_skew'
  | 'illegal_clause_ratio'
  | 'clause_count';

export type ScopeType =
  | 'national'
  | 'state'
  | 'city'
  | 'area'
  | 'industry'
  | 'entity'
  | 'document_type'
  | 'lender_category';

export interface BenchmarkScope {
  scope_type: ScopeType;
  scope_value: string;
  document_type?: string | null;
  sub_type?: string | null;
  jurisdiction?: string | null;
  city?: string | null;
  area?: string | null;
  industry?: string | null;
  role_level?: string | null;
  property_type?: string | null;
  lender_category?: string | null;
}

export interface DistributionBucket {
  bucket_min: number;
  bucket_max: number;
  count: number;
  percentage: number;
}

export interface RiskDistribution {
  safe_pct: number;
  warning_pct: number;
  dangerous_pct: number;
  illegal_pct: number;
}

export interface MarketBenchmark {
  id: string;
  benchmark_type: BenchmarkType;
  scope_type: ScopeType;
  scope_value: string;
  document_type: string | null;
  sub_type: string | null;
  jurisdiction: string | null;
  city: string | null;
  area: string | null;
  industry: string | null;
  role_level: string | null;
  property_type: string | null;
  lender_category: string | null;
  sample_count: number;
  mean_value: number | null;
  median_value: number | null;
  p10_value: number | null;
  p25_value: number | null;
  p75_value: number | null;
  p90_value: number | null;
  min_value: number | null;
  max_value: number | null;
  stddev_value: number | null;
  value_unit: string | null;
  distribution_buckets: DistributionBucket[];
  risk_distribution: RiskDistribution | Record<string, never>;
  last_computed_at: string;
  data_freshness_days: number;
  is_sufficient: boolean;
  minimum_sample_count: number;
  created_at: string;
  updated_at: string;
}

export interface BenchmarkQuery {
  benchmark_type: BenchmarkType;
  scope_type?: ScopeType;
  scope_value?: string;
  document_type?: string;
  jurisdiction?: string;
  city?: string;
  area?: string;
  industry?: string;
  role_level?: string;
  property_type?: string;
  lender_category?: string;
  is_sufficient?: boolean;
}

export interface BenchmarkResult {
  benchmark: MarketBenchmark;
  comparison?: ComparisonResult;
  scope_label: string;
  data_quality: 'sufficient' | 'partial' | 'seed';
}

// ============================================
// COMPARISON TYPES
// ============================================

export type PercentilePosition =
  | 'far_below'
  | 'below_average'
  | 'average'
  | 'above_average'
  | 'far_above';

export interface ComparisonInput {
  value: number;
  unit: string;
  clause_type: string;
  document_type: string;
  jurisdiction?: string;
  city?: string;
  area?: string;
  industry?: string;
  role_level?: string;
  property_type?: string;
  lender_category?: string;
}

export interface ComparisonResult {
  percentile_rank: number;
  position: PercentilePosition;
  position_label: string;
  benchmark: MarketBenchmark;
  narrative: string;
  scope_used: string;
  chart_data: {
    distribution: DistributionBucket[];
    user_value: number;
    median: number;
    mean: number;
    p25: number;
    p75: number;
  };
  is_favorable: boolean;
  color: string;
}

export interface ClauseMarketContext {
  clause_id: string;
  comparison: ComparisonResult | null;
  benchmark: MarketBenchmark | null;
  has_data: boolean;
  sample_count: number;
  data_quality: 'sufficient' | 'partial' | 'seed' | 'none';
}

// ============================================
// TREND TYPES
// ============================================

export type TrendType =
  | 'increasing'
  | 'decreasing'
  | 'stable'
  | 'spike'
  | 'drop'
  | 'seasonal'
  | 'convergence'
  | 'divergence';

export type AlertSeverity = 'info' | 'warning' | 'critical';

export interface MarketTrend {
  id: string;
  benchmark_id: string;
  trend_type: TrendType;
  change_percent: number;
  period_months: number;
  confidence: number | null;
  start_value: number | null;
  end_value: number | null;
  description: string;
  ai_narrative: string | null;
  is_significant: boolean;
  significance_reason: string | null;
  is_alert: boolean;
  alert_severity: AlertSeverity | null;
  detected_at: string;
  expires_at: string | null;
}

export interface TrendInsight {
  trend: MarketTrend;
  benchmark: MarketBenchmark;
  narrative: string;
  severity: AlertSeverity;
  actionable_advice: string;
}

export interface TrendAlert {
  trend_id: string;
  message: string;
  severity: AlertSeverity;
  benchmark_type: BenchmarkType;
  scope_label: string;
}

export interface TrendDataPoint {
  period: string;
  value: number | null;
  sample_count: number;
}

export interface TrendPeriod {
  start_month: string;
  end_month: string;
  data_points: TrendDataPoint[];
}

export interface BenchmarkSnapshot {
  id: string;
  benchmark_id: string;
  snapshot_period: string;
  sample_count: number;
  mean_value: number | null;
  median_value: number | null;
  p25_value: number | null;
  p75_value: number | null;
  snapshot_at: string;
}

// ============================================
// GEOGRAPHIC TYPES
// ============================================

export interface GeographicRiskData {
  state_code: string;
  state_name: string;
  geo_id: string;
  avg_risk_score: number;
  total_contracts: number;
  high_risk_count: number;
  low_risk_count: number;
  avg_illegal_pct: number;
  avg_dangerous_pct: number;
  risk_level_color: string;
  last_analysis_date: string | null;
}

export interface CityRiskData {
  city: string;
  avg_risk_score: number;
  total_contracts: number;
  top_issues: string[];
  document_types: string[];
}

export interface StateBreakdown {
  state_code: string;
  state_name: string;
  cities: CityRiskData[];
  total_contracts: number;
  avg_risk_score: number;
}

export interface HeatMapData {
  regions: GeographicRiskData[];
  national_average: number;
  total_contracts: number;
  last_updated: string | null;
}

// ============================================
// ENTITY COMPARISON TYPES
// ============================================

export interface EntityMarketPosition {
  entity_name: string;
  document_type: string;
  jurisdiction: string;
  total_contracts: number;
  avg_risk_score: number;
  market_avg_risk_score: number;
  percentile: number;
  total_illegal_clauses: number;
  total_dangerous_clauses: number;
  avg_illegal_pct: number;
  first_seen: string;
  last_seen: string;
}

export interface EntityComparison {
  entity: EntityMarketPosition;
  market_average: number;
  deviation_percent: number;
  is_worse_than_market: boolean;
  narrative: string;
}

// ============================================
// AMMUNITION TYPES
// ============================================

export interface AmmunitionSection {
  heading: string;
  clause_number: number | null;
  clause_type: string;
  user_value: number;
  user_unit: string;
  market_median: number;
  percentile_rank: number;
  sample_count: number;
  narrative: string;
  chart_data: DistributionBucket[] | null;
}

export interface AmmunitionReport {
  title: string;
  target_audience: 'counterparty' | 'consumer_forum' | 'lawyer';
  document_type: string;
  jurisdiction: string;
  entity_name: string | null;
  sections: AmmunitionSection[];
  overall_summary: string;
  generated_at: string;
}

// ============================================
// DASHBOARD TYPES
// ============================================

export interface MarketOverview {
  total_contracts: number;
  total_cities: number;
  total_states: number;
  total_entity_types: number;
  average_risk_score: number;
  contracts_this_month: number;
  coverage_percentage: number;
}

export interface CategoryBenchmarkSummary {
  document_type: string;
  display_name: string;
  icon: string;
  avg_risk_score: number;
  total_contracts: number;
  illegal_pct: number;
  key_metric_label: string;
  key_metric_value: string;
}

export interface MarketDashboardData {
  overview: MarketOverview;
  category_summaries: CategoryBenchmarkSummary[];
  heat_map_data: HeatMapData;
  trending_insights: TrendInsight[];
  recent_trends: MarketTrend[];
}

// ============================================
// PLATFORM STATS
// ============================================

export interface PlatformStats {
  total_analyzed: number;
  total_clauses: number;
  jurisdictions_covered: number;
  contract_types_covered: number;
  cities_covered: number;
  entities_tracked: number;
  benchmarks_computed: number;
  trends_detected: number;
  last_computation: string | null;
}

// ============================================
// API REQUEST/RESPONSE TYPES
// ============================================

export interface MarketCompareRequest {
  document_id?: string;
  clauses?: {
    clause_id: string;
    value: number;
    unit: string;
    clause_type: string;
  }[];
  document_type: string;
  jurisdiction?: string;
  city?: string;
}

export interface MarketCompareResponse {
  success: boolean;
  comparisons: ClauseMarketContext[];
  document_type: string;
  total_benchmarks_found: number;
}

export interface BenchmarkComputeRequest {
  admin_key: string;
  full_recompute?: boolean;
}

export interface AmmunitionRequest {
  document_id: string;
  clause_ids: string[];
  target_audience: 'counterparty' | 'consumer_forum' | 'lawyer';
}

export interface NarrativeRequest {
  benchmark_id: string;
  trend_id?: string;
  context?: string;
}

// ============================================
// SEED DATA TYPES
// ============================================

export interface SeedBenchmark {
  median: number;
  unit: string;
  source: string;
  p25?: number;
  p75?: number;
}

export interface SeedBenchmarks {
  [benchmarkType: string]: {
    [scopeKey: string]: SeedBenchmark;
  };
}

// ============================================
// STATE MAPPING TYPES
// ============================================

export interface IndianState {
  name: string;
  geo_id: string;
  major_cities: string[];
  code: string;
}

export interface CityNormalization {
  canonical: string;
  state: string;
  aliases: string[];
}
