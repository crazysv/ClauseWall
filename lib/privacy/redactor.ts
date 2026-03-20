// ============================================
// PII REDACTOR — Masks personal data in text
// ============================================

import { detectPII } from "./pii-detector";
import type { PIIDetection, RedactionResult } from "./types";

/**
 * Redact all PII from text
 * Returns redacted text + detection stats
 */
export function redactPII(text: string): RedactionResult {
  const detections = detectPII(text);

  if (detections.length === 0) {
    return {
      original: text,
      redacted: text,
      detections: [],
      stats: {
        total: 0,
        names: 0,
        ids: 0,
        contacts: 0,
        addresses: 0,
        financial: 0,
      },
    };
  }

  // Build redacted text by replacing from end to start
  // (so indices remain valid)
  let redacted = text;
  const sorted = [...detections].sort(
    (a, b) => b.startIndex - a.startIndex
  );

  for (const detection of sorted) {
    redacted =
      redacted.substring(0, detection.startIndex) +
      detection.masked +
      redacted.substring(detection.endIndex);
  }

  // Calculate stats
  const stats = {
    total: detections.length,
    names: detections.filter(
      (d) => d.type === "name" || d.type === "company"
    ).length,
    ids: detections.filter(
      (d) =>
        d.type === "aadhaar" ||
        d.type === "pan" ||
        d.type === "gstin" ||
        d.type === "cin"
    ).length,
    contacts: detections.filter(
      (d) => d.type === "email" || d.type === "phone"
    ).length,
    addresses: detections.filter((d) => d.type === "address").length,
    financial: detections.filter(
      (d) => d.type === "amount" || d.type === "bank_account"
    ).length,
  };

  return {
    original: text,
    redacted,
    detections,
    stats,
  };
}

/**
 * Redact an array of clause texts
 */
export function redactClauses(
  clauses: string[]
): {
  redactedClauses: string[];
  totalRedactions: RedactionResult["stats"];
  allDetections: PIIDetection[];
} {
  let totalStats = {
    total: 0,
    names: 0,
    ids: 0,
    contacts: 0,
    addresses: 0,
    financial: 0,
  };
  const allDetections: PIIDetection[] = [];
  const redactedClauses: string[] = [];

  for (const clause of clauses) {
    const result = redactPII(clause);
    redactedClauses.push(result.redacted);
    allDetections.push(...result.detections);

    totalStats.total += result.stats.total;
    totalStats.names += result.stats.names;
    totalStats.ids += result.stats.ids;
    totalStats.contacts += result.stats.contacts;
    totalStats.addresses += result.stats.addresses;
    totalStats.financial += result.stats.financial;
  }

  return { redactedClauses, totalRedactions: totalStats, allDetections };
}