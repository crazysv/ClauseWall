// ============================================
// LEVERAGE CALCULATOR — Individual vs Collective Cost-Benefit
// Pure TypeScript math, no external dependencies
// ============================================

import type { LeverageCalculation } from "@/types";

// Base legal costs by entity type (in INR)
const BASE_LEGAL_COSTS: Record<string, number> = {
  landlord: 15000,
  employer: 25000,
  company: 35000,
  bank: 30000,
  telecom: 10000,
  insurance: 20000,
  other: 20000,
};

// Base recovery potential by entity type (in INR)
const BASE_RECOVERY: Record<string, number> = {
  landlord: 50000,
  employer: 100000,
  company: 75000,
  bank: 50000,
  telecom: 15000,
  insurance: 100000,
  other: 40000,
};

// Time estimates in months
const BASE_TIME: Record<string, number> = {
  landlord: 6,
  employer: 8,
  company: 12,
  bank: 10,
  telecom: 4,
  insurance: 8,
  other: 8,
};

/**
 * Calculate leverage comparison between individual and collective action
 */
export function calculateLeverage(
  entityType: string,
  memberCount: number,
  avgRiskScore: number,
  financialExposure: number
): LeverageCalculation {
  const type = entityType.toLowerCase();
  const baseCost = BASE_LEGAL_COSTS[type] || 20000;
  const baseRecovery = BASE_RECOVERY[type] || 40000;
  const baseTime = BASE_TIME[type] || 8;

  // Risk score amplifies recovery potential (higher risk = stronger legal position)
  const riskMultiplier = Math.max(0.5, avgRiskScore / 50);
  const actualExposure = financialExposure || baseRecovery;

  // ── Individual calculation ──
  const individualLegalFees = baseCost;
  const individualRecovery = actualExposure * riskMultiplier * 0.6; // Lower success recovery
  const individualTime = baseTime;
  const individualSuccessProb = Math.min(0.65, 0.3 + (avgRiskScore / 200));
  const individualCBR = individualRecovery > 0
    ? (individualRecovery * individualSuccessProb) / individualLegalFees
    : 0;

  const individualVerdict: "worth_it" | "risky" | "not_worth_it" =
    individualCBR > 2 ? "worth_it" : individualCBR > 1 ? "risky" : "not_worth_it";

  // ── Collective calculation ──
  const effectiveMembers = Math.max(2, memberCount);

  // Costs are shared, with economy of scale
  const totalCollectiveFees = baseCost * 1.5; // Slightly higher total for coordinated effort
  const perPersonFees = Math.round(totalCollectiveFees / effectiveMembers);

  // Recovery increases with more members (stronger negotiating position)
  const collectiveMultiplier = 1 + Math.log2(effectiveMembers) * 0.3;
  const totalCollectiveRecovery = actualExposure * effectiveMembers * riskMultiplier * 0.85;
  const perPersonRecovery = Math.round(totalCollectiveRecovery / effectiveMembers);

  // Time decreases with collective pressure
  const collectiveTime = Math.max(2, Math.round(baseTime * 0.6));

  // Success probability increases significantly with collective
  const collectiveSuccessProb = Math.min(
    0.92,
    individualSuccessProb + (0.1 * Math.log2(effectiveMembers))
  );

  const collectiveCBR = perPersonRecovery > 0
    ? (perPersonRecovery * collectiveSuccessProb) / Math.max(perPersonFees, 1)
    : 0;

  const collectiveVerdict: "highly_recommended" | "recommended" | "worth_considering" =
    collectiveCBR > 5 ? "highly_recommended" : collectiveCBR > 2 ? "recommended" : "worth_considering";

  const multiplier = individualCBR > 0
    ? Math.round((collectiveCBR / individualCBR) * 10) / 10
    : effectiveMembers;

  // ── Summary ──
  const savings = individualLegalFees - perPersonFees;
  const probIncrease = Math.round((collectiveSuccessProb - individualSuccessProb) * 100);

  const comparisonSummary =
    `By joining forces with ${effectiveMembers - 1} other affected ${
      effectiveMembers > 2 ? "people" : "person"
    }, your legal costs drop from ₹${individualLegalFees.toLocaleString("en-IN")} to ₹${perPersonFees.toLocaleString("en-IN")} (saving ₹${savings.toLocaleString("en-IN")}), ` +
    `your success probability increases by ${probIncrease}%, and the timeline shrinks from ${individualTime} months to ${collectiveTime} months. ` +
    `The cost-benefit ratio improves by ${multiplier}x.`;

  return {
    individual: {
      legal_fees_estimate: individualLegalFees,
      recovery_potential: Math.round(individualRecovery),
      time_estimate_months: individualTime,
      success_probability: Math.round(individualSuccessProb * 100) / 100,
      cost_benefit_ratio: Math.round(individualCBR * 100) / 100,
      verdict: individualVerdict,
    },
    collective: {
      total_legal_fees: Math.round(totalCollectiveFees),
      per_person_fees: perPersonFees,
      total_recovery_potential: Math.round(totalCollectiveRecovery),
      per_person_recovery: perPersonRecovery,
      time_estimate_months: collectiveTime,
      success_probability: Math.round(collectiveSuccessProb * 100) / 100,
      cost_benefit_ratio: Math.round(collectiveCBR * 100) / 100,
      verdict: collectiveVerdict,
      multiplier,
    },
    comparison_summary: comparisonSummary,
  };
}
