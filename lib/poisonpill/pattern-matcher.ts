// ============================================
// POISON PILL — DETERMINISTIC PATTERN MATCHER
// Pure TypeScript. NO AI calls. Fast pre-screening.
// ============================================

import { KNOWN_TRAP_PATTERNS, type TrapPatternDefinition } from "./trap-patterns";
import type { TrapPatternType, ClauseConnection } from "@/types";

// ---- Input type ----
interface ClauseInput {
  clause_number: number;
  original_text: string;
  clause_type: string;
  risk_level: string;
  risk_score: number;
}

// ---- Output types ----
export interface PotentialTrapMatch {
  pattern_type: TrapPatternType;
  pattern_name: string;
  matching_clauses: number[];
  keyword_matches: Record<number, string[]>; // clause_number → matched keywords
  confidence: "high" | "medium" | "low";
}

// ============================================
// PRE-SCREEN FOR TRAP PATTERNS
// ============================================

export function preScreenForTraps(clauses: ClauseInput[]): PotentialTrapMatch[] {
  const results: PotentialTrapMatch[] = [];

  for (const pattern of KNOWN_TRAP_PATTERNS) {
    const match = matchPattern(pattern, clauses);
    if (match) {
      results.push(match);
    }
  }

  return results;
}

function matchPattern(
  pattern: TrapPatternDefinition,
  clauses: ClauseInput[]
): PotentialTrapMatch | null {
  // Step 1: Find clauses whose clause_type matches pattern's clause_types_involved
  const typeMatchedClauses = clauses.filter((c) =>
    pattern.clause_types_involved.some(
      (pt) =>
        c.clause_type.toLowerCase().includes(pt.toLowerCase()) ||
        pt.toLowerCase().includes(c.clause_type.toLowerCase())
    )
  );

  // Step 2: For each matched clause, check keywords in its original_text
  const keywordMatches: Record<number, string[]> = {};
  const matchingClauses: number[] = [];
  const keywordGroupsMatched = new Set<number>();

  for (const clause of typeMatchedClauses) {
    const textLower = clause.original_text.toLowerCase();
    const matched: string[] = [];

    for (let gIdx = 0; gIdx < pattern.detection_keywords.length; gIdx++) {
      const keywordGroup = pattern.detection_keywords[gIdx];
      for (const keyword of keywordGroup) {
        if (textLower.includes(keyword.toLowerCase())) {
          matched.push(keyword);
          keywordGroupsMatched.add(gIdx);
          break; // One match per group per clause is enough
        }
      }
    }

    if (matched.length > 0) {
      keywordMatches[clause.clause_number] = matched;
      matchingClauses.push(clause.clause_number);
    }
  }

  // Also check ALL clauses (not just type-matched) for keyword matches
  // Some clauses might have generic types but contain relevant keywords
  for (const clause of clauses) {
    if (matchingClauses.includes(clause.clause_number)) continue;
    const textLower = clause.original_text.toLowerCase();
    const matched: string[] = [];

    for (let gIdx = 0; gIdx < pattern.detection_keywords.length; gIdx++) {
      const keywordGroup = pattern.detection_keywords[gIdx];
      for (const keyword of keywordGroup) {
        if (textLower.includes(keyword.toLowerCase())) {
          matched.push(keyword);
          keywordGroupsMatched.add(gIdx);
          break;
        }
      }
    }

    if (matched.length > 0) {
      keywordMatches[clause.clause_number] = matched;
      matchingClauses.push(clause.clause_number);
    }
  }

  // Step 3: Check if enough clauses matched
  if (matchingClauses.length < pattern.min_clauses_needed) {
    return null;
  }

  // Need at least 2 keyword groups matched to be a credible match
  if (keywordGroupsMatched.size < 2) {
    return null;
  }

  // Step 4: Calculate confidence
  const totalGroups = pattern.detection_keywords.length;
  let confidence: "high" | "medium" | "low";

  if (keywordGroupsMatched.size >= totalGroups) {
    confidence = "high";
  } else if (keywordGroupsMatched.size >= Math.ceil(totalGroups * 0.6)) {
    confidence = "medium";
  } else {
    confidence = "low";
  }

  return {
    pattern_type: pattern.pattern_type,
    pattern_name: pattern.name,
    matching_clauses: matchingClauses,
    keyword_matches: keywordMatches,
    confidence,
  };
}

// ============================================
// TEXT-BASED CLAUSE CONNECTION DETECTION
// ============================================

const CROSS_REFERENCE_PATTERNS = [
  /(?:as per|subject to|notwithstanding|pursuant to|in accordance with|under|referred to in|defined in|mentioned in)\s+(?:clause|section|article|paragraph|para)\s*(?:no\.?\s*)?(\d+)/gi,
  /clause\s*(?:no\.?\s*)?(\d+)/gi,
  /section\s*(?:no\.?\s*)?(\d+)/gi,
];

export function getClauseConnections(
  clauses: ClauseInput[]
): ClauseConnection[] {
  const connections: ClauseConnection[] = [];
  const existingClauseNumbers = new Set(clauses.map((c) => c.clause_number));

  for (const clause of clauses) {
    const text = clause.original_text;

    // Find references to other clause numbers
    for (const pattern of CROSS_REFERENCE_PATTERNS) {
      pattern.lastIndex = 0; // Reset regex
      let match;
      while ((match = pattern.exec(text)) !== null) {
        const referencedClause = parseInt(match[1], 10);
        if (
          referencedClause !== clause.clause_number &&
          existingClauseNumbers.has(referencedClause)
        ) {
          // Avoid duplicates
          const exists = connections.some(
            (c) =>
              c.from_clause_number === clause.clause_number &&
              c.to_clause_number === referencedClause
          );
          if (!exists) {
            connections.push({
              from_clause_number: clause.clause_number,
              to_clause_number: referencedClause,
              connection_type: "references",
              description: `Clause ${clause.clause_number} references Clause ${referencedClause}`,
              strength: "moderate",
            });
          }
        }
      }
    }

    // Detect conditional dependencies via language patterns
    const conditionalPatterns = [
      /(?:if|in the event|should|in case)\s+.*?(?:clause|section)\s*(\d+)/gi,
      /(?:subject to|conditional upon|contingent on)\s+.*?(?:clause|section)\s*(\d+)/gi,
    ];

    for (const condPattern of conditionalPatterns) {
      condPattern.lastIndex = 0;
      let match;
      while ((match = condPattern.exec(text)) !== null) {
        const referencedClause = parseInt(match[1], 10);
        if (
          referencedClause !== clause.clause_number &&
          existingClauseNumbers.has(referencedClause)
        ) {
          const exists = connections.some(
            (c) =>
              c.from_clause_number === clause.clause_number &&
              c.to_clause_number === referencedClause &&
              c.connection_type === "depends_on"
          );
          if (!exists) {
            connections.push({
              from_clause_number: clause.clause_number,
              to_clause_number: referencedClause,
              connection_type: "depends_on",
              description: `Clause ${clause.clause_number} depends on Clause ${referencedClause}`,
              strength: "strong",
            });
          }
        }
      }
    }
  }

  return connections;
}
