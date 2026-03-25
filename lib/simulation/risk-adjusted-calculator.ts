// ============================================
// RISK-ADJUSTED MONTHLY COST CALCULATOR
// The "Hero Metric" — what the contract ACTUALLY costs
// ============================================

import type { RiskAdjustedCost } from "./types";

/**
 * Calculate the risk-adjusted monthly cost of a contract.
 *
 * Formula:
 *   adjustedMonthlyCost = baseMonthlyCost + (expectedTotalLoss / contractMonths)
 *
 * This is the "aha moment" metric — shows users the true cost
 * when accounting for predatory clause risk.
 */
export function calculateRiskAdjustedCost(
  baseMonthlyCost: number,
  expectedLoss: number, // mean from Monte Carlo results
  contractMonths: number
): RiskAdjustedCost {
  const safeMonths = Math.max(contractMonths, 1);
  const monthlyRiskPremium = expectedLoss / safeMonths;
  const adjustedMonthlyCost = baseMonthlyCost + monthlyRiskPremium;
  const premiumPercent =
    baseMonthlyCost > 0
      ? (monthlyRiskPremium / baseMonthlyCost) * 100
      : 0;

  return {
    baseMonthlyCost,
    monthlyRiskPremium,
    adjustedMonthlyCost,
    premiumPercent,
    annualExtraCost: monthlyRiskPremium * 12,
    lifetimeExtraCost: expectedLoss,
  };
}
