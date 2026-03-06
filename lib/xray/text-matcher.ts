// ============================================
// X-RAY TEXT MATCHING ENGINE
// Finds clause positions in original document text
// ============================================

import type { Clause } from "@/types";

export interface TextSegment {
  text: string;
  type: "normal" | "highlighted";
  clause?: Clause;
  startIndex: number;
  endIndex: number;
}

export interface MatchedClause {
  clause: Clause;
  startIndex: number;
  endIndex: number;
  matchedText: string;
}

/**
 * Normalize text for fuzzy matching
 */
function normalizeText(text: string): string {
  return text
    .replace(/\s+/g, " ")
    .replace(/[""]/g, '"')
    .replace(/['']/g, "'")
    .replace(/–/g, "-")
    .replace(/…/g, "...")
    .trim()
    .toLowerCase();
}

/**
 * Build a position map from normalized index → original index
 */
function buildPositionMap(original: string): number[] {
  const map: number[] = [];
  let inWhitespace = false;

  for (let i = 0; i < original.length; i++) {
    const ch = original[i];
    const isWS = /\s/.test(ch);

    if (isWS) {
      if (!inWhitespace) {
        map.push(i);
        inWhitespace = true;
      }
    } else {
      inWhitespace = false;
      // Handle smart quote mapping
      if (ch === "\u201C" || ch === "\u201D") {
        map.push(i); // maps to "
      } else if (ch === "\u2018" || ch === "\u2019") {
        map.push(i); // maps to '
      } else if (ch === "\u2013") {
        map.push(i); // maps to -
      } else if (ch === "\u2026") {
        map.push(i); // maps to .
        map.push(i);
        map.push(i);
      } else {
        map.push(i);
      }
    }
  }

  return map;
}

/**
 * Find the best match position for a clause in the document
 */
function findClausePosition(
  rawText: string,
  normalizedRaw: string,
  positionMap: number[],
  clauseText: string
): { start: number; end: number } | null {
  if (!clauseText || clauseText.length < 15) return null;

  const normalizedClause = normalizeText(clauseText);

  // Strategy 1: Full match
  let searchText = normalizedClause;
  let idx = normalizedRaw.indexOf(searchText);

  if (idx !== -1) {
    const origStart = positionMap[idx] ?? 0;
    const endIdx = Math.min(idx + searchText.length, positionMap.length - 1);
    const origEnd = (positionMap[endIdx] ?? origStart) + 1;
    return { start: origStart, end: Math.min(origEnd, rawText.length) };
  }

  // Strategy 2: First 120 chars
  if (normalizedClause.length > 120) {
    searchText = normalizedClause.slice(0, 120);
    idx = normalizedRaw.indexOf(searchText);

    if (idx !== -1) {
      const origStart = positionMap[idx] ?? 0;
      const estimatedEnd = origStart + clauseText.length;
      return { start: origStart, end: Math.min(estimatedEnd, rawText.length) };
    }
  }

  // Strategy 3: First 60 chars
  searchText = normalizedClause.slice(0, 60);
  idx = normalizedRaw.indexOf(searchText);

  if (idx !== -1) {
    const origStart = positionMap[idx] ?? 0;
    const estimatedEnd = origStart + clauseText.length;
    return { start: origStart, end: Math.min(estimatedEnd, rawText.length) };
  }

  // Strategy 4: Key phrase extraction (first sentence or 40 chars)
  const firstSentence = normalizedClause.split(/[.!?]/)[0];
  if (firstSentence && firstSentence.length > 20) {
    searchText = firstSentence.slice(0, 40);
    idx = normalizedRaw.indexOf(searchText);

    if (idx !== -1) {
      const origStart = positionMap[idx] ?? 0;
      const estimatedEnd = origStart + clauseText.length;
      return { start: origStart, end: Math.min(estimatedEnd, rawText.length) };
    }
  }

  return null;
}

/**
 * Find all clause positions in the raw document text
 */
export function findAllClausePositions(
  rawText: string,
  clauses: Clause[]
): MatchedClause[] {
  const normalizedRaw = normalizeText(rawText);
  const positionMap = buildPositionMap(rawText);
  const matches: MatchedClause[] = [];

  for (const clause of clauses) {
    const position = findClausePosition(
      rawText,
      normalizedRaw,
      positionMap,
      clause.original_text
    );

    if (position) {
      matches.push({
        clause,
        startIndex: position.start,
        endIndex: position.end,
        matchedText: rawText.slice(position.start, position.end),
      });
    }
  }

  // Sort by position
  matches.sort((a, b) => a.startIndex - b.startIndex);

  // Remove overlaps — keep the more dangerous clause
  const riskPriority: Record<string, number> = {
    illegal: 4,
    dangerous: 3,
    warning: 2,
    safe: 1,
  };

  const filtered: MatchedClause[] = [];

  for (const match of matches) {
    const overlapping = filtered.find(
      (f) =>
        (match.startIndex >= f.startIndex && match.startIndex < f.endIndex) ||
        (match.endIndex > f.startIndex && match.endIndex <= f.endIndex) ||
        (match.startIndex <= f.startIndex && match.endIndex >= f.endIndex)
    );

    if (!overlapping) {
      filtered.push(match);
    } else {
      const existingPriority = riskPriority[overlapping.clause.risk_level] || 0;
      const newPriority = riskPriority[match.clause.risk_level] || 0;

      if (newPriority > existingPriority) {
        const index = filtered.indexOf(overlapping);
        filtered[index] = match;
      }
    }
  }

  // Re-sort after filtering
  filtered.sort((a, b) => a.startIndex - b.startIndex);

  return filtered;
}

/**
 * Build ordered text segments for rendering
 */
export function buildTextSegments(
  rawText: string,
  matchedClauses: MatchedClause[]
): TextSegment[] {
  if (!matchedClauses.length) {
    return [
      {
        text: rawText,
        type: "normal",
        startIndex: 0,
        endIndex: rawText.length,
      },
    ];
  }

  const segments: TextSegment[] = [];
  let currentIndex = 0;

  for (const match of matchedClauses) {
    // Safety check
    if (match.startIndex < currentIndex) continue;

    // Normal text before this clause
    if (match.startIndex > currentIndex) {
      segments.push({
        text: rawText.slice(currentIndex, match.startIndex),
        type: "normal",
        startIndex: currentIndex,
        endIndex: match.startIndex,
      });
    }

    // Highlighted clause
    segments.push({
      text: rawText.slice(match.startIndex, match.endIndex),
      type: "highlighted",
      clause: match.clause,
      startIndex: match.startIndex,
      endIndex: match.endIndex,
    });

    currentIndex = match.endIndex;
  }

  // Remaining text
  if (currentIndex < rawText.length) {
    segments.push({
      text: rawText.slice(currentIndex),
      type: "normal",
      startIndex: currentIndex,
      endIndex: rawText.length,
    });
  }

  return segments;
}