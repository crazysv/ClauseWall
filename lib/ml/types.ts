// ============================================
// ML CLASSIFIER TYPES
// On-device clause classification
// ============================================

import type { RiskLevel } from "@/types";

/**
 * Single clause classification result from ML model
 */
export interface MLClauseResult {
  text: string;
  truncatedText: string;
  riskLevel: RiskLevel;
  confidence: number;
  scores: Record<RiskLevel, number>;
  inferenceTimeMs: number;
}

/**
 * Overall ML scan result for a document
 */
export interface MLScanResult {
  overallRisk: RiskLevel;
  overallScore: number;
  overallConfidence: number;
  totalClauses: number;
  riskBreakdown: Record<RiskLevel, number>;
  clauseResults: MLClauseResult[];
  inferenceTimeMs: number;
  modelVersion: string;
  featureCount: number;
  highConfidenceCount: number;
  lowConfidenceCount: number;
}

/**
 * Model loading status
 */
export type ModelStatus = "idle" | "loading" | "ready" | "error";

/**
 * Model metadata from config.json
 */
export interface ModelConfig {
  max_features: number;
  ngram_range: [number, number];
  model_version: string;
  training_samples: number;
  real_samples: number;
  synthetic_samples: number;
  test_accuracy: number;
  classes: string[];
  confidence_threshold: number;
  clean_regex: string;
}