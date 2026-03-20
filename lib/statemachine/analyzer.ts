// ============================================
// CONTRACT STATE MACHINE — GRAPH ANALYSIS ENGINE
// Pure algorithmic analysis: BFS/DFS, trap detection, path finding
// NO AI calls — completely deterministic
// ============================================

import type {
  ContractStateMachine,
  ContractState,
  StateTransition,
  TrapStateAnalysis,
  TrapType,
  TrapSeverity,
  StatePath,
  PathType,
  PathAnalysis,
  Probability,
  StateMachineReport,
  SafetyLevel,
  TimelineEvent,
  TimelineEventType,
} from "./types";

// ============================================
// PROBABILITY UTILITIES
// ============================================

const PROBABILITY_MAP: Record<Probability, number> = {
  certain: 1.0,
  likely: 0.8,
  possible: 0.5,
  unlikely: 0.2,
};

function numericProbability(p: Probability): number {
  return PROBABILITY_MAP[p] ?? 0.5;
}

function probabilityFromNumeric(n: number): Probability {
  if (n >= 0.9) return "certain";
  if (n >= 0.6) return "likely";
  if (n >= 0.3) return "possible";
  return "unlikely";
}

// ============================================
// ANALYZER CLASS
// ============================================

export class StateMachineAnalyzer {
  private sm: ContractStateMachine;
  private stateIndex: Map<string, ContractState>;
  private transitionIndex: Map<string, StateTransition>;
  private adjacency: Map<string, string[]>;
  private reverseAdjacency: Map<string, string[]>;
  private transitionsByFrom: Map<string, StateTransition[]>;
  private transitionsByPair: Map<string, StateTransition>;

  constructor(stateMachine: ContractStateMachine) {
    this.sm = stateMachine;
    this.stateIndex = new Map();
    this.transitionIndex = new Map();
    this.adjacency = new Map();
    this.reverseAdjacency = new Map();
    this.transitionsByFrom = new Map();
    this.transitionsByPair = new Map();

    this.buildIndices();
  }

  // ---- INDEX BUILDING ----

  private buildIndices(): void {
    // Index states by ID
    for (const state of this.sm.states) {
      this.stateIndex.set(state.id, state);
      this.adjacency.set(state.id, []);
      this.reverseAdjacency.set(state.id, []);
      this.transitionsByFrom.set(state.id, []);
    }

    // Build adjacency lists from transitions
    for (const trans of this.sm.transitions) {
      this.transitionIndex.set(trans.id, trans);

      const adj = this.adjacency.get(trans.fromStateId);
      if (adj && !adj.includes(trans.toStateId)) {
        adj.push(trans.toStateId);
      }

      const rev = this.reverseAdjacency.get(trans.toStateId);
      if (rev && !rev.includes(trans.fromStateId)) {
        rev.push(trans.fromStateId);
      }

      const fromTrans = this.transitionsByFrom.get(trans.fromStateId);
      if (fromTrans) {
        fromTrans.push(trans);
      }

      this.transitionsByPair.set(`${trans.fromStateId}->${trans.toStateId}`, trans);
    }
  }

  // ========================================
  // TRAP DETECTION
  // ========================================

