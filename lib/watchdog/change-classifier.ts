// ============================================
// CHANGE CLASSIFIER
// Counts and aggregates change classifications
// ============================================

import type { SemanticChange, OverallDirection } from "@/types";

/**
 * Classify and aggregate an array of semantic changes
 */
export function classifyChanges(changes: SemanticChange[]): {
  total_changes: number;
  critical_count: number;
  major_count: number;
  minor_count: number;
  cosmetic_count: number;
  pro_company_count: number;
  pro_consumer_count: number;
  neutral_count: number;
  overall_direction: OverallDirection;
} {
  let critical = 0, major = 0, minor = 0, cosmetic = 0;
  let proCompany = 0, proConsumer = 0, neutral = 0;

  for (const change of changes) {
    switch (change.severity) {
      case "critical": critical++; break;
      case "major": major++; break;
      case "minor": minor++; break;
      case "cosmetic": cosmetic++; break;
    }

    switch (change.direction) {
      case "pro_company": proCompany++; break;
      case "pro_consumer": proConsumer++; break;
      case "neutral": neutral++; break;
    }
  }

  // Determine overall direction
  let overall: OverallDirection;
  if (proCompany > 0 && proConsumer > 0) {
    overall = "mixed";
  } else if (proCompany > proConsumer) {
    overall = "pro_company";
  } else if (proConsumer > proCompany) {
    overall = "pro_consumer";
  } else {
    overall = "neutral";
  }

  return {
    total_changes: changes.length,
    critical_count: critical,
    major_count: major,
    minor_count: minor,
    cosmetic_count: cosmetic,
    pro_company_count: proCompany,
    pro_consumer_count: proConsumer,
    neutral_count: neutral,
    overall_direction: overall,
  };
}

/**
 * Check if changes should trigger alerts based on sensitivity
 */
export function shouldAlert(
  changes: SemanticChange[],
  sensitivity: string
): boolean {
  switch (sensitivity) {
    case "critical_only":
      return changes.some((c) => c.severity === "critical");
    case "major_and_critical":
      return changes.some((c) => c.severity === "critical" || c.severity === "major");
    case "all_changes":
      return changes.length > 0;
    default:
      return changes.some((c) => c.severity === "critical" || c.severity === "major");
  }
}

/**
 * Get the highest severity in a set of changes
 */
export function getHighestSeverity(changes: SemanticChange[]): string {
  const priority = ["critical", "major", "minor", "cosmetic"];
  for (const sev of priority) {
    if (changes.some((c) => c.severity === sev)) return sev;
  }
  return "cosmetic";
}

/**
 * Filter changes that may need legality checks
 */
export function getChangesNeedingLegalityCheck(changes: SemanticChange[]): SemanticChange[] {
  const legallyRelevantTypes = [
    "rights_lost", "obligation_added", "liability_changed",
    "dispute_resolution_changed", "data_usage_changed",
  ];

  return changes.filter(
    (c) =>
      (c.severity === "critical" || c.severity === "major") &&
      legallyRelevantTypes.includes(c.change_type)
  );
}
