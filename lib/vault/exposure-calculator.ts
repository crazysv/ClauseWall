// ============================================
// EXPOSURE CALCULATOR — Combined Financial Exposure
// Pure TypeScript + optional Groq call for ambiguous values
// ============================================

import type {
  FinancialExposure,
  ContractExposure,
  CategoryExposure,
} from "@/types";

// Mapping from clause types to financial categories
const PAYMENT_CLAUSE_TYPES = [
  "rent", "payment", "emi", "premium", "subscription", "fee", "maintenance",
  "salary", "compensation", "remuneration", "cost", "charge", "dues",
  "installment", "contribution",
];

const DEPOSIT_CLAUSE_TYPES = [
  "security_deposit", "deposit", "advance", "earnest", "caution_money",
  "token_amount", "booking_amount",
];

const PENALTY_CLAUSE_TYPES = [
  "early_termination", "termination_fee", "penalty", "late_payment",
  "breach", "liquidated_damages", "delayed_delivery", "cancellation",
  "forfeiture",
];

function categorizeByType(
  clauseType: string,
  docType: string
): string {
  const ct = clauseType.toLowerCase();
  if (ct.includes("rent") || ct.includes("lease")) return "rent";
  if (ct.includes("emi") || ct.includes("loan") || ct.includes("installment")) return "loan_emi";
  if (ct.includes("insurance") || ct.includes("premium")) return "insurance_premium";
  if (ct.includes("subscription")) return "subscription";
  if (ct.includes("maintenance")) return "maintenance";
  if (ct.includes("utility")) return "utility";
  if (ct.includes("penalty") || ct.includes("fine") || ct.includes("forfeiture")) return "penalty";
  if (ct.includes("deposit") || ct.includes("advance") || ct.includes("security")) return "deposit";
  if (ct.includes("tax")) return "tax_obligation";
  if (ct.includes("salary") || ct.includes("compensation")) return "salary";
  return "other";
}

function isMonthlyClause(clauseType: string, unit: string | null): boolean {
  if (unit) {
    const u = unit.toLowerCase();
    return u.includes("month") || u.includes("per month") || u === "monthly";
  }
  const ct = clauseType.toLowerCase();
  return (
    ct.includes("rent") ||
    ct.includes("emi") ||
    ct.includes("premium") ||
    ct.includes("subscription") ||
    ct.includes("maintenance")
  );
}

interface ExposureInput {
  id: string;
  title: string;
  document_type: string;
  clauses: Array<{
    clause_type: string;
    extracted_value: number | null;
    extracted_unit: string | null;
    risk_level: string;
  }>;
}

/**
 * Calculate combined financial exposure across all contracts.
 * Mostly pure TypeScript — no AI needed.
 */
export function calculateFinancialExposure(
  documents: ExposureInput[]
): FinancialExposure {
  const byContract: ContractExposure[] = [];
  const categoryTotals = new Map<string, { total: number; contracts: Set<string> }>();

  for (const doc of documents) {
    let monthlyObligation = 0;
    let deposits = 0;
    let maxPenalty = 0;

    for (const clause of doc.clauses) {
      if (clause.extracted_value == null || clause.extracted_value <= 0) continue;

      const ct = clause.clause_type.toLowerCase();
      const value = clause.extracted_value;
      const category = categorizeByType(ct, doc.document_type);

      // Classify the value
      const isPayment = PAYMENT_CLAUSE_TYPES.some((p) => ct.includes(p));
      const isDeposit = DEPOSIT_CLAUSE_TYPES.some((d) => ct.includes(d));
      const isPenalty = PENALTY_CLAUSE_TYPES.some((p) => ct.includes(p));

      if (isDeposit) {
        deposits += value;
      } else if (isPenalty) {
        maxPenalty += value;
      } else if (isPayment && isMonthlyClause(ct, clause.extracted_unit)) {
        monthlyObligation += value;
      }

      // Track by category
      if (!categoryTotals.has(category)) {
        categoryTotals.set(category, { total: 0, contracts: new Set() });
      }
      const cat = categoryTotals.get(category)!;
      cat.total += value;
      cat.contracts.add(doc.id);
    }

    const worstCase = monthlyObligation * 12 + deposits + maxPenalty;

    byContract.push({
      document_id: doc.id,
      document_title: doc.title,
      document_type: doc.document_type,
      monthly_obligation: monthlyObligation,
      deposits,
      max_penalty: maxPenalty,
      worst_case_total: worstCase,
    });
  }

  // Build category breakdown
  const byCategory: CategoryExposure[] = [];
  for (const [category, data] of categoryTotals) {
    byCategory.push({
      category,
      total: data.total,
      contracts: Array.from(data.contracts),
    });
  }

  // Sort categories by total (descending)
  byCategory.sort((a, b) => b.total - a.total);

  // Calculate totals
  const totalWorstCase = byContract.reduce((sum, c) => sum + c.worst_case_total, 0);
  const totalMonthly = byContract.reduce((sum, c) => sum + c.monthly_obligation, 0);
  const totalDeposits = byContract.reduce((sum, c) => sum + c.deposits, 0);
  const totalPenalties = byContract.reduce((sum, c) => sum + c.max_penalty, 0);

  return {
    total_worst_case: totalWorstCase,
    total_monthly_obligations: totalMonthly,
    total_deposits_at_risk: totalDeposits,
    total_penalties_possible: totalPenalties,
    by_contract: byContract,
    by_category: byCategory,
  };
}