  /**
   * Identify all trap states using BFS-based reachability analysis.
   * A trap state is one where all paths forward lead to user loss.
   */
  findTrapStates(): TrapStateAnalysis[] {
    const traps: TrapStateAnalysis[] = [];
    const terminalSet = new Set(this.sm.terminalStateIds);

    for (const state of this.sm.states) {
      // Skip terminal states — they are endpoints, not traps
      if (terminalSet.has(state.id)) continue;
      // Skip initial state
      if (state.id === this.sm.initialStateId) continue;

      const outgoing = this.transitionsByFrom.get(state.id) || [];
      const reachable = this.bfsReachable(state.id);
      const reachableTerminals = Array.from(reachable).filter((id) => terminalSet.has(id));

      let trapType: TrapType | null = null;
      let severity: TrapSeverity = "medium";

      // Case A: No outgoing transitions and not terminal → ABSORBING
      if (outgoing.length === 0) {
        trapType = "absorbing";
        severity = "critical";
        state.isAbsorbing = true;
        state.isTrap = true;
      }
      // Case B: Self-loop only → ABSORBING (effectively stuck)
      else if (outgoing.every((t) => t.toStateId === state.id)) {
        trapType = "absorbing";
        severity = "critical";
        state.isAbsorbing = true;
        state.isTrap = true;
      }
      // Case C: Can reach terminals but ALL are terminal_loss
      else if (
        reachableTerminals.length > 0 &&
        reachableTerminals.every((id) => {
          const s = this.stateIndex.get(id);
          return s?.type === "terminal_loss";
        })
      ) {
        trapType = "absorbing";
        severity = "critical";
        state.isTrap = true;
      }
      // Case D: All reachable terminals are loss or warning
      else if (
        reachableTerminals.length > 0 &&
        reachableTerminals.every((id) => {
          const s = this.stateIndex.get(id);
          return s?.type === "terminal_loss" || s?.type === "terminal_warning";
        })
      ) {
        trapType = "semi_trap";
        severity = "high";
        state.isTrap = true;
      }
      // Case E: No reachable terminals at all (cycle with no exit)
      else if (reachableTerminals.length === 0 && reachable.size > 0) {
        trapType = "cyclic_trap";
        severity = "high";
        state.isTrap = true;
      }
      // Case F: Dead end — has outgoing but reaches only non-terminal states with no further exit
      else if (reachableTerminals.length === 0 && reachable.size === 0) {
        trapType = "dead_end";
        severity = "critical";
        state.isTrap = true;
      }

      if (trapType) {
        const pathsLeadingHere = this.findAllPaths(this.sm.initialStateId, state.id, 10);
        const outgoingPaths: StatePath[] = [];

        // Find paths from this trap to any terminal
        for (const termId of this.sm.terminalStateIds) {
          const paths = this.findAllPaths(state.id, termId, 10);
          outgoingPaths.push(...paths);
        }

        traps.push({
          stateId: state.id,
          stateName: state.name,
          trapType,
          severity,
          description: this.generateTrapDescription(state, trapType),
          pathsLeadingHere: pathsLeadingHere.slice(0, 3),
          outgoingPaths: outgoingPaths.slice(0, 3),
          financialImpact: state.financialImpact.amount || "Unspecified financial impact",
          legalIssue: state.legalIssues?.[0],
          fairAlternative: this.generateFairAlternative(state, trapType),
          affectedParty: "user",
          relatedClauses: state.clauseReferences || [],
        });
      }
    }

    // Sort by severity: critical first
    const severityOrder: Record<TrapSeverity, number> = { critical: 0, high: 1, medium: 2 };
    traps.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

    return traps;
  }

  /** Find all states with no outgoing transitions that aren't terminal */
  findAbsorbingStates(): string[] {
    const terminalSet = new Set(this.sm.terminalStateIds);
    const absorbing: string[] = [];

    for (const state of this.sm.states) {
      if (terminalSet.has(state.id)) continue;

      const outgoing = this.transitionsByFrom.get(state.id) || [];

      // No outgoing transitions → absorbing
      if (outgoing.length === 0) {
        absorbing.push(state.id);
        continue;
      }

      // All outgoing → self → absorbing
      if (outgoing.every((t) => t.toStateId === state.id)) {
        absorbing.push(state.id);
        continue;
      }

      // All outgoing lead to other known absorbing states
      const targets = outgoing.map((t) => t.toStateId);
      if (targets.every((tid) => absorbing.includes(tid))) {
        absorbing.push(state.id);
      }
    }

    return absorbing;
  }

  // ========================================
  // PATH FINDING
  // ========================================

