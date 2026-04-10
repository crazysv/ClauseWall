// ============================================
// RISK SCORING ENGINE
// Calculates weighted risk scores for documents
// ============================================

import type { Clause, RiskLevel } from "@/types";
import { RISK_WEIGHTS } from "@/types";

/**
 * Calculate weighted overall risk score for a document
 * Weights: illegal=3x, dangerous=2x, warning=1.5x, safe=1x
 */
export function calculateWeightedScore(
  clauses: Pick<Clause, "risk_level" | "risk_score">[]
): number {
  if (clauses.length === 0) return 0;

  let weightedSum = 0;
  let totalWeight = 0;

  for (const clause of clauses) {
    const weight = RISK_WEIGHTS[clause.risk_level] || 1;
    weightedSum += clause.risk_score * weight;
    totalWeight += weight;
  }

  return Math.round(weightedSum / totalWeight);
}

/**
 * Generate a human-readable summary of the analysis
 */
export function generateSummary(
  totalClauses: number,
  safe: number,
  warning: number,
  dangerous: number,
  illegal: number,
  overallScore: number
): string {
  const parts: string[] = [];

  parts.push(
    `Analyzed ${totalClauses} clause${totalClauses !== 1 ? "s" : ""}.`
  );

  if (illegal > 0) {
    parts.push(
      `⛔ Found ${illegal} potentially illegal clause${
        illegal !== 1 ? "s" : ""
      } that may violate Indian law.`
    );
  }

  if (dangerous > 0) {
    parts.push(
      `🔴 Found ${dangerous} dangerous clause${
        dangerous !== 1 ? "s" : ""
      } that are significantly one-sided or exploitative.`
    );
  }

  if (warning > 0) {
    parts.push(
      `⚠️ Found ${warning} clause${
        warning !== 1 ? "s" : ""
      } with minor concerns worth reviewing.`
    );
  }

  if (safe === totalClauses) {
    parts.push(
      "✅ All clauses appear fair and standard. This looks like a reasonable agreement."
    );
  }

  if (overallScore >= 80) {
    parts.push(
      "⚠️ This contract has serious legal issues. We strongly recommend NOT signing without significant amendments. Consider sending a legal notice."
    );
  } else if (overallScore >= 50) {
    parts.push(
      "This contract has notable concerns. Consider negotiating the flagged clauses before signing."
    );
  } else if (overallScore >= 20) {
    parts.push(
      "This contract is mostly fair with a few areas to watch. Review the flagged clauses."
    );
  }

  return parts.join(" ");
}

/**
 * Get risk level counts from clauses
 */
export function getRiskCounts(
  clauses: Pick<Clause, "risk_level">[]
): Record<RiskLevel, number> {
  const counts: Record<RiskLevel, number> = {
    safe: 0,
    warning: 0,
    dangerous: 0,
    illegal: 0,
  };

  for (const clause of clauses) {
    counts[clause.risk_level]++;
  }

  return counts;
}