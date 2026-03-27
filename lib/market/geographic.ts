// ============================================
// GEOGRAPHIC DATA AGGREGATION LOGIC
// Separate from constants — handles DB queries
// ============================================

import { createClient } from '@/lib/supabase/server';
import type { GeographicRiskData, HeatMapData, StateBreakdown, CityRiskData } from '@/types/market';
import { INDIAN_STATES, getRiskColor, normalizeJurisdiction } from './constants';

/**
 * Get geographic risk data for the India heat map
 */
export async function getGeographicRiskData(): Promise<HeatMapData> {
  const supabase = await createClient();

  // Try materialized view first
  const { data: matView, error: matError } = await supabase
    .from('geographic_risk_summary')
    .select('*');

  let regions: GeographicRiskData[] = [];
  let totalContracts = 0;
  let nationalAverage = 0;

  if (!matError && matView && matView.length > 0) {
    // Group by state across document types
    const stateMap = new Map<string, {
      total_contracts: number;
      weighted_risk_sum: number;
      high_risk: number;
      low_risk: number;
      illegal_pct: number;
      dangerous_pct: number;
      last_date: string | null;
    }>();

    for (const row of matView) {
      const stateKey = normalizeJurisdiction(row.state_code || '') || row.state_code;
      if (!stateKey) continue;

      const existing = stateMap.get(stateKey) || {
        total_contracts: 0,
        weighted_risk_sum: 0,
        high_risk: 0,
        low_risk: 0,
        illegal_pct: 0,
        dangerous_pct: 0,
        last_date: null,
      };

      existing.total_contracts += row.total_contracts;
      existing.weighted_risk_sum += row.avg_risk_score * row.total_contracts;
      existing.high_risk += row.high_risk_count || 0;
      existing.low_risk += row.low_risk_count || 0;
      existing.illegal_pct = Math.max(existing.illegal_pct, row.avg_illegal_pct || 0);
      existing.dangerous_pct = Math.max(existing.dangerous_pct, row.avg_dangerous_pct || 0);
      if (!existing.last_date || (row.last_analysis_date && row.last_analysis_date > existing.last_date)) {
        existing.last_date = row.last_analysis_date;
      }

      stateMap.set(stateKey, existing);
      totalContracts += row.total_contracts;
    }

    let riskSum = 0;
    let riskCount = 0;

    for (const [stateKey, data] of stateMap) {
      const stateInfo = INDIAN_STATES[stateKey];
      const avgRisk = data.total_contracts > 0
        ? Math.round((data.weighted_risk_sum / data.total_contracts) * 10) / 10
        : 0;

      riskSum += avgRisk * data.total_contracts;
      riskCount += data.total_contracts;

      regions.push({
        state_code: stateInfo?.code || stateKey.toUpperCase().substring(0, 2),
        state_name: stateInfo?.name || stateKey.replace(/_/g, ' '),
        geo_id: stateInfo?.geo_id || `IN-${stateKey.toUpperCase().substring(0, 2)}`,
        avg_risk_score: avgRisk,
        total_contracts: data.total_contracts,
        high_risk_count: data.high_risk,
        low_risk_count: data.low_risk,
        avg_illegal_pct: data.illegal_pct,
        avg_dangerous_pct: data.dangerous_pct,
        risk_level_color: getRiskColor(avgRisk),
        last_analysis_date: data.last_date,
      });
    }

    nationalAverage = riskCount > 0 ? Math.round((riskSum / riskCount) * 10) / 10 : 0;
  } else {
    // Fallback: Direct query on documents
    const { data: docs, error: docError } = await supabase
      .from('documents')
      .select('jurisdiction, overall_risk_score, illegal_count, dangerous_count, total_clauses, created_at')
      .eq('analysis_status', 'completed')
      .not('overall_risk_score', 'is', null)
      .not('contribute_to_benchmarks', 'eq', false);

    if (!docError && docs && docs.length > 0) {
      const stateMap = new Map<string, {
        scores: number[];
        illegal_counts: number[];
        dangerous_counts: number[];
        clause_counts: number[];
        last_date: string | null;
      }>();

      for (const doc of docs) {
        const stateKey = normalizeJurisdiction(doc.jurisdiction || '') || 'unknown';
        const existing = stateMap.get(stateKey) || {
          scores: [],
          illegal_counts: [],
          dangerous_counts: [],
          clause_counts: [],
          last_date: null,
        };

        existing.scores.push(doc.overall_risk_score);
        existing.illegal_counts.push(doc.illegal_count || 0);
        existing.dangerous_counts.push(doc.dangerous_count || 0);
        existing.clause_counts.push(doc.total_clauses || 1);
        if (!existing.last_date || doc.created_at > existing.last_date) {
          existing.last_date = doc.created_at;
        }

        stateMap.set(stateKey, existing);
        totalContracts++;
      }

      let riskSum = 0;
      for (const [stateKey, data] of stateMap) {
        const stateInfo = INDIAN_STATES[stateKey];
        const avgRisk = Math.round(
          (data.scores.reduce((s, v) => s + v, 0) / data.scores.length) * 10
        ) / 10;

        riskSum += avgRisk;

        const totalClauses = data.clause_counts.reduce((s, v) => s + v, 0) || 1;
        const totalIllegal = data.illegal_counts.reduce((s, v) => s + v, 0);
        const totalDangerous = data.dangerous_counts.reduce((s, v) => s + v, 0);

        regions.push({
          state_code: stateInfo?.code || stateKey.toUpperCase().substring(0, 2),
          state_name: stateInfo?.name || stateKey.replace(/_/g, ' '),
          geo_id: stateInfo?.geo_id || `IN-${stateKey.toUpperCase().substring(0, 2)}`,
          avg_risk_score: avgRisk,
          total_contracts: data.scores.length,
          high_risk_count: data.scores.filter(s => s > 70).length,
          low_risk_count: data.scores.filter(s => s <= 30).length,
          avg_illegal_pct: Math.round((totalIllegal / totalClauses) * 1000) / 10,
          avg_dangerous_pct: Math.round((totalDangerous / totalClauses) * 1000) / 10,
          risk_level_color: getRiskColor(avgRisk),
          last_analysis_date: data.last_date,
        });
      }

      nationalAverage = regions.length > 0
        ? Math.round((riskSum / regions.length) * 10) / 10
        : 0;
    }
  }

  // Get last updated
  const lastUpdated = regions.length > 0
    ? regions.reduce((latest, r) =>
        r.last_analysis_date && (!latest || r.last_analysis_date > latest)
          ? r.last_analysis_date
          : latest,
      null as string | null)
    : null;

  return {
    regions,
    national_average: nationalAverage,
    total_contracts: totalContracts,
    last_updated: lastUpdated,
  };
}

