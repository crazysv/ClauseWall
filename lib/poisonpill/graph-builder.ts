// ============================================
// POISON PILL — GRAPH BUILDER + SCORING
// Pure TypeScript. Builds visual graph, calculates score, generates roadmap.
// ============================================

import type {
  PoisonPillTrap,
  ClauseConnection,
  InterconnectionGraph,
  InterconnectionNode,
  InterconnectionEdge,
  InterconnectionCluster,
  NegotiationTarget,
  RiskLevel,
  TrapSeverity,
} from "@/types";

// ---- Clause input ----
interface ClauseForGraph {
  clause_number: number;
  clause_type: string;
  original_text: string;
  risk_level: string;
}

// ============================================
// BUILD INTERCONNECTION GRAPH
// ============================================

export function buildInterconnectionGraph(
  clauses: ClauseForGraph[],
  traps: PoisonPillTrap[],
  textConnections: ClauseConnection[]
): InterconnectionGraph {
  // -- 1. Create nodes --
  const trapClauseMap = new Map<number, string[]>(); // clause_number → trap IDs
  const connectionCountMap = new Map<number, number>();

  for (const trap of traps) {
    for (const mech of trap.mechanisms) {
      const existing = trapClauseMap.get(mech.clause_number) || [];
      existing.push(trap.id);
      trapClauseMap.set(mech.clause_number, existing);
    }
    for (const conn of trap.connections) {
      connectionCountMap.set(
        conn.from_clause_number,
        (connectionCountMap.get(conn.from_clause_number) || 0) + 1
      );
      connectionCountMap.set(
        conn.to_clause_number,
        (connectionCountMap.get(conn.to_clause_number) || 0) + 1
      );
    }
  }

  for (const conn of textConnections) {
    connectionCountMap.set(
      conn.from_clause_number,
      (connectionCountMap.get(conn.from_clause_number) || 0) + 1
    );
    connectionCountMap.set(
      conn.to_clause_number,
      (connectionCountMap.get(conn.to_clause_number) || 0) + 1
    );
  }

  // Position using force-directed layout
  const positions = forceDirectedLayout(
    clauses,
    traps,
    textConnections
  );

  const nodes: InterconnectionNode[] = clauses.map((c) => {
    const pos = positions.get(c.clause_number) || { x: 500, y: 300 };
    return {
      clause_number: c.clause_number,
      clause_type: c.clause_type,
      clause_text_snippet: c.original_text.substring(0, 80),
      risk_level: c.risk_level as RiskLevel,
      x: Math.round(pos.x),
      y: Math.round(pos.y),
      is_part_of_trap: trapClauseMap.has(c.clause_number),
      trap_ids: trapClauseMap.get(c.clause_number) || [],
      connection_count: connectionCountMap.get(c.clause_number) || 0,
    };
  });

  // -- 2. Create edges --
  const edgeSet = new Set<string>();
  const edges: InterconnectionEdge[] = [];

  // Trap connections
  for (const trap of traps) {
    for (const conn of trap.connections) {
      const key = `${conn.from_clause_number}-${conn.to_clause_number}-${conn.connection_type}`;
      if (!edgeSet.has(key)) {
        edgeSet.add(key);
        edges.push({
          from_clause: conn.from_clause_number,
          to_clause: conn.to_clause_number,
          connection_type: conn.connection_type,
          strength: conn.strength,
          trap_id: trap.id,
          label: conn.description,
        });
      }
    }
  }

  // Text connections
  for (const conn of textConnections) {
    const key = `${conn.from_clause_number}-${conn.to_clause_number}-${conn.connection_type}`;
    if (!edgeSet.has(key)) {
      edgeSet.add(key);
      edges.push({
        from_clause: conn.from_clause_number,
        to_clause: conn.to_clause_number,
        connection_type: conn.connection_type,
        strength: conn.strength,
        trap_id: null,
        label: conn.description,
      });
    }
  }

  // -- 3. Identify clusters --
  const clusters: InterconnectionCluster[] = [];

  for (const trap of traps) {
    const clauseNums = trap.mechanisms.map((m) => m.clause_number);
    const uniqueNums = [...new Set(clauseNums)];

    // Calculate density
    const possibleConnections = (uniqueNums.length * (uniqueNums.length - 1)) / 2;
    const actualConnections = trap.connections.length;
    const density = possibleConnections > 0
      ? Math.min(1, actualConnections / possibleConnections)
      : 0;

    // Highest risk in cluster
    const riskOrder: Record<string, number> = {
      illegal: 4, dangerous: 3, warning: 2, safe: 1,
    };
    let highestRisk: RiskLevel = "safe";
    for (const mech of trap.mechanisms) {
      if (
        (riskOrder[mech.individual_risk] || 0) >
        (riskOrder[highestRisk] || 0)
      ) {
        highestRisk = mech.individual_risk;
      }
    }

    clusters.push({
      id: `cluster_${trap.id}`,
      clause_numbers: uniqueNums,
      trap_id: trap.id,
      density: Math.round(density * 100) / 100,
      risk_level: highestRisk,
    });
  }

  return { nodes, edges, clusters };
}

