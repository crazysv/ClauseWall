// ============================================
// LEGALITY CHECKER
// Check ToS changes against Indian law
// ============================================

import { callGroq } from "@/lib/ai/groq-client";
import { CHANGE_LEGALITY_PROMPT } from "./prompts";
import type { SemanticChange, WatchdogLegalityIssue } from "@/types";

/**
 * Check a set of changes for legality issues
 */
export async function checkChangeLegality(
  changes: SemanticChange[],
  companyName: string
): Promise<WatchdogLegalityIssue[]> {
  const issues: WatchdogLegalityIssue[] = [];

  // Only check critical/major changes that affect rights
  const relevantChanges = changes.filter(
    (c) =>
      (c.severity === "critical" || c.severity === "major") &&
      ["rights_lost", "obligation_added", "liability_changed",
       "dispute_resolution_changed", "data_usage_changed"].includes(c.change_type)
  );

  if (relevantChanges.length === 0) return [];

  // Batch into groups of 3
  for (let i = 0; i < relevantChanges.length; i += 3) {
    const batch = relevantChanges.slice(i, i + 3);
    const changeIndex = changes.indexOf(batch[0]);

    const changesText = batch
      .map((c, idx) => {
        return `Change ${idx + 1}:
Section: ${c.section_title}
Type: ${c.change_type}
Old: "${c.old_text}"
New: "${c.new_text}"
Impact: ${c.user_impact_summary}`;
      })
      .join("\n\n---\n\n");

    try {
      const response = await callGroq(
        [
          { role: "system", content: CHANGE_LEGALITY_PROMPT },
          {
            role: "user",
            content: `Company: ${companyName}\n\nAnalyze these changes for legality:\n\n${changesText}`,
          },
        ],
        { temperature: 0.1, maxTokens: 2048 }
      );

      const parsed = JSON.parse(response);

      if (parsed.violations && Array.isArray(parsed.violations)) {
        for (const violation of parsed.violations) {
          issues.push({
            change_index: changeIndex + (batch.indexOf(batch[0]) || 0),
            law_name: violation.law_name || "Unknown",
            section: violation.section || "",
            violation_description: violation.violation_description || "",
            severity: violation.severity === "critical" ? "critical" : "major",
          });
        }
      }
    } catch (error) {
      console.error("[Watchdog] Legality check failed for batch:", error);
    }
  }

  return issues;
}
