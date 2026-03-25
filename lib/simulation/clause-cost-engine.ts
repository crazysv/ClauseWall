// ============================================
// CLAUSE-TO-COST MAPPING ENGINE
// Maps clause types → triggering events → cost functions
// ============================================

import type { Clause, StructuredRule } from "@/types";
import type {
  LifeEventType,
  LifeEvent,
  ClauseCostMapping,
} from "./types";

// ============================================
// CLAUSE → EVENT TRIGGER MAP
// ============================================

export const CLAUSE_EVENT_TRIGGERS: Record<string, LifeEventType[]> = {
  security_deposit: ["jobLoss", "relocation", "landlordDispute"],
  notice_period: ["jobLoss", "relocation", "medicalEmergency"],
  termination_notice: ["jobLoss", "relocation", "medicalEmergency"],
  lock_in_period: ["jobLoss", "relocation", "relationshipChange"],
  termination_clause: ["jobLoss", "relocation", "medicalEmergency", "relationshipChange"],
  termination: ["jobLoss", "relocation", "medicalEmergency", "relationshipChange"],
  penalty_clause: ["jobLoss", "medicalEmergency", "relocation"],
  penalties: ["jobLoss", "medicalEmergency", "relocation"],
  late_payment: ["jobLoss", "medicalEmergency", "marketDownturn"],
  late_fees: ["jobLoss", "medicalEmergency", "marketDownturn"],
  late_payment_charges: ["jobLoss", "medicalEmergency", "marketDownturn"],
  liability_limitation: ["propertyDefect", "landlordDispute"],
  liability_waiver: ["propertyDefect", "landlordDispute"],
  non_compete: ["jobLoss"],
  non_solicitation: ["jobLoss"],
  liquidated_damages: ["jobLoss", "relocation", "medicalEmergency"],
  auto_renewal: ["relocation", "jobLoss"],
  renewal_terms: ["relocation", "jobLoss"],
  rent_escalation: ["marketDownturn"],
  rent_payment: ["jobLoss", "medicalEmergency", "marketDownturn"],
  maintenance_charges: ["propertyDefect", "landlordDispute"],
  indemnity: ["propertyDefect", "landlordDispute"],
  indemnification: ["propertyDefect", "landlordDispute"],
  arbitration: ["landlordDispute", "propertyDefect"],
  jurisdiction: ["landlordDispute", "relocation"],
  force_majeure: ["marketDownturn", "medicalEmergency"],
  confidentiality: ["jobLoss"],
  intellectual_property: ["jobLoss"],
  warranty: ["propertyDefect"],
  insurance_requirement: ["medicalEmergency", "propertyDefect"],
  insurance_bundling: ["medicalEmergency", "propertyDefect"],
  subletting: ["relocation"],
  modification: ["landlordDispute"],
  modification_rights: ["landlordDispute"],
  assignment: ["relationshipChange", "jobLoss"],
  governing_law: ["landlordDispute"],
  dispute_resolution: ["landlordDispute", "propertyDefect"],
  data_privacy: [],
  consent_clauses: [],
  payment_terms: ["jobLoss", "medicalEmergency", "marketDownturn"],
  delivery_terms: ["marketDownturn"],
  guarantor: ["jobLoss", "marketDownturn"],
  collateral: ["jobLoss", "marketDownturn"],
  prepayment_penalty: ["jobLoss", "relocation"],
  training_bond: ["jobLoss", "relocation"],
  relieving_terms: ["jobLoss"],
  probation: ["jobLoss"],
  compensation_salary: [],
  variable_pay_bonus: ["jobLoss"],
  benefits_pf_esi: [],
  leave_policy: [],
  working_hours: [],
  background_check: [],
  interest_rate: ["jobLoss", "medicalEmergency", "marketDownturn"],
  processing_fees: [],
  loan_recall: ["jobLoss", "marketDownturn"],
  disbursement: [],
  emi_schedule: ["jobLoss", "medicalEmergency", "marketDownturn"],
  cancellation_refund: ["relocation", "medicalEmergency"],
  society_rules: [],
  pets_restrictions: [],
  visitor_restrictions: [],
  repair_responsibility: ["propertyDefect"],
  painting_charges: ["relocation", "jobLoss"],
  possession_handover: ["relocation"],
  notice_requirements: ["jobLoss", "relocation", "medicalEmergency"],
  severability: [],
  entire_agreement: [],
  general: [],
};

// ============================================
// COST FUNCTIONS BY CLAUSE TYPE
// ============================================