/**
 * Get detailed state breakdown with city-level data
 */
export async function getStateBreakdown(stateKey: string): Promise<StateBreakdown | null> {
  const supabase = await createClient();
  const stateInfo = INDIAN_STATES[stateKey];
  if (!stateInfo) return null;

  const { data: docs, error } = await supabase
    .from('documents')
    .select('jurisdiction, overall_risk_score, document_type, entity_name, city, created_at')
    .eq('analysis_status', 'completed')
    .ilike('jurisdiction', `%${stateInfo.name}%`)
    .not('contribute_to_benchmarks', 'eq', false);

  if (error || !docs || docs.length === 0) return null;

  const cityMap = new Map<string, {
    scores: number[];
    doc_types: Set<string>;
    issues: string[];
  }>();

  for (const doc of docs) {
    const cityKey = doc.city || 'unknown';
    const existing = cityMap.get(cityKey) || {
      scores: [],
      doc_types: new Set<string>(),
      issues: [],
    };

    existing.scores.push(doc.overall_risk_score || 0);
    if (doc.document_type) existing.doc_types.add(doc.document_type);

    cityMap.set(cityKey, existing);
  }

  const cities: CityRiskData[] = [];
  for (const [cityName, data] of cityMap) {
    cities.push({
      city: cityName,
      avg_risk_score: Math.round(
        (data.scores.reduce((s, v) => s + v, 0) / data.scores.length) * 10
      ) / 10,
      total_contracts: data.scores.length,
      top_issues: data.issues.slice(0, 5),
      document_types: Array.from(data.doc_types),
    });
  }

  cities.sort((a, b) => b.total_contracts - a.total_contracts);

  return {
    state_code: stateInfo.code,
    state_name: stateInfo.name,
    cities,
    total_contracts: docs.length,
    avg_risk_score: Math.round(
      (docs.reduce((s, d) => s + (d.overall_risk_score || 0), 0) / docs.length) * 10
    ) / 10,
  };
}
