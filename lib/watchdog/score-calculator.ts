// ============================================
// TOS SCORE CALCULATOR
// Fairness score (0-100) for each company
// ============================================

import type { TosScoreBreakdown, ScoreTrend } from "@/types";
import type { ScoreInput } from "./types";

/**
 * Calculate ToS fairness score
 */
export function calculateTosScore(input: ScoreInput): {
  score: number;
  breakdown: TosScoreBreakdown;
  trend: ScoreTrend;
} {
  let score = 50; // Base score

  // ─── Deductions ───
  // Per critical pro_company change in last 12 months
  const criticalProCompany = input.current_changes.filter(
    (c) => c.severity === "critical" && c.direction === "pro_company"
  ).length;
  score -= criticalProCompany * 5;

  // Per major pro_company change
  const majorProCompany = input.current_changes.filter(
    (c) => c.severity === "major" && c.direction === "pro_company"
  ).length;
  score -= majorProCompany * 3;

  // Specific clause deductions
  if (input.has_mandatory_arbitration) score -= 10;
  if (input.has_data_sharing_without_consent) score -= 8;
  if (input.has_unilateral_modification) score -= 5;
  if (input.has_no_refund) score -= 4;
  if (input.has_excessive_liability_limit) score -= 4;
  if (input.has_auto_renewal_no_notice) score -= 3;

  // High change frequency
  if (input.total_changes_12mo > 6) score -= 2;

  // Poor readability
  if (input.readability_score > 16) score -= 2;

  // ─── Additions ───
  // Per pro_consumer change
  const proConsumerChanges = input.current_changes.filter(
    (c) => c.direction === "pro_consumer"
  ).length;
  score += proConsumerChanges * 4;

  // Positive clause additions
  if (input.has_clear_cancellation) score += 5;
  if (input.has_data_deletion_rights) score += 5;
  if (input.has_grievance_mechanism) score += 5;
  if (input.has_consumer_court_preserved) score += 5;
  if (input.has_advance_notice_changes) score += 4;
  if (input.has_no_dark_patterns) score += 3;

  // Good readability
  if (input.readability_score < 10) score += 3;

  // Clamp
  score = Math.max(0, Math.min(100, score));

  // Calculate breakdown
  const breakdown = calculateBreakdown(input, score);

  // Calculate trend
  const trend = calculateTrend(input);

  return { score, breakdown, trend };
}

/**
 * Calculate score breakdown for radar chart
 */
function calculateBreakdown(input: ScoreInput, overallScore: number): TosScoreBreakdown {
  // Consumer rights (0-100)
  let consumerRights = 50;
  if (input.has_consumer_court_preserved) consumerRights += 25;
  if (input.has_clear_cancellation) consumerRights += 15;
  if (input.has_mandatory_arbitration) consumerRights -= 30;
  consumerRights = clamp(consumerRights);

  // Data privacy (0-100)
  let dataPrivacy = 50;
  if (input.has_data_deletion_rights) dataPrivacy += 25;
  if (input.has_data_sharing_without_consent) dataPrivacy -= 30;
  dataPrivacy = clamp(dataPrivacy);

  // Dispute resolution (0-100)
  let disputeResolution = 60;
  if (input.has_mandatory_arbitration) disputeResolution -= 35;
  if (input.has_grievance_mechanism) disputeResolution += 20;
  if (input.has_consumer_court_preserved) disputeResolution += 15;
  disputeResolution = clamp(disputeResolution);

  // Transparency (0-100)
  let transparency = 50;
  if (input.readability_score < 10) transparency += 25;
  if (input.readability_score > 16) transparency -= 20;
  if (input.has_advance_notice_changes) transparency += 20;
  transparency = clamp(transparency);

  // Change frequency (0-100) — lower changes = better score
  let changeFrequency = 80;
  changeFrequency -= Math.min(60, input.total_changes_12mo * 8);
  changeFrequency = clamp(changeFrequency);

  // Fairness (0-100)
  let fairness = overallScore; // Use overall as proxy
  if (input.has_no_dark_patterns) fairness += 10;
  if (input.has_unilateral_modification) fairness -= 15;
  if (input.has_no_refund) fairness -= 10;
  fairness = clamp(fairness);

  return {
    consumer_rights: consumerRights,
    data_privacy: dataPrivacy,
    dispute_resolution: disputeResolution,
    transparency,
    change_frequency: changeFrequency,
    fairness,
  };
}

/**
 * Calculate if score is trending up, down, or stable
 */
function calculateTrend(input: ScoreInput): ScoreTrend {
  if (input.pro_consumer_12mo > input.pro_company_12mo) return "improving";
  if (input.pro_company_12mo > input.pro_consumer_12mo) return "declining";
  return "stable";
}

function clamp(val: number): number {
  return Math.max(0, Math.min(100, Math.round(val)));
}

/**
 * Get score color class
 */
export function getScoreColor(score: number): string {
  if (score >= 71) return "text-green-400";
  if (score >= 51) return "text-blue-400";
  if (score >= 31) return "text-amber-400";
  return "text-red-400";
}

/**
 * Get score label
 */
export function getScoreLabel(score: number): string {
  if (score >= 71) return "Good";
  if (score >= 51) return "Fair";
  if (score >= 31) return "Poor";
  return "Bad";
}