type CostFn = (
  extractedValue: number | null,
  event: LifeEvent,
  month: number,
  totalMonths: number,
  baseMonthlyCost: number,
  monthlyIncome: number
) => number;

const COST_FUNCTIONS: Record<string, CostFn> = {
  security_deposit: (ev, _event, month, totalMonths, baseMonthlyCost) => {
    const depositAmount = ev || baseMonthlyCost * 2;
    // Forfeiture rate depends on how early they leave
    const progressRatio = month / totalMonths;
    const forfeitureRate = progressRatio < 0.3 ? 1.0 : progressRatio < 0.7 ? 0.5 : 0.2;
    return depositAmount * forfeitureRate;
  },

  lock_in_period: (ev, _event, month, _totalMonths, baseMonthlyCost) => {
    const lockInMonths = ev || 11;
    const remaining = Math.max(0, lockInMonths - month);
    return remaining > 0 ? baseMonthlyCost * remaining : 0;
  },

  notice_period: (ev, _event, _month, _totalMonths, baseMonthlyCost) => {
    const noticePeriodMonths = ev || 1;
    return baseMonthlyCost * noticePeriodMonths;
  },

  termination_notice: (ev, _event, _month, _totalMonths, baseMonthlyCost) => {
    const noticePeriodMonths = ev || 1;
    return baseMonthlyCost * noticePeriodMonths;
  },

  termination_clause: (ev, _event, _month, _totalMonths, baseMonthlyCost) => {
    return ev || baseMonthlyCost * 2;
  },

  termination: (ev, _event, _month, _totalMonths, baseMonthlyCost) => {
    return ev || baseMonthlyCost * 2;
  },

  penalty_clause: (ev, _event, _month, _totalMonths, baseMonthlyCost) => {
    return ev || baseMonthlyCost * 1.5;
  },

  penalties: (ev, _event, _month, _totalMonths, baseMonthlyCost) => {
    return ev || baseMonthlyCost * 1.5;
  },

  late_payment: (ev, _event, _month, _totalMonths, baseMonthlyCost) => {
    const interestRate = ev || 18; // % per annum
    const missedMonths = 1 + Math.floor(Math.random() * 5);
    return (interestRate / 100 / 12) * baseMonthlyCost * missedMonths * missedMonths;
  },

  late_fees: (ev, _event, _month, _totalMonths, baseMonthlyCost) => {
    const interestRate = ev || 18;
    const missedMonths = 1 + Math.floor(Math.random() * 5);
    return (interestRate / 100 / 12) * baseMonthlyCost * missedMonths * missedMonths;
  },

  late_payment_charges: (ev, _event, _month, _totalMonths, baseMonthlyCost) => {
    const interestRate = ev || 18;
    const missedMonths = 1 + Math.floor(Math.random() * 5);
    return (interestRate / 100 / 12) * baseMonthlyCost * missedMonths * missedMonths;
  },

  non_compete: (ev, _event, _month, _totalMonths, _baseMonthlyCost, monthlyIncome) => {
    const restrictionMonths = ev || 12;
    const income = monthlyIncome || _baseMonthlyCost * 3;
    return income * restrictionMonths * 0.5; // 50% income lost
  },

  non_solicitation: (ev, _event, _month, _totalMonths, _baseMonthlyCost, monthlyIncome) => {
    const restrictionMonths = ev || 6;
    const income = monthlyIncome || _baseMonthlyCost * 3;
    return income * restrictionMonths * 0.2; // 20% opportunity cost
  },

  auto_renewal: (ev, _event, _month, _totalMonths, baseMonthlyCost) => {
    const renewalTerm = ev || 12;
    // 30% chance of being trapped in renewal
    return Math.random() < 0.3 ? baseMonthlyCost * renewalTerm : 0;
  },

  renewal_terms: (ev, _event, _month, _totalMonths, baseMonthlyCost) => {
    const renewalTerm = ev || 12;
    return Math.random() < 0.3 ? baseMonthlyCost * renewalTerm : 0;
  },

  rent_escalation: (ev, _event, month, totalMonths, baseMonthlyCost) => {
    const escalationPercent = ev || 10; // % per year
    const monthlyRate = Math.pow(1 + escalationPercent / 100, 1 / 12) - 1;
    const remaining = totalMonths - month;
    let totalExtra = 0;
    for (let m = 0; m < remaining; m++) {
      totalExtra += baseMonthlyCost * (Math.pow(1 + monthlyRate, month + m) - 1);
    }
    return Math.min(totalExtra, baseMonthlyCost * remaining * 0.5); // cap
  },

  rent_payment: (ev, _event, _month, _totalMonths, baseMonthlyCost) => {
    // Risk of missing rent payments
    const missedMonths = 1 + Math.floor(Math.random() * 3);
    return (ev || baseMonthlyCost) * missedMonths * 0.1; // penalty portion
  },

  liability_limitation: (ev, _event, _month, _totalMonths, baseMonthlyCost) => {
    const cappedLiability = ev || baseMonthlyCost * 3;
    const actualDamages = baseMonthlyCost * 6 + Math.random() * baseMonthlyCost * 6;
    return Math.max(0, actualDamages - cappedLiability);
  },

  liability_waiver: (_ev, _event, _month, _totalMonths, baseMonthlyCost) => {
    return baseMonthlyCost * 4 * Math.random(); // uncovered damage
  },

  indemnity: (ev, _event, _month, _totalMonths, baseMonthlyCost) => {
    return ev || baseMonthlyCost * 6;
  },

  indemnification: (ev, _event, _month, _totalMonths, baseMonthlyCost) => {
    return ev || baseMonthlyCost * 6;
  },

  arbitration: (_ev, _event, _month, _totalMonths, baseMonthlyCost) => {
    return baseMonthlyCost * 1.5 + 25000; // arbitration fees + travel
  },

  force_majeure: (ev, _event, _month, _totalMonths, baseMonthlyCost) => {
    // Continued obligations despite force majeure
    const months = ev || 3;
    return baseMonthlyCost * months * 0.5;
  },

  maintenance_charges: (ev, _event, _month, _totalMonths, baseMonthlyCost) => {
    return ev || baseMonthlyCost * 0.5;
  },

  training_bond: (ev, _event, month, _totalMonths, _baseMonthlyCost) => {
    const bondAmount = ev || 200000;
    // Prorated by time served
    const servedRatio = month / 24; // typical 2yr bond
    return bondAmount * Math.max(0, 1 - servedRatio);
  },

  prepayment_penalty: (ev, _event, _month, _totalMonths, baseMonthlyCost) => {
    return ev || baseMonthlyCost * 3; // typical prepayment penalty
  },

  guarantor: (ev, _event, _month, _totalMonths, baseMonthlyCost) => {
    return ev || baseMonthlyCost * 6; // guarantor liability
  },

  collateral: (ev, _event, _month, _totalMonths, baseMonthlyCost) => {
    return ev || baseMonthlyCost * 12; // collateral seizure risk
  },

  interest_rate: (ev, _event, _month, _totalMonths, baseMonthlyCost) => {
    const rate = ev || 18;
    const missedMonths = 1 + Math.floor(Math.random() * 4);
    return (rate / 100 / 12) * baseMonthlyCost * missedMonths * missedMonths;
  },

  loan_recall: (ev, _event, _month, _totalMonths, baseMonthlyCost) => {
    return ev || baseMonthlyCost * 12; // full loan recall
  },

  emi_schedule: (_ev, _event, _month, _totalMonths, baseMonthlyCost) => {
    const missedMonths = 1 + Math.floor(Math.random() * 3);
    return baseMonthlyCost * missedMonths * 0.15; // late EMI penalties
  },

  cancellation_refund: (ev, _event, _month, _totalMonths, baseMonthlyCost) => {
    return ev || baseMonthlyCost * 2; // non-refundable amount
  },

  painting_charges: (ev, _event, _month, _totalMonths, baseMonthlyCost) => {
    return ev || baseMonthlyCost * 0.5;
  },

  subletting: (_ev, _event, _month, _totalMonths, baseMonthlyCost) => {
    return baseMonthlyCost * 2; // penalty for subletting
  },

  jurisdiction: (_ev, _event, _month, _totalMonths, _baseMonthlyCost) => {
    return 50000; // travel + legal costs for distant jurisdiction
  },

  insurance_requirement: (ev, _event, _month, _totalMonths, _baseMonthlyCost) => {
    return ev || 30000; // mandated insurance cost
  },

  insurance_bundling: (ev, _event, _month, _totalMonths, _baseMonthlyCost) => {
    return ev || 25000; // bundled insurance premium
  },

  warranty: (ev, _event, _month, _totalMonths, baseMonthlyCost) => {
    return ev || baseMonthlyCost * 2; // warranty claim failure
  },

  repair_responsibility: (ev, _event, _month, _totalMonths, baseMonthlyCost) => {
    return ev || baseMonthlyCost * 1.5;
  },

  possession_handover: (_ev, _event, _month, _totalMonths, baseMonthlyCost) => {
    return baseMonthlyCost * 0.5; // delayed handover costs
  },

  relieving_terms: (ev, _event, _month, _totalMonths, _baseMonthlyCost, monthlyIncome) => {
    const delayMonths = ev || 3;
    return (monthlyIncome || _baseMonthlyCost * 3) * delayMonths * 0.3;
  },

  variable_pay_bonus: (ev, _event, _month, _totalMonths, _baseMonthlyCost, monthlyIncome) => {
    return ev || (monthlyIncome || _baseMonthlyCost * 3) * 2; // forfeited bonus
  },

  payment_terms: (_ev, _event, _month, _totalMonths, baseMonthlyCost) => {
    return baseMonthlyCost * 0.5; // unfavorable payment terms
  },

  confidentiality: (_ev, _event, _month, _totalMonths, _baseMonthlyCost, monthlyIncome) => {
    return (monthlyIncome || _baseMonthlyCost * 3) * 3; // breach penalty
  },

  intellectual_property: (_ev, _event, _month, _totalMonths, _baseMonthlyCost, monthlyIncome) => {
    return (monthlyIncome || _baseMonthlyCost * 3) * 6; // IP claim
  },
};

