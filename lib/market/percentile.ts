// ============================================
// STATISTICAL FUNCTIONS — Pure TypeScript math
// Percentile, median, mean, stddev, distribution
// ============================================

import type { DistributionBucket, PercentilePosition, BenchmarkType } from '@/types/market';
import { BENCHMARK_TYPE_LABELS, UNIT_LABELS, HIGHER_IS_WORSE } from './constants';

/**
 * Compute percentile value from sorted array
 * Uses linear interpolation (same as Excel PERCENTILE.INC)
 */
export function computePercentile(sortedValues: number[], percentile: number): number {
  if (sortedValues.length === 0) return 0;
  if (sortedValues.length === 1) return sortedValues[0];

  const p = Math.max(0, Math.min(1, percentile / 100));
  const index = p * (sortedValues.length - 1);
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  const fraction = index - lower;

  if (lower === upper) return sortedValues[lower];
  return sortedValues[lower] + fraction * (sortedValues[upper] - sortedValues[lower]);
}

/**
 * Compute percentile rank of a value within a distribution
 * Returns 0–100: "What percentage of values are BELOW this value"
 */
export function computePercentileRank(sortedValues: number[], value: number): number {
  if (sortedValues.length === 0) return 50;
  if (sortedValues.length === 1) {
    return value >= sortedValues[0] ? 50 : 50;
  }

  let below = 0;
  let equal = 0;

  for (const v of sortedValues) {
    if (v < value) below++;
    else if (v === value) equal++;
  }

  // Percent rank formula: (B + 0.5 * E) / N * 100
  const rank = ((below + 0.5 * equal) / sortedValues.length) * 100;
  return Math.round(Math.max(0, Math.min(100, rank)));
}

/**
 * Compute percentile rank from precomputed benchmark statistics
 * Uses linear interpolation between known percentile points
 */
export function computePercentileRankFromBenchmark(
  value: number,
  p10: number | null,
  p25: number | null,
  median: number | null,
  p75: number | null,
  p90: number | null,
  min: number | null,
  max: number | null,
): number {
  // Build known points
  const points: { percentile: number; value: number }[] = [];
  if (min !== null) points.push({ percentile: 0, value: min });
  if (p10 !== null) points.push({ percentile: 10, value: p10 });
  if (p25 !== null) points.push({ percentile: 25, value: p25 });
  if (median !== null) points.push({ percentile: 50, value: median });
  if (p75 !== null) points.push({ percentile: 75, value: p75 });
  if (p90 !== null) points.push({ percentile: 90, value: p90 });
  if (max !== null) points.push({ percentile: 100, value: max });

  if (points.length === 0) return 50;
  if (points.length === 1) return 50;

  // Sort by value
  points.sort((a, b) => a.value - b.value);

  // If below min or above max
  if (value <= points[0].value) return points[0].percentile;
  if (value >= points[points.length - 1].value) return points[points.length - 1].percentile;

  // Linear interpolation between surrounding points
  for (let i = 0; i < points.length - 1; i++) {
    if (value >= points[i].value && value <= points[i + 1].value) {
      const range = points[i + 1].value - points[i].value;
      if (range === 0) return points[i].percentile;
      const fraction = (value - points[i].value) / range;
      return Math.round(
        points[i].percentile + fraction * (points[i + 1].percentile - points[i].percentile)
      );
    }
  }

  return 50;
}

/**
 * Compute median of an array
 */
export function computeMedian(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0
    ? sorted[mid]
    : (sorted[mid - 1] + sorted[mid]) / 2;
}

/**
 * Compute mean of an array
 */
export function computeMean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

/**
 * Compute standard deviation of an array (population)
 */
export function computeStdDev(values: number[]): number {
  if (values.length < 2) return 0;
  const mean = computeMean(values);
  const squaredDiffs = values.map((v) => (v - mean) ** 2);
  return Math.sqrt(squaredDiffs.reduce((sum, v) => sum + v, 0) / values.length);
}

/**
 * Generate distribution buckets for histogram rendering
 * Uses adaptive bucketing for skewed distributions
 */
