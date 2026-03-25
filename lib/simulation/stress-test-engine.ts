// ============================================
// STRESS TEST ENGINE
// 7 preset Indian-context scenarios + custom builder
// ============================================

import type { Clause, StructuredRule } from "@/types";
import type {
  StressScenario,
  StressTestResult,
  StressTestClauseResult,
  StressScenarioEvent,
  SimulationConfig,
} from "./types";
import { buildClauseCostMap, getTriggeredClauses } from "./clause-cost-engine";
import { buildDefaultConfig } from "./probability-engine";

// ============================================
// 7 PRESET SCENARIOS (Indian Context)
// ============================================

export const PRESET_SCENARIOS: StressScenario[] = [
  {
    id: "job-loss-6",
    label: "Job Loss in Month 6",
    description: "You lose your job 6 months into the contract. Triggers rental breaks, deposit forfeiture, EMI defaults, and credit impact.",
    icon: "💼",
    events: [{ type: "jobLoss", month: 6 }],
    cascadeDescription: "Rental break + deposit forfeiture + EMI default + insurance lapse + credit score hit",
  },
  {
    id: "medical-12",
    label: "Medical Emergency in Month 12",
    description: "A serious medical emergency at the 1-year mark. Income pauses, loan defaults, insurance claims needed.",
    icon: "🏥",
    events: [{ type: "medicalEmergency", month: 12 }],
    cascadeDescription: "Income pause + loan default + insurance claim + potential job loss",
  },
  {
    id: "city-transfer-8",
    label: "City Transfer in Month 8",
    description: "Suddenly transferred to another city by employer. Must break lease, pay lock-in, lose deposit.",
    icon: "✈️",
    events: [{ type: "relocation", month: 8 }],
    cascadeDescription: "Lease break + lock-in penalty + notice period + auto-renewal trap + deposit loss",
  },
  {
    id: "property-defects-3",
    label: "Property Defects in Month 3",
    description: "Major structural or quality defects discovered early. RERA claims vs liability caps, repair disputes.",
    icon: "🏗️",
    events: [{ type: "propertyDefect", month: 3 }],
    cascadeDescription: "RERA claim vs liability cap + repair costs + habitability dispute + rent withholding",
  },
  {
    id: "business-failure-18",
    label: "Startup Failure in Month 18",
    description: "Your business fails halfway through. Triggers non-compete, loan acceleration, guarantor liability.",
    icon: "💸",
    events: [
      { type: "jobLoss", month: 18 },
      { type: "marketDownturn", month: 18 },
    ],
    cascadeDescription: "Non-compete activation + loan acceleration + guarantor liability",
  },
  {
    id: "separation-15",
    label: "Divorce/Separation in Month 15",
    description: "Relationship change affecting joint contracts. Joint liability splits, property division costs.",
    icon: "💔",
    events: [{ type: "relationshipChange", month: 15 }],
    cascadeDescription: "Joint liability clauses + property division + lease modification costs",
  },
  {
    id: "recession-10",
    label: "Economic Recession in Month 10",
    description: "Market downturn hits, then job loss follows. Income drops while rent escalation continues.",
    icon: "📉",
    events: [
      { type: "marketDownturn", month: 10 },
      { type: "jobLoss", month: 12 },
    ],
    cascadeDescription: "Income drop + rent escalation still applies + penalty accumulation + credit spiral",
  },
];

// ============================================
// RUN STRESS TEST
// ============================================

/**
 * Run a single stress test scenario.
 * Evaluates which clauses are triggered and calculates costs.
 */
export function runStressTest(
  scenario: StressScenario,
  clauses: Clause[],
  fairRules: StructuredRule[],
  configOverrides?: Partial<SimulationConfig>
): StressTestResult {
  const config = buildDefaultConfig(configOverrides);
  const clauseCostMap = buildClauseCostMap(clauses, fairRules);
  const triggeredClauses: StressTestClauseResult[] = [];

  let totalCurrentCost = 0;
  let totalFairCost = 0;

  for (const scenarioEvent of scenario.events) {
    const event = {
      type: scenarioEvent.type,
      month: scenarioEvent.month,
      probability: 1.0, // forced event
    };

    const triggered = getTriggeredClauses(clauseCostMap, event.type);

    for (const mapping of triggered) {
      const currentCost = mapping.costFunction(
        event,
        scenarioEvent.month,
        config.months,
        config.baseMonthlyCost,
        config.monthlyIncome
      );

      const fairCost = mapping.fairCostFunction(
        event,
        scenarioEvent.month,
        config.months,
        config.baseMonthlyCost,
        config.monthlyIncome
      );

      if (currentCost > 0 || fairCost > 0) {
        triggeredClauses.push({
          clauseNumber: mapping.clause.clause_number,
          clauseType: mapping.clause.clause_type,
          triggerEvent: event.type,
          currentCost,
          fairCost,
          predatoryPremium: currentCost - fairCost,
          originalText: mapping.clause.original_text,
        });

        totalCurrentCost += currentCost;
        totalFairCost += fairCost;
      }
    }
  }

  // Sort by cost descending
  triggeredClauses.sort((a, b) => b.currentCost - a.currentCost);

  return {
    scenario,
    triggeredClauses,
    totalCurrentCost,
    totalFairCost,
    totalPredatoryPremium: totalCurrentCost - totalFairCost,
  };
}

/**
 * Build a custom stress scenario from user input.
 */
export function buildCustomScenario(
  events: StressScenarioEvent[]
): StressScenario {
  const eventLabels = events.map(
    (e) =>
      `${LIFE_EVENT_LABELS[e.type] || e.type} in month ${e.month}`
  );

  return {
    id: "custom",
    label: "Custom Scenario",
    description: eventLabels.join(" + "),
    icon: "🎯",
    events,
    cascadeDescription: "User-defined event combination",
  };
}

export const LIFE_EVENT_LABELS: Record<string, string> = {
  jobLoss: "Job Loss",
  medicalEmergency: "Medical Emergency",
  marketDownturn: "Market Downturn",
  landlordDispute: "Landlord Dispute",
  relocation: "Relocation/Transfer",
  relationshipChange: "Relationship Change",
  propertyDefect: "Property Defect",
};
