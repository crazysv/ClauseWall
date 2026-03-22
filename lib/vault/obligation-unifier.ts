// ============================================
// OBLIGATION UNIFIER — Unify obligations across contracts
// Pure TypeScript, NO AI calls
// ============================================

import type {
  UnifiedObligation,
  RiskLevel,
  TemporalExtractionResult,
} from "@/types";

// Clause type classification
const PAYMENT_KEYWORDS = [
  "payment", "rent", "emi", "premium", "fee", "deposit", "charge",
  "cost", "salary", "compensation", "dues", "installment", "maintenance",
  "subscription", "advance", "refund",
];

const ACTION_KEYWORDS = [
  "notice", "maintenance", "reporting", "compliance", "renewal",
  "registration", "filing", "declaration", "inspection", "audit",
  "review", "approval", "consent",
];

const RESTRICTION_KEYWORDS = [
  "non_compete", "non-compete", "exclusivity", "confidentiality",
  "restriction", "prohibited", "non_solicitation", "non-solicitation",
  "restraint", "limitation", "embargo",
];

const RISK_ORDER: Record<RiskLevel, number> = {
  illegal: 0,
  dangerous: 1,
  warning: 2,
  safe: 3,
};

function classifyObligationType(
  clauseType: string
): "payment" | "action" | "restriction" | "deadline" {
  const ct = clauseType.toLowerCase();

  if (PAYMENT_KEYWORDS.some((k) => ct.includes(k))) return "payment";
  if (RESTRICTION_KEYWORDS.some((k) => ct.includes(k))) return "restriction";
  if (ACTION_KEYWORDS.some((k) => ct.includes(k))) return "action";
  return "action"; // Default to action
}

function guessFrequency(
  clauseType: string,
  unit: string | null
): UnifiedObligation["frequency"] {
  if (unit) {
    const u = unit.toLowerCase();
    if (u.includes("month")) return "monthly";
    if (u.includes("year") || u.includes("annual")) return "annual";
    if (u.includes("quarter")) return "quarterly";
    if (u.includes("week")) return "weekly";
    if (u.includes("one") || u.includes("lump")) return "one_time";
    if (u.includes("semi")) return "semi_annual";
    if (u.includes("day") || u.includes("daily")) return "daily";
  }

  const ct = clauseType.toLowerCase();
  if (ct.includes("rent") || ct.includes("emi") || ct.includes("premium")) return "monthly";
  if (ct.includes("annual") || ct.includes("yearly")) return "annual";
  if (ct.includes("quarterly")) return "quarterly";
  if (ct.includes("deposit") || ct.includes("advance")) return "one_time";

  return "on_event";
}

function buildRiskIfMissed(
  clauseType: string,
  riskLevel: RiskLevel
): string {
  const ct = clauseType.toLowerCase();

  if (ct.includes("rent")) return "Late fees, potential eviction notice, forfeiture of security deposit.";
  if (ct.includes("emi") || ct.includes("loan")) return "Late payment charges, negative credit score impact, potential legal action.";
  if (ct.includes("insurance") || ct.includes("premium")) return "Policy lapse, loss of coverage, waiting period restart.";
  if (ct.includes("non_compete") || ct.includes("non-compete")) return "Breach of contract, potential injunction, damages claim.";
  if (ct.includes("notice")) return "Automatic renewal, penalty charges, forfeiture of rights.";
  if (ct.includes("confidentiality")) return "Breach of contract, damages claim, injunction.";
  if (ct.includes("deposit")) return "Loss of deposit amount, delayed refund.";

  if (riskLevel === "illegal") return "Potential legal consequences under applicable Indian law.";
  if (riskLevel === "dangerous") return "Significant financial or legal risk if not addressed.";
  if (riskLevel === "warning") return "Moderate risk, should be addressed to protect interests.";
  return "Low risk, but should be fulfilled as agreed.";
}

interface ObligationInput {
  id: string;
  title: string;
  document_type: string;
  clauses: Array<{
    clause_number: number;
    original_text: string;
    clause_type: string;
    risk_level: string;
    extracted_value: number | null;
    extracted_unit: string | null;
  }>;
  temporal_data: TemporalExtractionResult | null;
}

/**
 * Unify obligations from all contracts into a single view.
 * Pure TypeScript — no AI calls.
 */
export function unifyObligations(
  documents: ObligationInput[]
): UnifiedObligation[] {
  const obligations: UnifiedObligation[] = [];

  for (const doc of documents) {
    // 1. Extract obligations from clauses
    for (const clause of doc.clauses) {
      const obligationType = classifyObligationType(clause.clause_type);
      const riskLevel = (clause.risk_level as RiskLevel) || "safe";

      // Skip safe clauses that aren't payments or restrictions
      if (
        riskLevel === "safe" &&
        obligationType !== "payment" &&
        obligationType !== "restriction"
      ) {
        continue;
      }

      const frequency = guessFrequency(clause.clause_type, clause.extracted_unit);

      obligations.push({
        id: crypto.randomUUID(),
        document_id: doc.id,
        document_title: doc.title,
        document_type: doc.document_type,
        obligation_type: obligationType,
        title: `${clause.clause_type.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())} — Clause ${clause.clause_number}`,
        description: clause.original_text.slice(0, 300),
        frequency,
        amount:
          clause.extracted_value != null && clause.extracted_value > 0
            ? clause.extracted_value
            : null,
        next_due: null, // Will be populated from temporal_data if available
        risk_if_missed: buildRiskIfMissed(clause.clause_type, riskLevel),
        risk_level: riskLevel,
      });
    }

    // 2. Extract deadline obligations from temporal_data
    if (doc.temporal_data && doc.temporal_data.deadlines) {
      for (const deadline of doc.temporal_data.deadlines) {
        obligations.push({
          id: crypto.randomUUID(),
          document_id: doc.id,
          document_title: doc.title,
          document_type: doc.document_type,
          obligation_type: "deadline",
          title: deadline.title,
          description: deadline.description || deadline.action_required,
          frequency: deadline.is_recurring
            ? "monthly" // Simplified — could be improved
            : "one_time",
          amount:
            deadline.financial_impact != null ? deadline.financial_impact : null,
          next_due: null, // Relative dates — would need signing date to compute
          risk_if_missed: deadline.consequence_if_missed || "Deadline missed — review impact.",
          risk_level:
            deadline.consequence_severity === "catastrophic"
              ? "illegal"
              : deadline.consequence_severity === "major"
              ? "dangerous"
              : deadline.consequence_severity === "moderate"
              ? "warning"
              : "safe",
        });
      }
    }
  }

  // Sort obligations:
  // 1. Risk level (illegal > dangerous > warning > safe)
  // 2. Amount (highest first)
  obligations.sort((a, b) => {
    const riskA = RISK_ORDER[a.risk_level] ?? 4;
    const riskB = RISK_ORDER[b.risk_level] ?? 4;
    if (riskA !== riskB) return riskA - riskB;
    return (b.amount ?? 0) - (a.amount ?? 0);
  });

  return obligations;
}
