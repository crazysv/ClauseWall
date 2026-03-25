// ============================================
// PROBABILITY ENGINE
// Life event base rates (Indian data) + correlations
// ============================================

import type {
  LifeEventType,
  LifeEvent,
  SimulationConfig,
  CorrelationMatrix,
} from "./types";

// ============================================
// INDIAN BASE RATES (annual probabilities)
// Sources: CMIE, NSSO, RERA data, industry averages
// ============================================

export const DEFAULT_EVENT_PROBABILITIES: Record<LifeEventType, number> = {
  jobLoss: 0.07, // 7% annual — CMIE unemployment data
  medicalEmergency: 0.04, // 4% annual — NSSO health survey
  marketDownturn: 0.02, // ~2% annual — averaged across cycles
  landlordDispute: 0.12, // 12% annual — high for rental contracts
  relocation: 0.08, // 8% annual — corporate transfer rate
  relationshipChange: 0.015, // 1.5% annual
  propertyDefect: 0.20, // 20% year 1 — RERA data, drops after
};

// ============================================
// CORRELATION MATRIX
// Event A increases probability of Event B
// ============================================

export const DEFAULT_CORRELATIONS: CorrelationMatrix = {
  jobLoss: {
    medicalEmergency: 0.30, // +30% medical stress
    relationshipChange: 0.15, // +15% relationship strain
  },
  medicalEmergency: {
    jobLoss: 0.20, // +20% job loss risk
  },
  marketDownturn: {
    jobLoss: 0.50, // +50% job loss during downturn
  },
  landlordDispute: {
    relocation: 0.25, // +25% relocation chance
  },
  relocation: {
    landlordDispute: 0.15, // +15% dispute chance
  },
};

// ============================================
// MONTHLY PROBABILITY CONVERSION
// ============================================

/**
 * Convert annual probability to monthly.
 * P(monthly) = 1 - (1 - P(annual))^(1/12)
 */
export function annualToMonthly(annualProb: number): number {
  return 1 - Math.pow(1 - annualProb, 1 / 12);
}

// ============================================
// EVENT GENERATION
// ============================================

/**
 * Generate life events for a given month, applying correlation modifiers.
 */
export function generateMonthlyEvents(
  month: number,
  config: SimulationConfig,
  activeCorrelations: Record<string, number>
): LifeEvent[] {
  const events: LifeEvent[] = [];

  for (const [eventType, annualProb] of Object.entries(
    config.eventProbabilities
  )) {
    // Convert annual to monthly
    let monthlyProb = annualToMonthly(annualProb);

    // Apply correlation modifiers from previously triggered events
    if (activeCorrelations[eventType]) {
      monthlyProb *= 1 + activeCorrelations[eventType];
      monthlyProb = Math.min(monthlyProb, 0.5); // cap at 50% monthly
    }

    // Special handling: propertyDefect drops after year 1
    if (eventType === "propertyDefect" && month > 12) {
      monthlyProb *= 0.25; // drops to 25% of base rate after year 1
    }

    if (Math.random() < monthlyProb) {
      events.push({
        type: eventType as LifeEventType,
        month,
        probability: monthlyProb,
      });
    }
  }

  return events;
}

/**
 * Update active correlation modifiers when an event fires.
 * Correlations decay over time (halved each month, cleared after 6 months).
 */
export function updateCorrelations(
  activeCorrelations: Record<string, number>,
  event: LifeEvent,
  correlationMatrix: CorrelationMatrix
): void {
  const effects = correlationMatrix[event.type];
  if (!effects) return;

  for (const [targetEvent, modifier] of Object.entries(effects)) {
    // Stack correlations but cap at 1.0 (100% increase)
    const current = activeCorrelations[targetEvent] || 0;
    activeCorrelations[targetEvent] = Math.min(current + modifier, 1.0);
  }
}

/**
 * Decay correlations each month (multiply remaining by 0.7).
 * Remove correlations that have decayed below threshold.
 */
export function decayCorrelations(
  activeCorrelations: Record<string, number>
): void {
  for (const key of Object.keys(activeCorrelations)) {
    activeCorrelations[key] *= 0.7;
    if (activeCorrelations[key] < 0.01) {
      delete activeCorrelations[key];
    }
  }
}

/**
 * Build default simulation config with sensible Indian defaults.
 */
export function buildDefaultConfig(
  overrides?: Partial<SimulationConfig>
): SimulationConfig {
  return {
    iterations: 10000,
    months: 36,
    baseMonthlyCost: 20000, // ₹20,000 default
    monthlyIncome: 60000, // ₹60,000 default
    eventProbabilities: { ...DEFAULT_EVENT_PROBABILITIES },
    correlations: { ...DEFAULT_CORRELATIONS },
    documentType: "rental",
    jurisdiction: "pan_india",
    ...overrides,
  };
}
