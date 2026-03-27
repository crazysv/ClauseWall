// ============================================
// SEMANTIC DIFF ENGINE
// Text diff + Groq-powered semantic analysis
// ============================================

import { callGroq } from "@/lib/ai/groq-client";
import { splitIntoParagraphs } from "./text-cleaner";
import { SEMANTIC_DIFF_PROMPT } from "./prompts";
import type { SemanticChange } from "@/types";
import type { ParagraphDiff, SemanticDiffResponse } from "./types";

/**
 * Perform semantic diff between two ToS versions
 */
export async function performSemanticDiff(
  oldText: string,
  newText: string,
  companyName: string
): Promise<{
  changes: SemanticChange[];
  overall_summary: string;
  overall_direction: string;
}> {
  // Stage 1: Text-level paragraph diff
  const textDiffs = computeParagraphDiff(oldText, newText);

  // Filter out unchanged paragraphs
  const meaningfulDiffs = textDiffs.filter((d) => d.type !== "unchanged");

  if (meaningfulDiffs.length === 0) {
    return {
      changes: [],
      overall_summary: "No meaningful changes detected.",
      overall_direction: "neutral",
    };
  }

  // Check if changes are purely cosmetic (very small text differences)
  const totalChangedWords = meaningfulDiffs.reduce((sum, d) => {
    const oldWords = d.old_text.split(/\s+/).length;
    const newWords = d.new_text.split(/\s+/).length;
    return sum + Math.abs(newWords - oldWords);
  }, 0);

  if (totalChangedWords < 5 && meaningfulDiffs.length <= 2) {
    return {
      changes: meaningfulDiffs.map((d) => ({
        section_title: "Minor Edit",
        old_text: d.old_text,
        new_text: d.new_text,
        change_type: "neutral_clarification" as const,
        severity: "cosmetic" as const,
        direction: "neutral" as const,
        user_impact_summary: "Minor wording change with no substantive impact.",
        legal_implications: "No legal implications.",
        affected_user_actions: [],
        confidence: 0.9,
      })),
      overall_summary: "Cosmetic changes only — minor wording adjustments.",
      overall_direction: "neutral",
    };
  }

  // Stage 2: Batch changes and send to Groq for semantic analysis
  const allChanges: SemanticChange[] = [];
  let overallSummary = "";
  let overallDirection = "neutral";

  // Process in batches of 5
  const batchSize = 5;
  for (let i = 0; i < meaningfulDiffs.length; i += batchSize) {
    const batch = meaningfulDiffs.slice(i, i + batchSize);

    const changesText = batch
      .map((d, idx) => {
        if (d.type === "added") {
          return `Change ${i + idx + 1} (ADDED):\nNew text: "${d.new_text}"`;
        } else if (d.type === "removed") {
          return `Change ${i + idx + 1} (REMOVED):\nOld text: "${d.old_text}"`;
        } else {
          return `Change ${i + idx + 1} (MODIFIED):\nOld text: "${d.old_text}"\nNew text: "${d.new_text}"`;
        }
      })
      .join("\n\n---\n\n");

    try {
      const response = await callGroq(
        [
          { role: "system", content: SEMANTIC_DIFF_PROMPT },
          {
            role: "user",
            content: `Company: ${companyName}\n\nAnalyze these ${batch.length} changes:\n\n${changesText}`,
          },
        ],
        { temperature: 0.1, maxTokens: 4096 }
      );

      const parsed: SemanticDiffResponse = JSON.parse(response);

      if (parsed.changes && Array.isArray(parsed.changes)) {
        allChanges.push(
          ...parsed.changes.map((c) => ({
            section_title: c.section_title || "Unknown Section",
            old_text: c.old_text || "",
            new_text: c.new_text || "",
            change_type: validateChangeType(c.change_type),
            severity: validateSeverity(c.severity),
            direction: validateDirection(c.direction),
            user_impact_summary: c.user_impact_summary || "",
            legal_implications: c.legal_implications || "",
            affected_user_actions: c.affected_user_actions || [],
            confidence: Math.min(1, Math.max(0, c.confidence || 0.5)),
          }))
        );
      }

      if (parsed.overall_summary) overallSummary = parsed.overall_summary;
      if (parsed.overall_direction) overallDirection = parsed.overall_direction;
    } catch (error) {
      console.error("[Watchdog] Semantic diff batch failed:", error);
      // Fallback: create basic entries for this batch
      batch.forEach((d) => {
        allChanges.push({
          section_title: "Analysis Pending",
          old_text: d.old_text,
          new_text: d.new_text,
          change_type: "neutral_clarification",
          severity: "minor",
          direction: "neutral",
          user_impact_summary: "Change detected but semantic analysis failed. Manual review recommended.",
          legal_implications: "Unable to analyze automatically.",
          affected_user_actions: [],
          confidence: 0.1,
        });
      });
    }
  }

  return {
    changes: allChanges,
    overall_summary: overallSummary || `${allChanges.length} changes detected in ${companyName}'s terms.`,
    overall_direction: overallDirection,
  };
}