  /**
   * BFS-based path finding between two states with cycle detection.
   */
  findAllPaths(fromStateId: string, toStateId: string, maxDepth: number = 15): StatePath[] {
    if (!this.stateIndex.has(fromStateId) || !this.stateIndex.has(toStateId)) {
      return [];
    }
    if (fromStateId === toStateId) {
      return [{
        states: [fromStateId],
        transitions: [],
        probability: "certain",
        type: "common",
        description: `Already at ${this.stateIndex.get(fromStateId)?.name || fromStateId}`,
      }];
    }

    const results: StatePath[] = [];

    interface QueueItem {
      currentState: string;
      pathStates: string[];
      pathTransitions: string[];
      visited: Set<string>;
    }

    const queue: QueueItem[] = [{
      currentState: fromStateId,
      pathStates: [fromStateId],
      pathTransitions: [],
      visited: new Set([fromStateId]),
    }];

    while (queue.length > 0 && results.length < 20) {
      const item = queue.shift()!;

      if (item.pathStates.length > maxDepth) continue;

      const outgoing = this.transitionsByFrom.get(item.currentState) || [];

      for (const trans of outgoing) {
        if (trans.toStateId === toStateId) {
          // Found a complete path
          const pathStates = [...item.pathStates, toStateId];
          const pathTransitions = [...item.pathTransitions, trans.id];

          results.push(
            this.buildStatePath(pathStates, pathTransitions, "common")
          );
        } else if (!item.visited.has(trans.toStateId)) {
          // Continue exploring
          const newVisited = new Set(item.visited);
          newVisited.add(trans.toStateId);

          queue.push({
            currentState: trans.toStateId,
            pathStates: [...item.pathStates, trans.toStateId],
            pathTransitions: [...item.pathTransitions, trans.id],
            visited: newVisited,
          });
        }
      }
    }

    // Sort by probability desc, then length asc
    results.sort((a, b) => {
      const probDiff = numericProbability(b.probability) - numericProbability(a.probability);
      if (Math.abs(probDiff) > 0.01) return probDiff;
      return a.states.length - b.states.length;
    });

    return results;
  }

  /** Find the optimal (safest) path from initial to a safe terminal */
  findOptimalPath(): StatePath | null {
    const safeTerminals = this.sm.states.filter((s) => s.type === "terminal_safe");
    const warningTerminals = this.sm.states.filter((s) => s.type === "terminal_warning");

    const targets = safeTerminals.length > 0 ? safeTerminals : warningTerminals;
    if (targets.length === 0) return null;

    let bestPath: StatePath | null = null;
    let bestScore = -1;

    for (const target of targets) {
      const paths = this.findAllPaths(this.sm.initialStateId, target.id, 12);
      for (const path of paths) {
        const prob = numericProbability(path.probability);
        // Score: higher probability and shorter path is better
        const score = prob * (1 / (path.states.length || 1));
        if (score > bestScore) {
          bestScore = score;
          bestPath = { ...path, type: "optimal" };
        }
      }
    }

    return bestPath;
  }

  /** Find the worst (most likely loss) path from initial to a loss terminal */
  findWorstPath(): StatePath | null {
    const lossTerminals = this.sm.states.filter((s) => s.type === "terminal_loss");
    const warningTerminals = this.sm.states.filter((s) => s.type === "terminal_warning");

    const targets = lossTerminals.length > 0 ? lossTerminals : warningTerminals;
    if (targets.length === 0) return null;

    let worstPath: StatePath | null = null;
    let worstProb = -1;

    for (const target of targets) {
      const paths = this.findAllPaths(this.sm.initialStateId, target.id, 12);
      for (const path of paths) {
        const prob = numericProbability(path.probability);
        if (prob > worstProb) {
          worstProb = prob;
          worstPath = { ...path, type: "worst" };
        }
      }
    }

    return worstPath;
  }