// Default cost function for unmapped clause types
const DEFAULT_COST_FN: CostFn = (
  ev,
  _event,
  _month,
  _totalMonths,
  baseMonthlyCost
) => {
  return ev || baseMonthlyCost * 0.5;
};

// ============================================
// FAIR COST DEFAULTS
// When structured_rules.limit_value is used
// ============================================

const FAIR_DEFAULTS: Record<string, number> = {
  security_deposit: 2, // 2 months max
  lock_in_period: 6, // 6 months fair
  notice_period: 1, // 1 month fair
  termination_notice: 1,
  late_payment: 9, // 9% fair interest
  late_fees: 9,
  late_payment_charges: 9,
  non_compete: 6, // 6 months max
  non_solicitation: 3,
  auto_renewal: 0, // no auto-renewal is fair
  renewal_terms: 0,
  rent_escalation: 5, // 5% max
  training_bond: 100000,
  prepayment_penalty: 0,
  arbitration: 0, // court access is fair
};

// ============================================
// BUILD CLAUSE COST MAP
// ============================================

/**
 * Build a cost mapping for all clauses in a document.
 */
export function buildClauseCostMap(
  clauses: Clause[],
  fairRules?: StructuredRule[]
): ClauseCostMapping[] {
  const ruleMap = new Map<string, StructuredRule>();
  if (fairRules) {
    for (const rule of fairRules) {
      if (!ruleMap.has(rule.clause_type)) {
        ruleMap.set(rule.clause_type, rule);
      }
    }
  }

  return clauses.map((clause) => {
    const clauseType = normalizeClauseType(clause.clause_type);
    const triggerEvents = CLAUSE_EVENT_TRIGGERS[clauseType] || [];
    const costFn = COST_FUNCTIONS[clauseType] || DEFAULT_COST_FN;
    const fairRule = ruleMap.get(clause.clause_type);
    const fairValue = fairRule?.limit_value ?? FAIR_DEFAULTS[clauseType] ?? null;
    const fairUnit = fairRule?.limit_unit ?? clause.extracted_unit;

    return {
      clause,
      clauseType,
      triggerEvents,
      costFunction: (
        event: LifeEvent,
        month: number,
        totalMonths: number,
        baseMonthlyCost: number,
        monthlyIncome: number
      ) =>
        costFn(
          clause.extracted_value,
          event,
          month,
          totalMonths,
          baseMonthlyCost,
          monthlyIncome
        ),
      fairCostFunction: (
        event: LifeEvent,
        month: number,
        totalMonths: number,
        baseMonthlyCost: number,
        monthlyIncome: number
      ) =>
        costFn(
          fairValue,
          event,
          month,
          totalMonths,
          baseMonthlyCost,
          monthlyIncome
        ),
      extractedValue: clause.extracted_value,
      extractedUnit: clause.extracted_unit,
      fairValue,
      fairUnit,
    };
  });
}

/**
 * Get triggered clauses for a given event type.
 */
export function getTriggeredClauses(
  clauseCostMap: ClauseCostMapping[],
  eventType: LifeEventType
): ClauseCostMapping[] {
  return clauseCostMap.filter((mapping) =>
    mapping.triggerEvents.includes(eventType)
  );
}

/**
 * Normalize clause type to match our trigger map keys.
 */
function normalizeClauseType(clauseType: string): string {
  return clauseType.toLowerCase().replace(/[\s-]+/g, "_");
}