export function generateDistributionBuckets(
  values: number[],
  bucketCount: number = 10
): DistributionBucket[] {
  if (values.length === 0) return [];

  const sorted = [...values].sort((a, b) => a - b);
  const min = sorted[0];
  const max = sorted[sorted.length - 1];

  if (min === max) {
    return [{ bucket_min: min, bucket_max: max, count: values.length, percentage: 100 }];
  }

  // Determine bucket boundaries
  const buckets: DistributionBucket[] = [];
  const range = max - min;
  const bucketWidth = range / bucketCount;

  for (let i = 0; i < bucketCount; i++) {
    const bucketMin = min + i * bucketWidth;
    const bucketMax = i === bucketCount - 1 ? max + 0.001 : min + (i + 1) * bucketWidth;

    const count = sorted.filter(
      (v) => v >= bucketMin && (i === bucketCount - 1 ? v <= max : v < bucketMax)
    ).length;

    buckets.push({
      bucket_min: Math.round(bucketMin * 100) / 100,
      bucket_max: Math.round((i === bucketCount - 1 ? max : bucketMax) * 100) / 100,
      count,
      percentage: Math.round((count / values.length) * 100),
    });
  }

  return buckets;
}

/**
 * Get position label from percentile rank
 */
export function getPositionLabel(percentileRank: number): PercentilePosition {
  if (percentileRank <= 10) return 'far_below';
  if (percentileRank <= 35) return 'below_average';
  if (percentileRank <= 65) return 'average';
  if (percentileRank <= 90) return 'above_average';
  return 'far_above';
}

/**
 * Get human-readable position description
 */
export function getPositionDescription(position: PercentilePosition, higherIsWorse: boolean): string {
  if (higherIsWorse) {
    switch (position) {
      case 'far_below': return 'Much lower than market — great for you';
      case 'below_average': return 'Below market average — favorable';
      case 'average': return 'Around market average';
      case 'above_average': return 'Above market average — unfavorable';
      case 'far_above': return 'Much higher than market — extremely unfavorable';
    }
  } else {
    switch (position) {
      case 'far_below': return 'Much lower than market — unfavorable';
      case 'below_average': return 'Below market average — slightly unfavorable';
      case 'average': return 'Around market average';
      case 'above_average': return 'Above market average — favorable';
      case 'far_above': return 'Much higher than market — great for you';
    }
  }
}

/**
 * Format comparison narrative
 */
export function formatComparisonNarrative(
  value: number,
  unit: string,
  percentileRank: number,
  benchmarkType: BenchmarkType,
  scopeLabel: string,
  median: number
): string {
  const higherIsWorse = HIGHER_IS_WORSE[benchmarkType] ?? true;
  const label = BENCHMARK_TYPE_LABELS[benchmarkType] || benchmarkType;
  const unitLabel = UNIT_LABELS[unit] || unit;

  const direction = percentileRank > 50 ? 'higher' : 'lower';
  const compPercent = percentileRank > 50 ? percentileRank : 100 - percentileRank;

  let quality = '';
  if (higherIsWorse) {
    quality = percentileRank > 65 ? '⚠️ ' : percentileRank < 35 ? '✅ ' : '';
  } else {
    quality = percentileRank < 35 ? '⚠️ ' : percentileRank > 65 ? '✅ ' : '';
  }

  return `${quality}Your ${label.toLowerCase()} (${value} ${unitLabel}) is ${direction} than ${compPercent}% of ${scopeLabel}. The median is ${median} ${unitLabel}.`;
}

// ============================================
// WELFORD'S ONLINE ALGORITHM
// For incremental mean/variance updates
// ============================================

export interface RunningStats {
  mean: number;
  variance: number;
  count: number;
  m2: number; // Sum of squared differences from mean
}

/**
 * Initialize running stats
 */
export function initRunningStats(): RunningStats {
  return { mean: 0, variance: 0, count: 0, m2: 0 };
}

/**
 * Update running stats with a new value (Welford's algorithm)
 */
export function updateRunningStats(stats: RunningStats, newValue: number): RunningStats {
  const count = stats.count + 1;
  const delta = newValue - stats.mean;
  const mean = stats.mean + delta / count;
  const delta2 = newValue - mean;
  const m2 = stats.m2 + delta * delta2;
  const variance = count > 1 ? m2 / (count - 1) : 0;

  return { mean, variance, count, m2 };
}

/**
 * Batch initialize Welford's from existing aggregate data
 */
export function initFromExisting(
  currentMean: number,
  currentVariance: number,
  currentCount: number
): RunningStats {
  return {
    mean: currentMean,
    variance: currentVariance,
    count: currentCount,
    m2: currentVariance * (currentCount > 1 ? currentCount - 1 : 0),
  };
}