  /** Find escape paths from a given state to any safe terminal */
  findEscapePaths(fromStateId: string): StatePath[] {
    const safeTerminals = this.sm.states.filter((s) => s.type === "terminal_safe");
    const results: StatePath[] = [];

    for (const target of safeTerminals) {
      const paths = this.findAllPaths(fromStateId, target.id, 10);
      for (const path of paths) {
        results.push({ ...path, type: "escape" });
      }
    }

    return results;
  }

  // ========================================
  // ASYMMETRY ANALYSIS
  // ========================================

  /** Analyze power asymmetries in transition control */
  analyzeAsymmetry(): Array<{
    description: string;
    favoredParty: "user" | "counterparty";
    severity: "high" | "medium" | "low";
  }> {
    const asymmetries: Array<{
      description: string;
      favoredParty: "user" | "counterparty";
      severity: "high" | "medium" | "low";
    }> = [];

    // Count transitions by controlling party
    let userControlled = 0;
    let counterpartyControlled = 0;
    let userVoluntary = 0;
    let counterpartyVoluntary = 0;

    for (const trans of this.sm.transitions) {
      if (trans.party === "user") {
        userControlled++;
        if (trans.isVoluntary) userVoluntary++;
      } else if (trans.party === "counterparty") {
        counterpartyControlled++;
        if (trans.isVoluntary) counterpartyVoluntary++;
      }
    }

    // Overall control asymmetry
    const total = userControlled + counterpartyControlled;
    if (total > 0) {
      const userPercent = Math.round((userControlled / total) * 100);
      const cpPercent = 100 - userPercent;

      if (cpPercent > userPercent + 20) {
        asymmetries.push({
          description: `Counterparty controls ${cpPercent}% of transitions vs user's ${userPercent}%`,
          favoredParty: "counterparty",
          severity: cpPercent > userPercent + 40 ? "high" : "medium",
        });
      }
    }

    // Check for unilateral termination rights
    const userCanTerminate = this.sm.transitions.some(
      (t) =>
        t.party === "user" &&
        this.sm.terminalStateIds.includes(t.toStateId) &&
        t.isVoluntary
    );
    const cpCanTerminate = this.sm.transitions.some(
      (t) =>
        t.party === "counterparty" &&
        this.sm.terminalStateIds.includes(t.toStateId) &&
        t.isVoluntary
    );

    if (cpCanTerminate && !userCanTerminate) {
      asymmetries.push({
        description: "Counterparty can terminate the contract unilaterally, but user cannot",
        favoredParty: "counterparty",
        severity: "high",
      });
    }

    // Check for penalty asymmetries
    const userPenalties = this.sm.transitions.filter(
      (t) => t.party === "user" && t.financialConsequence
    );
    const cpPenalties = this.sm.transitions.filter(
      (t) => t.party === "counterparty" && t.financialConsequence
    );

    if (userPenalties.length > 0 && cpPenalties.length === 0) {
      asymmetries.push({
        description: `User faces ${userPenalties.length} financial consequences for transitions, counterparty faces none`,
        favoredParty: "counterparty",
        severity: "high",
      });
    }

    // Check for reversibility asymmetry
    const userReversible = this.sm.transitions.filter(
      (t) => t.party === "user" && t.isReversible
    ).length;
    const cpReversible = this.sm.transitions.filter(
      (t) => t.party === "counterparty" && t.isReversible
    ).length;

    if (userReversible === 0 && cpReversible > 0) {
      asymmetries.push({
        description: "Counterparty can reverse their actions, but user's actions are permanent",
        favoredParty: "counterparty",
        severity: "medium",
      });
    }

    // Check for involuntary transitions imposed on user
    const involuntaryOnUser = this.sm.transitions.filter(
      (t) => t.party === "counterparty" && !t.isVoluntary
    );
    if (involuntaryOnUser.length > 2) {
      asymmetries.push({
        description: `${involuntaryOnUser.length} transitions can be imposed on user without consent`,
        favoredParty: "counterparty",
        severity: involuntaryOnUser.length > 4 ? "high" : "medium",
      });
    }

    return asymmetries;
  }

