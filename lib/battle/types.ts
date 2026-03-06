// ============================================
// CONTRACT BATTLE — TYPE DEFINITIONS
// ============================================

export interface BattleScope {
  type: "state" | "india";
  label: string;
  count: number;
  available: boolean;
}

export interface ClauseComparison {
  clauseType: string;
  clauseLabel: string;

  // Your values
  yourValue: number;
  yourUnit: string;
  yourRiskLevel: string;

  // Average values
  avgValue: number;
  avgUnit: string;
  sampleCount: number;

  // Legal limit (from structured_rules)
  legalLimit: number | null;
  legalUnit: string | null;
  statuteCode: string | null;

  // Calculated
  percentile: number;
  ratio: number; // yourValue / avgValue
  insight: string;
  severity: "better" | "average" | "worse" | "critical";
}

export interface BattleData {
  scope: BattleScope;
  overallPercentile: number;
  overallVerdict: string;
  comparisons: ClauseComparison[];
  insights: string[];
  totalContractsAnalyzed: number;
}

export interface BattleScores {
  scope: BattleScope;
  overallPercentile: number;
  overallVerdict: string;
  scoreComparisons: ScoreComparison[];
  insights: string[];
  totalContractsAnalyzed: number;
}

export interface ScoreComparison {
  clauseType: string;
  clauseLabel: string;
  yourScore: number;
  avgScore: number;
  yourRiskLevel: string;
  sampleCount: number;
  percentile: number;
  insight: string;
  severity: "better" | "average" | "worse" | "critical";
}

// Readable labels for clause types
export const CLAUSE_LABELS: Record<string, string> = {
  security_deposit: "Security Deposit",
  deposit: "Security Deposit",
  notice_period: "Notice Period",
  notice: "Notice Period",
  lock_in: "Lock-in Period",
  rent_escalation: "Rent Escalation",
  rent: "Rent",
  late_payment: "Late Payment Penalty",
  late_penalty: "Late Payment Penalty",
  penalty: "Penalty",
  maintenance: "Maintenance",
  repair: "Repairs & Maintenance",
  non_compete: "Non-Compete",
  non_solicitation: "Non-Solicitation",
  termination: "Termination",
  confidentiality: "Confidentiality",
  liability: "Liability",
  indemnity: "Indemnity",
  arbitration: "Dispute Resolution",
  dispute_resolution: "Dispute Resolution",
  force_majeure: "Force Majeure",
  subletting: "Subletting",
  renewal: "Renewal",
  payment: "Payment Terms",
  insurance: "Insurance",
  governing_law: "Governing Law",
  intellectual_property: "Intellectual Property",
  warranty: "Warranty",
  probation: "Probation Period",
  salary: "Salary / Compensation",
};