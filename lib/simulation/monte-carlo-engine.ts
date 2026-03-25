// ============================================
// MONTE CARLO SIMULATION ENGINE
// 10,000 iterations × 36 months core loop
// ============================================

import type { Clause, StructuredRule } from "@/types";
import type {
  SimulationConfig,
  SimulationResult,
  PercentileData,
  SimulationStatistics,
  HistogramBin,
  ClauseRiskRanking,
  ClauseCostMapping,
} from "./types";
import {
  generateMonthlyEvents,
  updateCorrelations,
  decayCorrelations,
  buildDefaultConfig,
} from "./probability-engine";
import { buildClauseCostMap, getTriggeredClauses } from "./clause-cost-engine";

// ============================================
// CORE SIMULATION
// ============================================

/**
 * Run the full Monte Carlo simulation.
 * Returns results for both current contract terms and fair contract terms.
 */
export function runMonteCarloSimulation(
  clauses: Clause[],
  fairRules: StructuredRule[],
  configOverrides?: Partial<SimulationConfig>
): SimulationResult {
  const config = buildDefaultConfig(configOverrides);
  const clauseCostMap = buildClauseCostMap(clauses, fairRules);

  const results = new Float64Array(config.iterations);
  const fairResults = new Float64Array(config.iterations);

  // Track per-clause costs for ranking
  const clauseCostAccumulator = new Map<string, { total: number; worst: number; triggers: number }>();
  for (const clause of clauses) {
    clauseCostAccumulator.set(clause.id, { total: 0, worst: 0, triggers: 0 });
  }

  for (let i = 0; i < config.iterations; i++) {
    let totalCost = 0;
    let fairTotalCost = 0;
    const activeCorrelations: Record<string, number> = {};
    const iterationClauseCosts = new Map<string, number>();

    for (let month = 1; month <= config.months; month++) {
      // Generate events for this month (with correlation modifiers)
      const events = generateMonthlyEvents(month, config, activeCorrelations);

      for (const event of events) {
        // Update correlations
        updateCorrelations(activeCorrelations, event, config.correlations);

        // Find all clauses triggered by this event
        const triggeredClauses = getTriggeredClauses(clauseCostMap, event.type);

        for (const clauseMapping of triggeredClauses) {
          const cost = clauseMapping.costFunction(
            event,
            month,
            config.months,
            config.baseMonthlyCost,
            config.monthlyIncome
          );

          const fairCost = clauseMapping.fairCostFunction(
            event,
            month,
            config.months,
            config.baseMonthlyCost,
            config.monthlyIncome
          );

          totalCost += cost;
          fairTotalCost += fairCost;

          // Track per-clause
          const clauseId = clauseMapping.clause.id;
          const prev = iterationClauseCosts.get(clauseId) || 0;
          iterationClauseCosts.set(clauseId, prev + cost);
        }
      }

      // Decay correlations each month
      decayCorrelations(activeCorrelations);
    }

    results[i] = totalCost;
    fairResults[i] = fairTotalCost;

    // Update clause accumulators
    for (const [clauseId, cost] of iterationClauseCosts) {
      const acc = clauseCostAccumulator.get(clauseId);
      if (acc) {
        acc.total += cost;
        acc.worst = Math.max(acc.worst, cost);
        if (cost > 0) acc.triggers++;
      }
    }
  }

  const resultsArray = Array.from(results);
  const fairResultsArray = Array.from(fairResults);

  return {
    iterations: resultsArray,
    percentiles: calculatePercentiles(resultsArray),
    statistics: calculateStatistics(resultsArray),
    histogram: buildHistogram(resultsArray, 50),
    topRiskClauses: rankClausesByExpectedCost(
      clauses,
      clauseCostAccumulator,
      config.iterations
    ),
    fairIterations: fairResultsArray,
    fairPercentiles: calculatePercentiles(fairResultsArray),
    fairStatistics: calculateStatistics(fairResultsArray),
  };
}

// ============================================
// PERCENTILE CALCULATION
// ============================================

export function calculatePercentiles(results: number[]): PercentileData {
  const sorted = [...results].sort((a, b) => a - b);
  const n = sorted.length;

  return {
    p50: sorted[Math.floor(n * 0.5)] || 0,
    p75: sorted[Math.floor(n * 0.75)] || 0,
    p90: sorted[Math.floor(n * 0.9)] || 0,
    p95: sorted[Math.floor(n * 0.95)] || 0,
    p99: sorted[Math.floor(n * 0.99)] || 0,
    min: sorted[0] || 0,
    max: sorted[n - 1] || 0,
  };
}

// ============================================
// STATISTICS
// ============================================

export function calculateStatistics(results: number[]): SimulationStatistics {
  if (results.length === 0) {
    return {
      mean: 0,
      median: 0,
      stdDev: 0,
      min: 0,
      max: 0,
      total: 0,
      zeroLossCount: 0,
      zeroLossPercent: 0,
    };
  }

  const n = results.length;
  let sum = 0;
  let min = Infinity;
  let max = -Infinity;
  let zeroCount = 0;

  for (let i = 0; i < n; i++) {
    sum += results[i];
    if (results[i] < min) min = results[i];
    if (results[i] > max) max = results[i];
    if (results[i] === 0) zeroCount++;
  }

  const mean = sum / n;

  let varianceSum = 0;
  for (let i = 0; i < n; i++) {
    varianceSum += (results[i] - mean) ** 2;
  }

  return {
    mean,
    median: calculatePercentiles(results).p50,
    stdDev: Math.sqrt(varianceSum / n),
    min,
    max,
    total: n,
    zeroLossCount: zeroCount,
    zeroLossPercent: (zeroCount / n) * 100,
  };
}

// ============================================
// HISTOGRAM
// ============================================

export function buildHistogram(
  results: number[],
  bins: number
): HistogramBin[] {
  if (results.length === 0) return [];

  const max = Math.max(...results);
  if (max === 0) {
    return [{ lower: 0, upper: 1, count: results.length, percentage: 100 }];
  }

  const binWidth = max / bins;
  const histogram: HistogramBin[] = [];
  const n = results.length;

  for (let i = 0; i < bins; i++) {
    const lower = i * binWidth;
    const upper = (i + 1) * binWidth;
    let count = 0;

    for (let j = 0; j < n; j++) {
      if (results[j] >= lower && (i === bins - 1 ? results[j] <= upper : results[j] < upper)) {
        count++;
      }
    }

    histogram.push({
      lower,
      upper,
      count,
      percentage: (count / n) * 100,
    });
  }

  return histogram;
}

// ============================================
// CLAUSE RANKING
// ============================================

function rankClausesByExpectedCost(
  clauses: Clause[],
  accumulator: Map<string, { total: number; worst: number; triggers: number }>,
  iterations: number
): ClauseRiskRanking[] {
  const rankings: ClauseRiskRanking[] = [];

  for (const clause of clauses) {
    const acc = accumulator.get(clause.id);
    if (!acc || acc.total === 0) continue;

    rankings.push({
      clauseId: clause.id,
      clauseNumber: clause.clause_number,
      clauseType: clause.clause_type,
      expectedCost: acc.total / iterations,
      worstCaseCost: acc.worst,
      triggerProbability: (acc.triggers / iterations) * 100,
      riskLevel: clause.risk_level,
      originalText: clause.original_text,
    });
  }

  // Sort by expected cost descending
  rankings.sort((a, b) => b.expectedCost - a.expectedCost);

  return rankings.slice(0, 10); // top 10
}
