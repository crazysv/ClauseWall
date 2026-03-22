// ============================================
// POISON PILL — BARREL EXPORT + ORCHESTRATOR
// ============================================

export { KNOWN_TRAP_PATTERNS } from "./trap-patterns";
export type { TrapPatternDefinition } from "./trap-patterns";
export { preScreenForTraps, getClauseConnections } from "./pattern-matcher";
export type { PotentialTrapMatch } from "./pattern-matcher";
export { detectPoisonPills } from "./trap-detector";
export {
  buildInterconnectionGraph,
  calculateTrapScore,
  generateNegotiationRoadmap,
} from "./graph-builder";

import type { PoisonPillAnalysisResult } from "@/types";
import { preScreenForTraps, getClauseConnections } from "./pattern-matcher";
import { detectPoisonPills } from "./trap-detector";
import {
  buildInterconnectionGraph,
  calculateTrapScore,
  generateNegotiationRoadmap,
} from "./graph-builder";

// ---- Input type for the orchestrator ----
interface ClauseInput {
  clause_number: number;
  original_text: string;
  clause_type: string;
  risk_level: string;
  risk_score: number;
  explanation: string;
  legal_citation: string | null;
  extracted_value: number | null;
  extracted_unit: string | null;
}

// ============================================
// MAIN ORCHESTRATOR
// ============================================

export async function analyzePoisonPills(
  clauses: ClauseInput[],
  documentType: string,
  jurisdiction: string,
  entityName: string | null
): Promise<PoisonPillAnalysisResult> {
  const emptyResult: PoisonPillAnalysisResult = {
    traps: [],
    graph: { nodes: [], edges: [], clusters: [] },
    combined_trap_score: 0,
    trap_density: 0,
    most_dangerous_trap: null,
    most_connected_clause: null,
    risk_amplification_summary: "No clause combination traps detected.",
    negotiation_roadmap: [],
  };

  try {
    // Guard: too few clauses for meaningful analysis
    if (clauses.length < 3) {
      console.log("[PoisonPill] Skipping — fewer than 3 clauses");
      return emptyResult;
    }

    // Step 1: Pre-screen for potential trap patterns
    const potentialMatches = preScreenForTraps(clauses);
    console.log(
      `[PoisonPill] Pre-screening: ${potentialMatches.length} potential patterns found`
    );

    // Step 2: Get text-based clause connections
    const textConnections = getClauseConnections(clauses);
    console.log(
      `[PoisonPill] Text connections: ${textConnections.length} cross-references found`
    );

    // Step 3: Optimization — skip AI if nothing suspicious
    const hasRiskyClause = clauses.some(
      (c) => c.risk_level === "dangerous" || c.risk_level === "illegal"
    );
    const allSafe = clauses.every((c) => c.risk_level === "safe");

    if (potentialMatches.length === 0 && !hasRiskyClause) {
      console.log(
        "[PoisonPill] Skipping AI call — no patterns found and no risky clauses"
      );
      // Build basic graph from text connections only
      const graph = buildInterconnectionGraph(clauses, [], textConnections);
      return { ...emptyResult, graph };
    }

    if (allSafe && potentialMatches.length === 0) {
      console.log("[PoisonPill] Skipping — all clauses are safe");
      const graph = buildInterconnectionGraph(clauses, [], textConnections);
      return { ...emptyResult, graph };
    }

    // Step 4: AI-powered deep detection
    const traps = await detectPoisonPills(
      clauses,
      potentialMatches,
      textConnections,
      documentType,
      jurisdiction,
      entityName
    );
    console.log(`[PoisonPill] AI detection: ${traps.length} traps confirmed`);

    // Step 5: Build graph
    const graph = buildInterconnectionGraph(clauses, traps, textConnections);

    // Step 6: Calculate score
    const combinedTrapScore = calculateTrapScore(traps);

    // Step 7: Generate roadmap
    const negotiationRoadmap = generateNegotiationRoadmap(traps);

    // Step 8: Calculate trap density
    const clausesInTraps = new Set<number>();
    for (const trap of traps) {
      for (const mech of trap.mechanisms) {
        clausesInTraps.add(mech.clause_number);
      }
    }
    const trapDensity =
      clauses.length > 0
        ? Math.round((clausesInTraps.size / clauses.length) * 100)
        : 0;

    // Step 9: Find most connected clause
    let mostConnected: number | null = null;
    let maxConnections = 0;
    for (const node of graph.nodes) {
      if (node.connection_count > maxConnections) {
        maxConnections = node.connection_count;
        mostConnected = node.clause_number;
      }
    }

    // Step 10: Calculate average risk amplification
    let avgMultiplier = 0;
    if (traps.length > 0) {
      avgMultiplier =
        traps.reduce((sum, t) => sum + t.risk_multiplier, 0) / traps.length;
    }

    const riskAmpSummary =
      traps.length > 0
        ? `The clauses in this contract amplify each other's risks by ${avgMultiplier.toFixed(1)}x on average across ${traps.length} trap pattern${traps.length > 1 ? "s" : ""}.`
        : "No clause combination traps detected.";

    // Step 11: Find most dangerous trap
    const mostDangerous =
      traps.length > 0
        ? traps.reduce((worst, t) =>
            t.combined_risk_score > worst.combined_risk_score ? t : worst
          )
        : null;

    return {
      traps,
      graph,
      combined_trap_score: combinedTrapScore,
      trap_density: trapDensity,
      most_dangerous_trap: mostDangerous,
      most_connected_clause: mostConnected,
      risk_amplification_summary: riskAmpSummary,
      negotiation_roadmap: negotiationRoadmap,
    };
  } catch (error) {
    console.error("[PoisonPill] Full pipeline error (non-fatal):", error);
    return emptyResult;
  }
}