  // ========================================
  // TIMELINE GENERATION
  // ========================================

  /** Generate a timeline of events along a given path (or optimal path) */
  generateTimeline(path?: StatePath): TimelineEvent[] {
    const events: TimelineEvent[] = [];
    const usePath = path || this.findOptimalPath();
    if (!usePath) return events;

    let currentMonth = 0;

    for (let i = 0; i < usePath.states.length; i++) {
      const stateId = usePath.states[i];
      const state = this.stateIndex.get(stateId);
      if (!state) continue;

      // Entry event
      let eventType: TimelineEventType = "normal";
      if (state.type === "initial") eventType = "milestone";
      else if (state.type === "restricted") eventType = "risk";
      else if (state.type === "dangerous" || state.type === "trap") eventType = "trap_entry";
      else if (state.type === "terminal_safe") eventType = "milestone";
      else if (state.type === "terminal_loss") eventType = "trap_entry";

      events.push({
        month: currentMonth,
        stateId,
        event: `Enter: ${state.name}`,
        type: eventType,
        userAction: state.type === "restricted" ? "Limited options during this period" : undefined,
      });

      // If state has duration, advance the clock
      if (state.duration) {
        let durationMonths = state.duration.value;
        if (state.duration.unit === "days") durationMonths = Math.ceil(state.duration.value / 30);
        else if (state.duration.unit === "years") durationMonths = state.duration.value * 12;

        // Add deadline event at end of duration
        if (durationMonths > 0) {
          events.push({
            month: currentMonth + durationMonths,
            stateId,
            event: `${state.name} period ends`,
            type: "deadline",
            userAction: "Review options before deadline",
          });

          // Add midpoint action reminder for long durations
          if (durationMonths > 3) {
            events.push({
              month: currentMonth + Math.floor(durationMonths / 2),
              stateId,
              event: `Midpoint of ${state.name}`,
              type: "action_required",
              userAction: "Review contract status and upcoming obligations",
            });
          }

          currentMonth += durationMonths;
        }
      }

      // Process the transition to next state
      if (i < usePath.transitions.length) {
        const transId = usePath.transitions[i];
        const trans = this.transitionIndex.get(transId);
        if (trans) {
          // If transition has a time constraint, advance further
          if (trans.timeConstraint?.afterMonths) {
            currentMonth += trans.timeConstraint.afterMonths;
          } else if (trans.timeConstraint?.afterDays) {
            currentMonth += Math.ceil(trans.timeConstraint.afterDays / 30);
          }

          if (trans.financialConsequence) {
            events.push({
              month: currentMonth,
              stateId: trans.toStateId,
              event: `Financial event: ${trans.financialConsequence}`,
              type: "risk",
            });
          }
        }
      }
    }

    // Sort by month
    events.sort((a, b) => a.month - b.month);

    return events;
  }

  // ========================================
  // FULL REPORT
  // ========================================