// ============================================
// FORCE-DIRECTED LAYOUT (Simple spring simulation)
// ============================================

function forceDirectedLayout(
  clauses: ClauseForGraph[],
  traps: PoisonPillTrap[],
  connections: ClauseConnection[]
): Map<number, { x: number; y: number }> {
  const positions = new Map<number, { x: number; y: number }>();
  const velocities = new Map<number, { vx: number; vy: number }>();

  const WIDTH = 900;
  const HEIGHT = 600;
  const PADDING = 60;

  // Initialize in a circle
  const n = clauses.length;
  clauses.forEach((c, idx) => {
    const angle = (2 * Math.PI * idx) / n;
    const radius = Math.min(WIDTH, HEIGHT) * 0.35;
    positions.set(c.clause_number, {
      x: WIDTH / 2 + radius * Math.cos(angle),
      y: HEIGHT / 2 + radius * Math.sin(angle),
    });
    velocities.set(c.clause_number, { vx: 0, vy: 0 });
  });

  // Build adjacency for spring forces
  const adjacency = new Set<string>();
  for (const trap of traps) {
    for (const conn of trap.connections) {
      adjacency.add(`${conn.from_clause_number}-${conn.to_clause_number}`);
    }
  }
  for (const conn of connections) {
    adjacency.add(`${conn.from_clause_number}-${conn.to_clause_number}`);
  }

  // Build trap clusters for stronger attraction
  const trapClusters: number[][] = traps.map((t) =>
    t.mechanisms.map((m) => m.clause_number)
  );

  // Iterate
  const ITERATIONS = 50;
  const SPRING_K = 0.02;
  const REPULSION_K = 5000;
  const CLUSTER_K = 0.05;
  const DAMPING = 0.85;

  for (let iter = 0; iter < ITERATIONS; iter++) {
    const clauseNums = clauses.map((c) => c.clause_number);

    // Repulsion between all nodes
    for (let i = 0; i < clauseNums.length; i++) {
      for (let j = i + 1; j < clauseNums.length; j++) {
        const a = clauseNums[i];
        const b = clauseNums[j];
        const posA = positions.get(a)!;
        const posB = positions.get(b)!;

        const dx = posA.x - posB.x;
        const dy = posA.y - posB.y;
        const dist = Math.max(1, Math.sqrt(dx * dx + dy * dy));
        const force = REPULSION_K / (dist * dist);

        const fx = (dx / dist) * force;
        const fy = (dy / dist) * force;

        const velA = velocities.get(a)!;
        const velB = velocities.get(b)!;
        velA.vx += fx;
        velA.vy += fy;
        velB.vx -= fx;
        velB.vy -= fy;
      }
    }

    // Spring attraction for connected nodes
    for (const adj of adjacency) {
      const [aStr, bStr] = adj.split("-");
      const a = parseInt(aStr);
      const b = parseInt(bStr);
      const posA = positions.get(a);
      const posB = positions.get(b);
      if (!posA || !posB) continue;

      const dx = posB.x - posA.x;
      const dy = posB.y - posA.y;
      const dist = Math.max(1, Math.sqrt(dx * dx + dy * dy));
      const force = SPRING_K * (dist - 100); // Ideal distance = 100

      const fx = (dx / dist) * force;
      const fy = (dy / dist) * force;

      const velA = velocities.get(a)!;
      const velB = velocities.get(b)!;
      velA.vx += fx;
      velA.vy += fy;
      velB.vx -= fx;
      velB.vy -= fy;
    }

    // Cluster attraction (trap members pulled together)
    for (const cluster of trapClusters) {
      if (cluster.length < 2) continue;
      // Calculate centroid
      let cx = 0, cy = 0;
      for (const num of cluster) {
        const pos = positions.get(num);
        if (pos) { cx += pos.x; cy += pos.y; }
      }
      cx /= cluster.length;
      cy /= cluster.length;

      for (const num of cluster) {
        const pos = positions.get(num);
        const vel = velocities.get(num);
        if (!pos || !vel) continue;

        vel.vx += (cx - pos.x) * CLUSTER_K;
        vel.vy += (cy - pos.y) * CLUSTER_K;
      }
    }

    // Apply velocities
    for (const c of clauses) {
      const pos = positions.get(c.clause_number)!;
      const vel = velocities.get(c.clause_number)!;

      pos.x += vel.vx;
      pos.y += vel.vy;

      // Damping
      vel.vx *= DAMPING;
      vel.vy *= DAMPING;

      // Clamp to bounds
      pos.x = Math.max(PADDING, Math.min(WIDTH - PADDING, pos.x));
      pos.y = Math.max(PADDING, Math.min(HEIGHT - PADDING, pos.y));
    }
  }

  return positions;
}

