// ============================================
// NEUROSYMBOLIC REASONING ENGINE — TYPE DEFINITIONS
// Formal logical inference types for ClauseWall
// ============================================

// ---- Fact: A single piece of knowledge ----

export interface FactSource {
  type: "extraction" | "user_input" | "derived";
  clauseText?: string;
  clauseIndex?: number;
  confidence: number; // 0-1
  extractionMethod: string; // "groq_llama3" | "regex" | "user_provided" | "derived"
}

export interface Fact {
  id: string;
  predicate: string; // e.g., "deposit_months", "jurisdiction"
  value: string | number | boolean;
  source: FactSource;
  timestamp: string;
}

// ---- Condition: A single check in a rule ----

export type ConditionType =
  | "comparison"
  | "existence"
  | "membership"
  | "range"
  | "pattern";

export type ComparisonOperator =
  | ">"
  | "<"
  | ">="
  | "<="
  | "=="
  | "!="
  | "contains"
  | "matches";

export interface Condition {
  type: ConditionType;
  predicate: string; // which fact to check
  operator?: ComparisonOperator;
  value?: string | number | boolean | (string | number | boolean)[]; // value(s) to compare against
  reference?: string; // reference to another fact's value
  negate?: boolean; // for NOT conditions
}

// ---- Conclusion: What a rule derives ----

export type ConclusionType = "violation" | "compliance" | "warning" | "advisory";

export type SeverityLevel = "illegal" | "dangerous" | "warning" | "info" | "safe";

export interface Conclusion {
  type: ConclusionType;
  riskLevel: SeverityLevel;
  message: string; // template with {variable} placeholders
  detailedExplanation: string;
}

// ---- LogicalRule: A formal legal rule ----

export interface RuleStatute {
  code: string; // e.g., "Maharashtra Rent Control Act, Section 16(2)"
  text: string; // actual statute text excerpt
  url?: string;
}

export interface LogicalRule {
  id: string; // e.g., "R-MH-RENT-001"
  jurisdiction: string;
  documentType: string;
  clauseType: string;
  name: string;
  description: string;
  conditions: Condition[];
  conclusion: Conclusion;
  statute: RuleStatute;
  severity: SeverityLevel;
  remedy?: string;
  penalty?: string;
  priority: number; // higher = checked first
}

// ---- ProofNode: A single step in the proof tree ----

export type ProofNodeType =
  | "fact"
  | "rule"
  | "condition_check"
  | "comparison"
  | "inference"
  | "conclusion"
  | "extraction";

export type ProofStatus = "proven" | "failed" | "assumed" | "uncertain";

export interface ProofNodeMetadata {
  extractedValue?: string | number | boolean;
  originalText?: string;
  confidence?: number;
  ruleId?: string;
  ruleName?: string;
  statute?: string;
  statuteText?: string;
  leftOperand?: string | number | boolean;
  operator?: string;
  rightOperand?: string | number | boolean;
  comparisonResult?: boolean;
  riskLevel?: string;
  violation?: string;
  remedy?: string;
  penalty?: string;
  missingFact?: string;
}

export interface ProofNode {
  id: string;
  type: ProofNodeType;
  label: string;
  description: string;
  status: ProofStatus;
  children: ProofNode[];
  depth: number;
  metadata: ProofNodeMetadata;
  timestamp: string;
}

// ---- ProofTree: Complete proof for a clause ----

export type ProofVerdict =
  | "proven_illegal"
  | "proven_dangerous"
  | "proven_warning"
  | "proven_safe"
  | "unprovable"
  | "insufficient_data";

export interface ProofTree {
  id: string;
  clauseId?: string;
  documentId?: string;
  clauseText: string;
  query: string;
  conclusion: ProofNode;
  verdict: ProofVerdict;
  totalSteps: number;
  verifiedSteps: number;
  aiAssistedSteps: number;
  confidence: number;
  derivationChain: string[];
  rulesApplied: string[];
  factsUsed: Fact[];
  createdAt: string;
}

// ---- ReasoningSession ----

export interface ReasoningSession {
  id: string;
  facts: Fact[];
  rules: LogicalRule[];
  proofTrees: ProofTree[];
  jurisdiction: string;
  documentType: string;
  startedAt: string;
  completedAt?: string;
}

// ---- InferenceResult ----

export interface RuleFiring {
  ruleId: string;
  ruleName: string;
  severity: string;
}

export interface InferenceResult {
  proofTree: ProofTree | null;
  violations: RuleFiring[];
  warnings: RuleFiring[];
  compliance: RuleFiring[];
  unmatchedRules: string[];
  totalRulesChecked: number;
  totalRulesFired: number;
}

// ---- Condition evaluation result (internal) ----

export interface ConditionEvaluation {
  result: boolean;
  detail: string;
  confidence: number;
  proofNode: ProofNode;
}

// ---- Rule evaluation result (internal) ----

export interface RuleEvaluation {
  fires: boolean;
  proofNodes: ProofNode[];
  confidence: number;
  failedConditions: string[];
  missingFacts: string[];
}

// ---- Proof summary (for UI) ----

export interface ProofSummaryData {
  verdict: string;
  stepsCount: number;
  verifiedPercent: number;
  confidence: number;
  mainStatute: string | null;
  mainViolation: string | null;
  riskLevel: string;
  isProvable: boolean;
}
