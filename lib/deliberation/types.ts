// ============================================
// ADVERSARIAL DELIBERATION ENGINE — TYPE DEFINITIONS
// Three-agent debate system: Predator, Guardian, Arbiter
// ============================================

// ---- Agent Roles ----

export type AgentRole = "predator" | "guardian" | "arbiter";

export type AgentTone = "aggressive" | "measured" | "conciliatory";

export type DeliberationVerdict = "fair" | "unfair" | "partially_fair" | "illegal";

export type DeliberationStatus =
  | "idle"
  | "predator_arguing"
  | "guardian_arguing"
  | "arbiter_deliberating"
  | "complete"
  | "error";

// ---- Agent Argument (shared structure for all three agents) ----

export interface AgentArgument {
  role: AgentRole;
  agentName: string;
  argument: string;
  keyPoints: string[];
  citations: string[];
  confidence: number;
  tone: AgentTone;
  respondingTo?: AgentRole;
  timestamp: string;
  wasRecovered?: boolean;
}

// ---- Arbiter's Verdict (extended output from the Judicial Arbiter) ----

export interface ArbiterVerdict {
  verdict: DeliberationVerdict;
  confidence: number;
  reasoning: string;
  keyFactors: string[];
  predatorValidPoints: string[];
  guardianValidPoints: string[];
  predatorWeaknesses: string[];
  guardianWeaknesses: string[];
  suggestedModification: string;
  legalReferences: string[];
  proofTreeReference?: string;
}

// ---- Deliberation for a Single Clause ----

export interface ClauseDeliberation {
  id: string;
  clauseId?: string;
  clauseIndex?: number;
  clauseText: string;
  clauseType?: string;
  documentType: string;
  jurisdiction: string;
  predatorArgument: AgentArgument;
  guardianArgument: AgentArgument;
  arbiterArgument: AgentArgument;
  arbiterVerdict: ArbiterVerdict;
  deliberationDuration: number;
  totalTokensUsed?: number;
  createdAt: string;
}

// ---- Full Document Deliberation Result ----

export interface DeliberationSummary {
  totalClauses: number;
  fairCount: number;
  unfairCount: number;
  partiallyFairCount: number;
  illegalCount: number;
  averageConfidence: number;
  mostContestedClause: string;
  mostContestedIndex: number;
  strongestPredatorPoint: string;
  strongestGuardianPoint: string;
}

export interface DeliberationResult {
  documentId: string;
  deliberations: ClauseDeliberation[];
  summary: DeliberationSummary;
  completedAt: string;
  totalDuration: number;
}

// ---- Progress Tracking ----

export interface DeliberationProgress {
  totalClauses: number;
  currentClause: number;
  currentAgent: AgentRole | null;
  status: DeliberationStatus;
  message: string;
  estimatedTimeRemaining?: number;
}
