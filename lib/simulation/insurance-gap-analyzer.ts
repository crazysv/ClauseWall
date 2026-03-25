// ============================================
// INSURANCE GAP ANALYZER
// Exposure vs coverage calculation
// ============================================

import type { InsuranceGapResult, InsuranceRecommendation, PercentileData } from "./types";

/**
 * Calculate insurance gap between total contract exposure and user's coverage.
 */
export function analyzeInsuranceGap(
  percentiles: PercentileData,
  userCoverage: number
): InsuranceGapResult {
  // Use P95 as total exposure (reasonable worst case)
  const totalExposure = percentiles.p95;
  const coverage = Math.max(0, userCoverage);
  const gap = Math.max(0, totalExposure - coverage);
  const gapPercent = totalExposure > 0 ? (gap / totalExposure) * 100 : 0;
  const coveragePercent = totalExposure > 0 ? Math.min(100, (coverage / totalExposure) * 100) : 0;

  const recommendations = getRecommendations(gap, totalExposure);

  return {
    totalExposure,
    userCoverage: coverage,
    gap,
    gapPercent,
    coveragePercent,
    recommendations,
  };
}

/**
 * Generate insurance product recommendations for India based on gap.
 */
function getRecommendations(
  gap: number,
  totalExposure: number
): InsuranceRecommendation[] {
  const recommendations: InsuranceRecommendation[] = [];

  if (gap <= 0) return recommendations;

  if (totalExposure > 100000) {
    recommendations.push({
      product: "Renter's Insurance",
      annualCost: "~₹2,000/year",
      coverageAmount: "Up to ₹10,00,000",
      relevance: "Covers property damage, theft, and legal liability",
    });
  }

  if (totalExposure > 200000) {
    recommendations.push({
      product: "Personal Accident Insurance",
      annualCost: "~₹3,000/year",
      coverageAmount: "Up to ₹25,00,000",
      relevance: "Income protection during medical emergencies",
    });
  }

  if (totalExposure > 300000) {
    recommendations.push({
      product: "Legal Expense Cover",
      annualCost: "~₹5,000/year",
      coverageAmount: "Up to ₹5,00,000",
      relevance: "Covers legal fees for landlord/employer disputes",
    });
  }

  if (totalExposure > 500000) {
    recommendations.push({
      product: "Critical Illness Insurance",
      annualCost: "~₹8,000/year",
      coverageAmount: "Up to ₹10,00,000",
      relevance: "Lump sum payout during major medical events",
    });
  }

  if (totalExposure > 1000000) {
    recommendations.push({
      product: "Income Protection Plan",
      annualCost: "~₹12,000/year",
      coverageAmount: "60% of income for 2 years",
      relevance: "Replaces income during job loss or disability",
    });
  }

  return recommendations;
}
