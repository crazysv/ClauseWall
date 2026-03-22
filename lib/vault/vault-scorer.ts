// ============================================
// VAULT SCORER — Risk Score & Summary Stats
// Pure TypeScript calculations
// ============================================

import type {
  CrossContractConflict,
  CoverageGap,
  CascadingFailure,
  FinancialExposure,
  VaultAnalysisResult,
  VaultSummaryStats,
} from "@/types";

/**
 * Calculate the overall vault risk score based on all analysis components.
 */
export function calculateVaultRiskScore(
  conflicts: CrossContractConflict[],
  gaps: CoverageGap[],
  cascades: CascadingFailure[],
  exposure: FinancialExposure,
  documentCount: number
): {
  score: number;
  summary: string;
  overall_risk: "low" | "medium" | "high" | "extreme";
} {
  let score = 0;

  // Conflict scoring
  const criticalConflicts = conflicts.filter((c) => c.severity === "critical").length;
  const highConflicts = conflicts.filter((c) => c.severity === "high").length;
  const mediumConflicts = conflicts.filter((c) => c.severity === "medium").length;

  score += criticalConflicts * 15;
  score += highConflicts * 8;
  score += mediumConflicts * 3;

  // Gap scoring
  const essentialGaps = gaps.filter((g) => g.importance === "essential").length;
  const recommendedGaps = gaps.filter((g) => g.importance === "recommended").length;

  score += essentialGaps * 10;
  score += recommendedGaps * 4;

  // Cascade scoring
  score += cascades.length * 12;

  // Financial exposure scoring
  if (exposure.total_worst_case > 500000) score += 10;
  if (exposure.total_worst_case > 2000000) score += 10;

  // Cap at 100
  score = Math.min(100, score);

  // Determine risk level
  let overall_risk: "low" | "medium" | "high" | "extreme";
  if (score <= 25) overall_risk = "low";
  else if (score <= 50) overall_risk = "medium";
  else if (score <= 75) overall_risk = "high";
  else overall_risk = "extreme";

  // Generate summary
  const summary = generateVaultSummary(conflicts, gaps, cascades, exposure);

  return { score, summary, overall_risk };
}

/**
 * Generate a human-readable vault analysis summary.
 */
export function generateVaultSummary(
  conflicts: CrossContractConflict[],
  gaps: CoverageGap[],
  cascades: CascadingFailure[],
  exposure: FinancialExposure
): string {
  const parts: string[] = [];

  // Conflicts
  if (conflicts.length > 0) {
    const critical = conflicts.filter((c) => c.severity === "critical").length;
    if (critical > 0) {
      parts.push(
        `${critical} critical conflict${critical > 1 ? "s" : ""} found`
      );
      // Mention the first critical conflict
      const firstCritical = conflicts.find((c) => c.severity === "critical");
      if (firstCritical) {
        parts.push(`including "${firstCritical.title}"`);
      }
    } else {
      parts.push(`${conflicts.length} cross-contract conflict${conflicts.length > 1 ? "s" : ""} found`);
    }
  } else {
    parts.push("No cross-contract conflicts detected");
  }

  // Financial exposure
  if (exposure.total_worst_case > 0) {
    parts.push(
      `Total worst-case financial exposure is ₹${formatIndianNumber(exposure.total_worst_case)}`
    );
  }

  // Cascades
  if (cascades.length > 0) {
    parts.push(
      `${cascades.length} cascading failure chain${cascades.length > 1 ? "s" : ""} identified`
    );
    const likelyCascades = cascades.filter((c) => c.probability === "likely");
    if (likelyCascades.length > 0) {
      parts.push(
        `${likelyCascades.length} ${likelyCascades.length > 1 ? "are" : "is"} likely to occur`
      );
    }
  }

  // Gaps
  const essentialGaps = gaps.filter((g) => g.importance === "essential").length;
  if (essentialGaps > 0) {
    parts.push(
      `${essentialGaps} essential coverage gap${essentialGaps > 1 ? "s" : ""} need attention`
    );
  }

  // Monthly obligations
  if (exposure.total_monthly_obligations > 0) {
    parts.push(
      `Monthly obligations total ₹${formatIndianNumber(exposure.total_monthly_obligations)}`
    );
  }

  return parts.join(". ") + ".";
}

/**
 * Compute all summary statistics from a vault analysis result.
 */
export function getVaultSummaryStats(
  analysis: VaultAnalysisResult
): VaultSummaryStats {
  // Find worst scenario
  let worstScenario = "None analyzed";
  let worstScenarioImpact = 0;

  if (analysis.what_if_results.length > 0) {
    const sorted = [...analysis.what_if_results].sort(
      (a, b) => b.total_financial_impact - a.total_financial_impact
    );
    worstScenario = sorted[0].scenario_title;
    worstScenarioImpact = sorted[0].total_financial_impact;
  }

  // Calculate risk level
  const { overall_risk } = calculateVaultRiskScore(
    analysis.conflicts,
    analysis.coverage_gaps,
    analysis.cascading_failures,
    analysis.financial_exposure,
    analysis.document_ids.length
  );

  // Total clauses from obligations (approximate since we don't store clause count directly)
  const totalClauses = analysis.unified_obligations.length;

  return {
    total_contracts: analysis.document_ids.length,
    total_clauses: totalClauses,
    total_conflicts: analysis.conflicts.length,
    critical_conflicts: analysis.conflicts.filter((c) => c.severity === "critical").length,
    coverage_gaps: analysis.coverage_gaps.length,
    essential_gaps: analysis.coverage_gaps.filter((g) => g.importance === "essential").length,
    total_financial_exposure: analysis.financial_exposure.total_worst_case,
    total_monthly_obligations: analysis.financial_exposure.total_monthly_obligations,
    cascading_failure_chains: analysis.cascading_failures.length,
    overall_vault_risk: overall_risk,
    worst_scenario: worstScenario,
    worst_scenario_impact: worstScenarioImpact,
  };
}

/**
 * Format a number in Indian comma notation (e.g., 12,47,000).
 */
function formatIndianNumber(num: number): string {
  const str = Math.round(num).toString();
  if (str.length <= 3) return str;

  let result = str.slice(-3); // Last 3 digits
  let remaining = str.slice(0, -3);

  while (remaining.length > 0) {
    const chunk = remaining.slice(-2);
    result = chunk + "," + result;
    remaining = remaining.slice(0, -2);
  }

  return result;
}