/**
 * Compute paragraph-level diff using LCS alignment
 */
function computeParagraphDiff(oldText: string, newText: string): ParagraphDiff[] {
  const oldParagraphs = splitIntoParagraphs(oldText);
  const newParagraphs = splitIntoParagraphs(newText);

  const diffs: ParagraphDiff[] = [];
  const matched = new Set<number>();

  // Simple matching: find exact and similar paragraphs
  for (let i = 0; i < oldParagraphs.length; i++) {
    let bestMatch = -1;
    let bestSimilarity = 0;

    for (let j = 0; j < newParagraphs.length; j++) {
      if (matched.has(j)) continue;

      const similarity = computeSimilarity(oldParagraphs[i], newParagraphs[j]);

      if (similarity > bestSimilarity) {
        bestSimilarity = similarity;
        bestMatch = j;
      }
    }

    if (bestSimilarity >= 0.9) {
      // Almost identical
      matched.add(bestMatch);
      if (bestSimilarity < 1.0) {
        diffs.push({
          type: "modified",
          old_text: oldParagraphs[i],
          new_text: newParagraphs[bestMatch],
          old_index: i,
          new_index: bestMatch,
        });
      }
      // else: unchanged, skip
    } else if (bestSimilarity >= 0.4) {
      // Similar enough to be a modification
      matched.add(bestMatch);
      diffs.push({
        type: "modified",
        old_text: oldParagraphs[i],
        new_text: newParagraphs[bestMatch],
        old_index: i,
        new_index: bestMatch,
      });
    } else {
      // No match — this paragraph was removed
      diffs.push({
        type: "removed",
        old_text: oldParagraphs[i],
        new_text: "",
        old_index: i,
        new_index: -1,
      });
    }
  }

  // Find added paragraphs (in new but not matched)
  for (let j = 0; j < newParagraphs.length; j++) {
    if (!matched.has(j)) {
      diffs.push({
        type: "added",
        old_text: "",
        new_text: newParagraphs[j],
        old_index: -1,
        new_index: j,
      });
    }
  }

  return diffs;
}

/**
 * Simple similarity measure (Jaccard on words)
 */
function computeSimilarity(a: string, b: string): number {
  const wordsA = new Set(a.toLowerCase().split(/\s+/));
  const wordsB = new Set(b.toLowerCase().split(/\s+/));

  const intersection = new Set([...wordsA].filter((w) => wordsB.has(w)));
  const union = new Set([...wordsA, ...wordsB]);

  if (union.size === 0) return 1;
  return intersection.size / union.size;
}

function validateChangeType(type: string): SemanticChange["change_type"] {
  const valid = [
    "rights_gained", "rights_lost", "obligation_added", "obligation_removed",
    "liability_changed", "data_usage_changed", "dispute_resolution_changed",
    "pricing_terms_changed", "termination_changed", "neutral_clarification",
  ];
  return valid.includes(type) ? (type as SemanticChange["change_type"]) : "neutral_clarification";
}

function validateSeverity(sev: string): SemanticChange["severity"] {
  const valid = ["critical", "major", "minor", "cosmetic"];
  return valid.includes(sev) ? (sev as SemanticChange["severity"]) : "minor";
}

function validateDirection(dir: string): SemanticChange["direction"] {
  const valid = ["pro_company", "pro_consumer", "neutral"];
  return valid.includes(dir) ? (dir as SemanticChange["direction"]) : "neutral";
}
