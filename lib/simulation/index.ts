// ============================================
// SIMULATION ENGINE — PUBLIC API
// Re-exports for clean imports
// ============================================

// Types
export type {
  LifeEventType,
  LifeEvent,
  SimulationConfig,
  CorrelationMatrix,
  ClauseCostMapping,
  PercentileData,
  SimulationStatistics,
  HistogramBin,
  ClauseRiskRanking,
  SimulationResult,
  StressScenarioEvent,
  StressScenario,
  StressTestClauseResult,
  StressTestResult,
  FairComparisonClause,
  FairComparisonResult,
  InsuranceGapResult,
  InsuranceRecommendation,
  RiskAdjustedCost,
  FinancialRuinAnalysis,
  RuinCalculatorRequest,
  StressTestRequest,
} from "./types";

// Engines
export { runMonteCarloSimulation } from "./monte-carlo-engine";
export {
  runStressTest,
  buildCustomScenario,
  PRESET_SCENARIOS,
  LIFE_EVENT_LABELS,
} from "./stress-test-engine";
export { buildFairComparison } from "./fair-comparison-engine";
export { analyzeInsuranceGap } from "./insurance-gap-analyzer";
export { calculateRiskAdjustedCost } from "./risk-adjusted-calculator";

// Probability
export {
  DEFAULT_EVENT_PROBABILITIES,
  DEFAULT_CORRELATIONS,
  buildDefaultConfig,
} from "./probability-engine";

// Formatters
export {
  formatINR,
  formatINRCompact,
  getPercentileLabel,
  getPercentileColor,
  formatPercent,
  getHistogramBarColor,
} from "./formatters";