  /** Generate the complete state machine analysis report */
  getFullReport(): StateMachineReport {
    // 1. Find trap states (this also marks states as trap/absorbing)
    const traps = this.findTrapStates();

    // Update state machine metadata with trap count
    this.sm.metadata.trapStates = traps.length;
    this.sm.metadata.absorbingStates = this.findAbsorbingStates().length;

    // 2. Path analysis
    const optimalPath = this.findOptimalPath();
    const worstPath = this.findWorstPath();

    const escapePaths: StatePath[] = [];
    const trapPaths: StatePath[] = [];
    for (const trap of traps) {
      escapePaths.push(...this.findEscapePaths(trap.stateId).slice(0, 2));
      trapPaths.push(...trap.pathsLeadingHere.slice(0, 2));
    }

    // Find common paths (highest probability transitions from initial)
    const commonPaths: StatePath[] = [];
    for (const termId of this.sm.terminalStateIds) {
      const paths = this.findAllPaths(this.sm.initialStateId, termId, 10);
      if (paths.length > 0) {
        commonPaths.push(paths[0]);
      }
    }

    const pathAnalysis: PathAnalysis = {
      optimalPath,
      worstPath,
      commonPaths: commonPaths.slice(0, 5),
      escapePaths: escapePaths.slice(0, 5),
      trapPaths: trapPaths.slice(0, 5),
      asymmetries: this.analyzeAsymmetry(),
    };

    // 3. Calculate max/avg path lengths
    const allPathLengths = [
      ...(optimalPath ? [optimalPath.states.length] : []),
      ...(worstPath ? [worstPath.states.length] : []),
      ...commonPaths.map((p) => p.states.length),
    ];

    if (allPathLengths.length > 0) {
      this.sm.metadata.maxPathLength = Math.max(...allPathLengths);
      this.sm.metadata.avgPathLength = Math.round(
        allPathLengths.reduce((a, b) => a + b, 0) / allPathLengths.length
      );
    }

    // 4. Overall safety
    const overallSafety = this.determineOverallSafety(traps);

    // 5. Summary
    const summary = this.generateSummary(traps, optimalPath, worstPath, overallSafety);

    // 6. Recommendations
    const recommendations = this.generateRecommendations(traps, pathAnalysis.asymmetries);

    // 7. Timeline
    const timeline = this.generateTimeline(optimalPath || undefined);

    return {
      stateMachine: this.sm,
      trapAnalysis: traps,
      pathAnalysis,
      overallSafety,
      summary,
      recommendations,
      timelineEvents: timeline,
    };
  }

  // ========================================
  // PRIVATE HELPERS
  // ========================================

  /** BFS to find all states reachable from a given state */
  private bfsReachable(fromStateId: string): Set<string> {
    const visited = new Set<string>();
    const queue: string[] = [];

    const initial = this.adjacency.get(fromStateId) || [];
    for (const next of initial) {
      if (next !== fromStateId) {
        queue.push(next);
        visited.add(next);
      }
    }

    while (queue.length > 0) {
      const current = queue.shift()!;
      const neighbors = this.adjacency.get(current) || [];
      for (const neighbor of neighbors) {
        if (!visited.has(neighbor)) {
          visited.add(neighbor);
          queue.push(neighbor);
        }
      }
    }

    return visited;
  }

  /** Build a StatePath object from state and transition ID arrays */
  private buildStatePath(
    stateIds: string[],
    transitionIds: string[],
    type: PathType
  ): StatePath {
    // Calculate probability (product of transition probabilities)
    let combinedProb = 1.0;
    for (const tid of transitionIds) {
      const trans = this.transitionIndex.get(tid);
      if (trans) {
        combinedProb *= numericProbability(trans.probability);
      }
    }

    // Calculate total duration
    let totalMonths = 0;
    for (const sid of stateIds) {
      const state = this.stateIndex.get(sid);
      if (state?.duration) {
        let months = state.duration.value;
        if (state.duration.unit === "days") months = Math.ceil(state.duration.value / 30);
        else if (state.duration.unit === "years") months = state.duration.value * 12;
        totalMonths += months;
      }
    }

    // Build description
    const stateNames = stateIds
      .map((id) => this.stateIndex.get(id)?.name || id)
      .join(" → ");

    // Collect financial impacts
    const impacts: string[] = [];
    for (const tid of transitionIds) {
      const trans = this.transitionIndex.get(tid);
      if (trans?.financialConsequence) {
        impacts.push(trans.financialConsequence);
      }
    }

    return {
      states: stateIds,
      transitions: transitionIds,
      totalDuration: totalMonths > 0 ? { value: totalMonths, unit: "months" } : undefined,
      totalFinancialImpact: impacts.length > 0 ? impacts.join("; ") : undefined,
      probability: probabilityFromNumeric(combinedProb),
      type,
      description: stateNames,
    };
  }

