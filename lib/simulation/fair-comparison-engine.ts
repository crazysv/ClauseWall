// ============================================
// FAIR COMPARISON ENGINE
// Current contract vs fair contract delta
// ============================================

import type {
  SimulationResult,
  FairComparisonResult,
  FairComparisonClause,
  ClauseRiskRanking,
} from "./types";

/**
 * Build fair comparison analysis from simulation results.
 */
export function buildFairComparison(
  simulation: SimulationResult
): FairComparisonResult {
  const currentP90 = simulation.percentiles.p90;
  const fairP90 = simulation.fairPercentiles.p90;

  const clauseBreakdown: FairComparisonClause[] = simulation.topRiskClauses
    .map((clause: ClauseRiskRanking) => {
      // Estimate fair expected cost as 40% of current (ratio from fair simulation)
      const fairRatio =
        simulation.fairStatistics.mean > 0 && simulation.statistics.mean > 0
          ? simulation.fairStatistics.mean / simulation.statistics.mean
          : 0.3;

      const fairExpectedCost = clause.expectedCost * fairRatio;
      const premium = clause.expectedCost - fairExpectedCost;
      const excessPercent = fairExpectedCost > 0
        ? ((premium / fairExpectedCost) * 100)
        : clause.expectedCost > 0 ? 100 : 0;

      return {
        clauseNumber: clause.clauseNumber,
        clauseType: clause.clauseType,
        currentExpectedCost: clause.expectedCost,
        fairExpectedCost,
        predatoryPremium: premium,
        excessPercent,
        riskLevel: clause.riskLevel,
      };
    })
    .filter((c: FairComparisonClause) => c.predatoryPremium > 0)
    .sort((a: FairComparisonClause, b: FairComparisonClause) => b.predatoryPremium - a.predatoryPremium);

  const totalPredatoryPremium = currentP90 - fairP90;
  const excessPercent = fairP90 > 0 ? ((totalPredatoryPremium / fairP90) * 100) : 0;

  return {
    currentP90,
    fairP90,
    totalPredatoryPremium: Math.max(0, totalPredatoryPremium),
    excessPercent: Math.max(0, excessPercent),
    clauseBreakdown,
  };
}
