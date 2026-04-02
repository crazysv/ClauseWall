// ============================================
// ML CLAUSE CLASSIFIER
// Runs TF.js model in browser for instant classification
// ============================================

import { textToTfidfVector } from "./preprocessor";
import {
  getModel,
  getTf,
  getVocabulary,
  getIdfWeights,
  getLabelMap,
  getFeatureCount,
  getModelConfig,
  getModelStatus,
  loadModel,
  warmUpModel,
} from "./model-loader";
import { splitIntoClauses } from "./clause-splitter";
import type { MLClauseResult, MLScanResult } from "./types";
import type { RiskLevel } from "@/types";

const CONFIDENCE_THRESHOLD = 0.65;

/**
 * Classify a single clause using the ML model
 */
async function classifySingleClause(
  clauseText: string
): Promise<MLClauseResult | null> {
  const model = getModel();
  const tf = getTf();
  const vocabulary = getVocabulary();
  const idfWeights = getIdfWeights();
  const labelMap = getLabelMap();

  if (!model || !tf || !vocabulary || !idfWeights || !labelMap) {
    return null;
  }

  const numFeatures = getFeatureCount();
  const startTime = performance.now();

  try {
    // Preprocess: text → TF-IDF vector
    const tfidfVector = textToTfidfVector(
      clauseText,
      vocabulary,
      idfWeights,
      numFeatures
    );

    // Create tensor
    const inputTensor = tf.tensor2d([Array.from(tfidfVector)], [1, numFeatures]);

    // Run inference
    const prediction = model.predict(inputTensor) as ReturnType<typeof tf.tensor>;
    const probabilities = (await prediction.data()) as Float32Array;

    // Clean up tensors
    inputTensor.dispose();
    prediction.dispose();

    const inferenceTime = performance.now() - startTime;

    // Parse results
    const scores: Record<RiskLevel, number> = {
      safe: probabilities[0],
      warning: probabilities[1],
      dangerous: probabilities[2],
      illegal: probabilities[3],
    };

    // Find highest probability class
    let maxProb = 0;
    let maxIndex = 0;
    for (let i = 0; i < probabilities.length; i++) {
      if (probabilities[i] > maxProb) {
        maxProb = probabilities[i];
        maxIndex = i;
      }
    }

    const riskLevel = (labelMap[String(maxIndex)] || "warning") as RiskLevel;

    // Truncate text for display
    const truncatedText =
      clauseText.length > 120
        ? clauseText.substring(0, 120) + "..."
        : clauseText;

    return {
      text: clauseText,
      truncatedText,
      riskLevel,
      confidence: maxProb,
      scores,
      inferenceTimeMs: inferenceTime,
    };
  } catch (error) {
    console.error("[ClauseWall ML] Classification failed:", error);
    return null;
  }
}

/**
 * Calculate overall risk score from clause scores
 * Uses weighted probabilities for continuous scoring
 */
function calculateOverallScore(results: MLClauseResult[]): number {
  if (results.length === 0) return 0;

  let weightedSum = 0;
  let totalWeight = 0;

  for (const result of results) {
    // Weighted score from probabilities
    const clauseScore =
      result.scores.safe * 10 +
      result.scores.warning * 40 +
      result.scores.dangerous * 70 +
      result.scores.illegal * 95;

    // Weight by confidence
    const weight = result.confidence;
    weightedSum += clauseScore * weight;
    totalWeight += weight;
  }

  return Math.round(totalWeight > 0 ? weightedSum / totalWeight : 50);
}

/**
 * Determine overall risk level from score
 */
function scoreToRiskLevel(score: number): RiskLevel {
  if (score >= 75) return "illegal";
  if (score >= 50) return "dangerous";
  if (score >= 25) return "warning";
  return "safe";
}

/**
 * MAIN FUNCTION: Classify all clauses in a document
 *
 * 1. Splits text into clauses (regex, no AI)
 * 2. Classifies each clause via ML model
 * 3. Calculates overall risk score
 * 4. Returns complete scan result
 *
 * Runs entirely in the browser. No API calls. No data leaves device.
 */
export async function classifyDocument(
  documentText: string
): Promise<MLScanResult | null> {
  const totalStart = performance.now();

  // Ensure model is loaded
  if (getModelStatus() !== "ready") {
    const loaded = await loadModel();
    if (!loaded) {
      console.warn("[ClauseWall ML] Model not available, skipping ML scan");
      return null;
    }
    await warmUpModel();
  }

  const config = getModelConfig();
  if (!config) return null;

  // Step 1: Split into clauses (regex, instant)
  const splitClauses = splitIntoClauses(documentText);

  if (splitClauses.length === 0) {
    console.warn("[ClauseWall ML] No clauses extracted from text");
    return null;
  }

  // Step 2: Classify each clause
  const clauseResults: MLClauseResult[] = [];

  for (const clause of splitClauses) {
    const result = await classifySingleClause(clause.text);
    if (result) {
      clauseResults.push(result);
    }
  }

  if (clauseResults.length === 0) {
    return null;
  }

  // Step 3: Calculate breakdown
  const riskBreakdown: Record<RiskLevel, number> = {
    safe: 0,
    warning: 0,
    dangerous: 0,
    illegal: 0,
  };

  let highConfidenceCount = 0;
  let lowConfidenceCount = 0;

  for (const result of clauseResults) {
    riskBreakdown[result.riskLevel]++;
    if (result.confidence >= CONFIDENCE_THRESHOLD) {
      highConfidenceCount++;
    } else {
      lowConfidenceCount++;
    }
  }

  // Step 4: Overall score
  const overallScore = calculateOverallScore(clauseResults);
  const overallRisk = scoreToRiskLevel(overallScore);

  // Average confidence
  const avgConfidence =
    clauseResults.reduce((sum, r) => sum + r.confidence, 0) /
    clauseResults.length;

  const totalTime = performance.now() - totalStart;


  return {
    overallRisk,
    overallScore,
    overallConfidence: avgConfidence,
    totalClauses: clauseResults.length,
    riskBreakdown,
    clauseResults,
    inferenceTimeMs: totalTime,
    modelVersion: config.model_version,
    featureCount: config.max_features,
    highConfidenceCount,
    lowConfidenceCount,
  };
}