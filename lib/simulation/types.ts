// ============================================
// FINANCIAL RUIN CALCULATOR — TYPE DEFINITIONS
// Monte Carlo Contract Risk Simulation Engine
// ============================================

import type { Clause, StructuredRule } from "@/types";

// ============================================
// LIFE EVENT TYPES
// ============================================

export type LifeEventType =
  | "jobLoss"
  | "medicalEmergency"
  | "marketDownturn"
  | "landlordDispute"
  | "relocation"
  | "relationshipChange"
  | "propertyDefect";

export interface LifeEvent {
  type: LifeEventType;
  month: number;
  probability: number;
}

// ============================================
// SIMULATION CONFIG
// ============================================

export interface SimulationConfig {
  iterations: number;
  months: number;
  baseMonthlyCost: number;
  monthlyIncome: number;
  eventProbabilities: Record<LifeEventType, number>;
  correlations: CorrelationMatrix;
  documentType: string;
  jurisdiction: string;
}

export interface CorrelationMatrix {
  /** event A → { event B: increase multiplier } */
  [sourceEvent: string]: Record<string, number>;
}

// ============================================
// CLAUSE COST MAPPING
// ============================================

export interface ClauseCostMapping {
  clause: Clause;
  clauseType: string;
  triggerEvents: LifeEventType[];
  costFunction: (
    event: LifeEvent,
    month: number,
    totalMonths: number,
    baseMonthlyCost: number,
    monthlyIncome: number
  ) => number;
  fairCostFunction: (
    event: LifeEvent,
    month: number,
    totalMonths: number,
    baseMonthlyCost: number,
    monthlyIncome: number
  ) => number;
  extractedValue: number | null;
  extractedUnit: string | null;
  fairValue: number | null;
  fairUnit: string | null;
}

// ============================================
// SIMULATION RESULTS
// ============================================

export interface PercentileData {
  p50: number;
  p75: number;
  p90: number;
  p95: number;
  p99: number;
  min: number;
  max: number;
}

export interface SimulationStatistics {
  mean: number;
  median: number;
  stdDev: number;
  min: number;
  max: number;
  total: number;
  zeroLossCount: number;
  zeroLossPercent: number;
}

export interface HistogramBin {
  lower: number;
  upper: number;
  count: number;
  percentage: number;
}

export interface ClauseRiskRanking {
  clauseId: string;
  clauseNumber: number;
  clauseType: string;
  expectedCost: number;
  worstCaseCost: number;
  triggerProbability: number;
  riskLevel: string;
  originalText: string;
}

export interface SimulationResult {
  iterations: number[];
  percentiles: PercentileData;
  statistics: SimulationStatistics;
  histogram: HistogramBin[];
  topRiskClauses: ClauseRiskRanking[];
  fairIterations: number[];
  fairPercentiles: PercentileData;
  fairStatistics: SimulationStatistics;
}

// ============================================
// STRESS TEST TYPES
// ============================================

export interface StressScenarioEvent {
  type: LifeEventType;
  month: number;
}

export interface StressScenario {
  id: string;
  label: string;
  description: string;
  icon: string;
  events: StressScenarioEvent[];
  cascadeDescription: string;
}

export interface StressTestClauseResult {
  clauseNumber: number;
  clauseType: string;
  triggerEvent: LifeEventType;
  currentCost: number;
  fairCost: number;
  predatoryPremium: number;
  originalText: string;
}

export interface StressTestResult {
  scenario: StressScenario;
  triggeredClauses: StressTestClauseResult[];
  totalCurrentCost: number;
  totalFairCost: number;
  totalPredatoryPremium: number;
}

// ============================================
// FAIR COMPARISON TYPES
// ============================================

export interface FairComparisonClause {
  clauseNumber: number;
  clauseType: string;
  currentExpectedCost: number;
  fairExpectedCost: number;
  predatoryPremium: number;
  excessPercent: number;
  riskLevel: string;
}

export interface FairComparisonResult {
  currentP90: number;
  fairP90: number;
  totalPredatoryPremium: number;
  excessPercent: number;
  clauseBreakdown: FairComparisonClause[];
}

// ============================================
// INSURANCE GAP TYPES
// ============================================

export interface InsuranceGapResult {
  totalExposure: number;
  userCoverage: number;
  gap: number;
  gapPercent: number;
  coveragePercent: number;
  recommendations: InsuranceRecommendation[];
}

export interface InsuranceRecommendation {
  product: string;
  annualCost: string;
  coverageAmount: string;
  relevance: string;
}

// ============================================
// RISK-ADJUSTED COST TYPES
// ============================================

export interface RiskAdjustedCost {
  baseMonthlyCost: number;
  monthlyRiskPremium: number;
  adjustedMonthlyCost: number;
  premiumPercent: number;
  annualExtraCost: number;
  lifetimeExtraCost: number;
}

// ============================================
// COMPLETE ANALYSIS TYPE
// ============================================

export interface FinancialRuinAnalysis {
  documentId: string;
  documentName: string;
  documentType: string;
  jurisdiction: string;
  config: SimulationConfig;
  simulation: SimulationResult;
  riskAdjusted: RiskAdjustedCost;
  fairComparison: FairComparisonResult;
  insuranceGap: InsuranceGapResult;
  stressTests: StressTestResult[];
  generatedAt: string;
}

// ============================================
// API REQUEST/RESPONSE TYPES
// ============================================

export interface RuinCalculatorRequest {
  documentId: string;
  baseMonthlyCost?: number;
  monthlyIncome?: number;
  iterations?: number;
  months?: number;
  insuranceCoverage?: number;
}

export interface StressTestRequest {
  documentId: string;
  scenarioId?: string;
  customEvents?: StressScenarioEvent[];
  baseMonthlyCost?: number;
  monthlyIncome?: number;
}
