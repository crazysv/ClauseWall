// ============================================
// CONTRACT STATE MACHINE ENGINE — TYPE DEFINITIONS
// Formal state machine extraction and analysis types
// ============================================

// ============================================
// TYPE ALIASES (String Literal Unions)
// ============================================

export type StateType =
  | "initial"
  | "normal"
  | "restricted"
  | "dangerous"
  | "trap"
  | "absorbing_trap"
  | "terminal_safe"
  | "terminal_warning"
  | "terminal_loss";

export type TriggerType =
  | "automatic"
  | "time_based"
  | "user_action"
  | "counterparty_action"
  | "external_event"
  | "breach";

export type FinancialImpactType =
  | "none"
  | "payment"
  | "penalty"
  | "partial_loss"
  | "total_loss"
  | "gain"
  | "refund";

export type TransitionParty =
  | "user"
  | "counterparty"
  | "automatic"
  | "mutual";

export type TrapType =
  | "absorbing"
  | "semi_trap"
  | "dead_end"
  | "cyclic_trap";

export type TrapSeverity = "critical" | "high" | "medium";

export type SafetyLevel = "safe" | "moderate" | "dangerous" | "critical";

export type PathType =
  | "optimal"
  | "worst"
  | "common"
  | "escape"
  | "trap_path";

export type Probability = "certain" | "likely" | "possible" | "unlikely";

export type TimelineEventType =
  | "normal"
  | "deadline"
  | "risk"
  | "trap_entry"
  | "action_required"
  | "milestone";

export type StateParty =
  | "tenant"
  | "employee"
  | "borrower"
  | "user"
  | "both"
  | "landlord"
  | "employer"
  | "lender"
  | "counterparty";

// ============================================
// CORE INTERFACES
// ============================================

/** A single state in the contract lifecycle */
export interface ContractState {
  id: string;
  name: string;
  description: string;
  type: StateType;
  party: StateParty;
  financialImpact: {
    type: FinancialImpactType;
    amount?: string;
    monetaryValue?: number;
  };
  duration?: {
    value: number;
    unit: "days" | "months" | "years";
    isFixed: boolean;
  };
  legalIssues?: string[];
  clauseReferences?: string[];
  isTrap: boolean;
  isAbsorbing: boolean;
  metadata?: Record<string, unknown>;
}

/** A transition between two states */
export interface StateTransition {
  id: string;
  fromStateId: string;
  toStateId: string;
  trigger: string;
  triggerType: TriggerType;
  condition?: string;
  timeConstraint?: {
    afterMonths?: number;
    afterDays?: number;
    beforeDate?: string;
    withinPeriod?: string;
  };
  party: TransitionParty;
  isVoluntary: boolean;
  isReversible: boolean;
  financialConsequence?: string;
  clauseReference?: string;
  probability: Probability;
  metadata?: Record<string, unknown>;
}

/** The complete state machine for a contract */
export interface ContractStateMachine {
  id: string;
  documentId: string;
  documentType: string;
  jurisdiction: string;
  states: ContractState[];
  transitions: StateTransition[];
  initialStateId: string;
  terminalStateIds: string[];
  metadata: {
    totalStates: number;
    totalTransitions: number;
    trapStates: number;
    absorbingStates: number;
    maxPathLength: number;
    avgPathLength: number;
    extractedAt: string;
    confidence: number;
  };
}

// ============================================
// ANALYSIS INTERFACES
// ============================================

/** Analysis result for a single trap state */
export interface TrapStateAnalysis {
  stateId: string;
  stateName: string;
  trapType: TrapType;
  severity: TrapSeverity;
  description: string;
  pathsLeadingHere: StatePath[];
  outgoingPaths: StatePath[];
  financialImpact: string;
  legalIssue?: string;
  fairAlternative: string;
  affectedParty: "user" | "counterparty";
  relatedClauses: string[];
  relatedProofTreeIds?: string[];
}

/** An ordered sequence of states and transitions forming a path */
export interface StatePath {
  states: string[];
  transitions: string[];
  totalDuration?: { value: number; unit: string };
  totalFinancialImpact?: string;
  probability: Probability;
  type: PathType;
  description: string;
}

/** Complete path analysis across the state machine */
export interface PathAnalysis {
  optimalPath: StatePath | null;
  worstPath: StatePath | null;
  commonPaths: StatePath[];
  escapePaths: StatePath[];
  trapPaths: StatePath[];
  asymmetries: Array<{
    description: string;
    favoredParty: "user" | "counterparty";
    severity: "high" | "medium" | "low";
  }>;
}

/** Complete report from state machine analysis */
export interface StateMachineReport {
  stateMachine: ContractStateMachine;
  trapAnalysis: TrapStateAnalysis[];
  pathAnalysis: PathAnalysis;
  overallSafety: SafetyLevel;
  summary: string;
  recommendations: string[];
  timelineEvents: TimelineEvent[];
}

/** A single event on the contract timeline */
export interface TimelineEvent {
  month: number;
  stateId: string;
  event: string;
  type: TimelineEventType;
  userAction?: string;
}

// ============================================
// TEMPLATE INTERFACES
// ============================================

/** Definition of a base state in a template */
export interface TemplateBaseState {
  name: string;
  type: StateType;
  description: string;
}

/** Definition of a base transition in a template */
export interface TemplateBaseTransition {
  from: string;
  to: string;
  trigger: string;
}

/** A state machine template for a specific document type */
export interface StateTemplate {
  documentType: string;
  baseStates: TemplateBaseState[];
  baseTransitions: TemplateBaseTransition[];
  commonTraps: string[];
}

/** Result of template validation */
export interface TemplateValidationResult {
  missingStates: string[];
  missingTransitions: string[];
  completeness: number;
}

// ============================================
// API RESPONSE INTERFACES
// ============================================

/** Response from state machine extraction API */
export interface StateMachineExtractResponse {
  success: boolean;
  report?: StateMachineReport;
  error?: string;
}

/** Response from state machine simulation API */
export interface StateMachineSimulateResponse {
  success: boolean;
  currentState?: ContractState;
  availableTransitions?: StateTransition[];
  nextState?: ContractState;
  consequences?: string;
  recommendations?: string[];
  error?: string;
}

/** Response from path-finding API */
export interface StateMachinePathResponse {
  success: boolean;
  paths?: StatePath[];
  error?: string;
}

// ============================================
// GRAPH LAYOUT INTERFACES (for SVG rendering)
// ============================================

/** Position of a state node in the SVG graph */
export interface NodePosition {
  x: number;
  y: number;
  layer: number;
  indexInLayer: number;
}

/** Layout configuration for the graph */
export interface GraphLayoutConfig {
  horizontalSpacing: number;
  verticalSpacing: number;
  nodeWidth: number;
  nodeHeight: number;
  padding: number;
}