  /** Generate human-readable trap description */
  private generateTrapDescription(state: ContractState, trapType: TrapType): string {
    switch (trapType) {
      case "absorbing":
        return `"${state.name}" has no exit — once you enter this state, you are stuck permanently with no way to reach a favorable outcome.`;
      case "semi_trap":
        return `"${state.name}" leads only to unfavorable outcomes — all paths from here end in loss or reduced terms.`;
      case "dead_end":
        return `"${state.name}" is a dead end — no transitions lead anywhere from this state.`;
      case "cyclic_trap":
        return `"${state.name}" is part of a cycle with no exit to any terminal state — you can loop indefinitely without resolution.`;
      default:
        return `"${state.name}" is a trap state that limits your options and may lead to financial loss.`;
    }
  }

  /** Generate fair alternative for a trap state */
  private generateFairAlternative(state: ContractState, trapType: TrapType): string {
    if (trapType === "absorbing") {
      return `Add an exit clause from "${state.name}" with proportional penalty instead of total loss. Ensure at least one path leads to partial recovery.`;
    }
    if (trapType === "semi_trap") {
      return `Add an alternative outcome from "${state.name}" that allows the user to reach a safe termination with reasonable conditions.`;
    }
    if (trapType === "cyclic_trap") {
      return `Add a time limit or automatic resolution mechanism to break the cycle at "${state.name}" after a reasonable period.`;
    }
    return `Negotiate removal or modification of the clause creating "${state.name}" to ensure proportional consequences.`;
  }

  /** Determine overall safety level */
  private determineOverallSafety(traps: TrapStateAnalysis[]): SafetyLevel {
    if (traps.length === 0) {
      const absorbing = this.findAbsorbingStates();
      if (absorbing.length === 0) return "safe";
      return "moderate";
    }

    const hasCritical = traps.some((t) => t.severity === "critical");
    const hasAbsorbing = this.findAbsorbingStates().length > 0;

    if (hasCritical || hasAbsorbing) return "critical";
    if (traps.some((t) => t.severity === "high")) return "dangerous";
    return "moderate";
  }

  /** Generate a human-readable summary */
  private generateSummary(
    traps: TrapStateAnalysis[],
    optimalPath: StatePath | null,
    worstPath: StatePath | null,
    safety: SafetyLevel
  ): string {
    const parts: string[] = [];

    parts.push(
      `This contract defines ${this.sm.metadata.totalStates} states and ${this.sm.metadata.totalTransitions} transitions.`
    );

    if (traps.length === 0) {
      parts.push("No trap states were detected — all paths have viable exits.");
    } else {
      const criticalTraps = traps.filter((t) => t.severity === "critical");
      parts.push(
        `${traps.length} trap state${traps.length > 1 ? "s" : ""} detected${criticalTraps.length > 0 ? ` (${criticalTraps.length} critical)` : ""}.`
      );
      if (traps[0]) {
        parts.push(`Most severe: "${traps[0].stateName}" — ${traps[0].description.substring(0, 120)}`);
      }
    }

    if (optimalPath) {
      parts.push(`Safest path: ${optimalPath.description}.`);
    }

    return parts.join(" ");
  }

  /** Generate actionable recommendations */
  private generateRecommendations(
    traps: TrapStateAnalysis[],
    asymmetries: PathAnalysis["asymmetries"]
  ): string[] {
    const recs: string[] = [];

    for (const trap of traps.slice(0, 5)) {
      const clauses = trap.relatedClauses.length > 0
        ? ` (${trap.relatedClauses.join(", ")})`
        : "";
      recs.push(
        `Negotiate removal or modification of${clauses} to eliminate trap state "${trap.stateName}". ${trap.fairAlternative}`
      );
    }

    for (const asym of asymmetries.slice(0, 3)) {
      recs.push(asym.description + ". Request equal rights for both parties.");
    }

    if (recs.length === 0) {
      recs.push(
        "This contract has a balanced state machine with safe exits from every state. No critical changes needed."
      );
    }

    return recs;
  }
}