// ============================================
// TRAP SCORE CALCULATOR
// ============================================

export function calculateTrapScore(traps: PoisonPillTrap[]): number {
  if (traps.length === 0) return 0;

  const severityWeights: Record<TrapSeverity, number> = {
    devastating: 4,
    severe: 3,
    moderate: 2,
    minor: 1,
  };

  let weightedSum = 0;
  const maxPossible = traps.length * 100 * 4; // All devastating at score 100

  for (const trap of traps) {
    const weight = severityWeights[trap.severity] || 1;
    weightedSum += trap.combined_risk_score * weight;
  }

  return Math.min(100, Math.round((weightedSum / maxPossible) * 100));
}

// ============================================
// NEGOTIATION ROADMAP GENERATOR
// ============================================

export function generateNegotiationRoadmap(
  traps: PoisonPillTrap[]
): NegotiationTarget[] {
  if (traps.length === 0) return [];

  // Count how many traps each clause appears in
  const clauseTrapCount = new Map<number, Set<string>>();
  const clauseInfo = new Map<
    number,
    { clause_type: string; suggested_change: string; why: string }
  >();

  for (const trap of traps) {
    // Track target clause specifically
    const targetClause = trap.which_clause_to_target;
    if (!clauseTrapCount.has(targetClause)) {
      clauseTrapCount.set(targetClause, new Set());
    }
    clauseTrapCount.get(targetClause)!.add(trap.id);

    // Store info
    if (!clauseInfo.has(targetClause)) {
      const mech = trap.mechanisms.find(
        (m) => m.clause_number === targetClause
      );
      clauseInfo.set(targetClause, {
        clause_type: mech?.clause_type || "unknown",
        suggested_change: trap.why_target_this_clause,
        why: `Removing or changing this clause breaks the "${trap.trap_name}" trap`,
      });
    }

    // Also track ALL mechanism clauses
    for (const mech of trap.mechanisms) {
      if (!clauseTrapCount.has(mech.clause_number)) {
        clauseTrapCount.set(mech.clause_number, new Set());
      }
      clauseTrapCount.get(mech.clause_number)!.add(trap.id);
    }
  }

  // Build targets sorted by number of traps broken
  const targets: NegotiationTarget[] = [];

  for (const [clauseNum, trapIds] of clauseTrapCount.entries()) {
    const info = clauseInfo.get(clauseNum);
    const trapsInvolved = traps.filter((t) => trapIds.has(t.id));
    const hasDevastating = trapsInvolved.some(
      (t) => t.severity === "devastating"
    );
    const hasSevere = trapsInvolved.some((t) => t.severity === "severe");

    targets.push({
      priority: 0, // Will be set after sorting
      clause_number: clauseNum,
      clause_type: info?.clause_type || "unknown",
      why: info?.why || `Appears in ${trapIds.size} trap pattern(s)`,
      traps_broken: Array.from(trapIds),
      difficulty: hasDevastating ? "hard" : hasSevere ? "medium" : "easy",
      suggested_change:
        info?.suggested_change ||
        `Negotiate this clause to neutralize ${trapIds.size} trap(s)`,
    });
  }

  // Sort: most traps broken first, then difficulty (easy first)
  const diffOrder: Record<string, number> = { easy: 0, medium: 1, hard: 2 };
  targets.sort((a, b) => {
    const trapDiff = b.traps_broken.length - a.traps_broken.length;
    if (trapDiff !== 0) return trapDiff;
    return (diffOrder[a.difficulty] || 1) - (diffOrder[b.difficulty] || 1);
  });

  // Assign priorities and limit to top 10
  return targets.slice(0, 10).map((t, idx) => ({
    ...t,
    priority: idx + 1,
  }));
}
