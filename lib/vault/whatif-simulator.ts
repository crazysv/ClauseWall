// ============================================
// WHAT-IF SIMULATOR — Scenario Impact Analysis
// Uses Groq AI to simulate life events against contracts
// ============================================

import { callGroq } from "@/lib/ai/groq-client";
import type {
  WhatIfScenario,
  WhatIfResult,
  WhatIfContractImpact,
  WhatIfTimelineStep,
} from "@/types";

const SCENARIO_TITLES: Record<WhatIfScenario, string> = {
  job_loss: "Job Loss",
  city_relocation: "City Relocation",
  marriage: "Marriage",
  divorce: "Divorce",
  child_birth: "Child Birth",
  disability: "Permanent Disability",
  hospitalization: "Extended Hospitalization",
  business_start: "Starting a Business",
  property_purchase: "Property Purchase",
  loan_default: "Loan Default",
  death: "Death (Impact on Dependents)",
  retirement: "Voluntary Retirement",
  company_acquisition: "Company Acquisition",
  lawsuit: "Getting Sued",
  natural_disaster: "Natural Disaster",
  custom: "Custom Scenario",
};

const SCENARIO_DESCRIPTIONS: Record<WhatIfScenario, string> = {
  job_loss: "The person loses their job (terminated without cause)",
  city_relocation: "The person must move to a different city in India",
  marriage: "The person gets married",
  divorce: "The person gets divorced",
  child_birth: "The person has a child",
  disability: "The person becomes permanently partially disabled",
  hospitalization: "The person is hospitalized for 3 months",
  business_start: "The person wants to start their own business",
  property_purchase: "The person wants to buy a house",
  loan_default: "The person defaults on their largest loan EMI",
  death: "The person dies (impact on dependents/nominees)",
  retirement: "The person retires (voluntary at age 58)",
  company_acquisition: "The person's employer gets acquired by another company",
  lawsuit: "The person gets sued by a former client/employer",
  natural_disaster: "The person's rented property is damaged in a flood",
  custom: "Custom scenario",
};

const WHATIF_SCENARIO_PROMPT = `You are an Indian legal scenario analyst. Given a life event and a person's active contracts, analyze the impact of that event on EVERY contract.

For the given scenario:
1. Which contracts are affected and how?
2. Which clauses get triggered?
3. What is the financial impact?
4. What rights does the person lose?
5. What rights does the person gain?
6. Create a day-by-day timeline of what happens (Day 0, Day 7, Day 30, Day 90, Day 180, Day 365)
7. What immediate actions should the person take?
8. How well protected is this person? (0-100 score)

Consider Indian-specific implications:
- Labour law protections (can't fire during medical leave under certain conditions)
- Maternity Benefit Act 1961 (26 weeks maternity leave)
- Payment of Gratuity Act 1972 (5 year vesting)
- Transfer of Property Act (rental protections)
- RERA protections for real estate
- Insurance Regulatory requirements (claim settlement timelines)
- RBI guidelines for loan restructuring
- Consumer Protection Act 2019

For each affected contract, provide:
- document_id: same ID as input
- document_title: same title as input
- document_type: same type as input
- impact_level: terminated/breached/modified/unaffected
- impact_description: what happens to this contract
- financial_impact: rupee amount (null if not quantifiable)
- clauses_triggered: array of clause texts that activate
- rights_lost: array of rights the person loses
- rights_gained: array of rights the person gains (under Indian law)

For the timeline:
- day: integer (0, 7, 30, 90, 180, 365)
- title: what happens
- description: details
- contracts_affected: which contract IDs
- financial_impact: rupee amount for this step (null if not quantifiable)
- action_required: what the person should do (null if nothing)

Overall:
- overall_severity: devastating/severe/moderate/manageable/minimal
- protection_score: 0-100 (how well protected this person is for this scenario)
- total_financial_impact: total rupee impact across all contracts
- immediate_actions: array of things to do RIGHT NOW

Be thorough but realistic. Don't invent impacts that aren't supported by the contract clauses.

Respond in JSON matching this structure:
{
  "affected_contracts": [...],
  "total_financial_impact": number,
  "immediate_actions": [...],
  "timeline": [...],
  "overall_severity": string,
  "protection_score": number
}`;

interface WhatIfInput {
  id: string;
  title: string;
  document_type: string;
  entity_name: string | null;
  jurisdiction: string;
  clauses: Array<{
    clause_number: number;
    original_text: string;
    clause_type: string;
    risk_level: string;
  }>;
  overall_risk_score: number;
}

/**
 * Simulate a what-if scenario against all contracts using Groq AI.
 */
export async function simulateWhatIf(
  scenario: WhatIfScenario,
  customDescription: string | null,
  documents: WhatIfInput[]
): Promise<WhatIfResult> {
  const scenarioTitle = SCENARIO_TITLES[scenario] || "Custom Scenario";
  const scenarioDescription =
    scenario === "custom" && customDescription
      ? customDescription
      : SCENARIO_DESCRIPTIONS[scenario] || "Unknown scenario";

  try {
    if (documents.length === 0) {
      return buildEmptyResult(scenario, scenarioTitle, scenarioDescription);
    }

    // Build document summaries
    const summaries = documents.map((doc, i) => {
      const relevantClauses = doc.clauses
        .filter((c) => c.risk_level !== "safe")
        .slice(0, 10)
        .map(
          (c) =>
            `  Clause ${c.clause_number} (${c.clause_type}): ${c.original_text.slice(0, 200)}`
        )
        .join("\n");

      return `CONTRACT ${i + 1}: ${doc.title}
ID: ${doc.id}
Type: ${doc.document_type} | Entity: ${doc.entity_name || "Unknown"} | Jurisdiction: ${doc.jurisdiction}
Risk Score: ${doc.overall_risk_score}/100
Key clauses:
${relevantClauses || "  No high-risk clauses."}`;
    });

    const userMessage = `SCENARIO: ${scenarioTitle}
Description: ${scenarioDescription}

The person has ${documents.length} active contracts:

${summaries.join("\n\n")}

Analyze what happens to ALL contracts if this scenario occurs.`;

    const response = await callGroq(
      [
        { role: "system", content: WHATIF_SCENARIO_PROMPT },
        { role: "user", content: userMessage },
      ],
      {
        temperature: 0.2,
        maxTokens: 4096,
      }
    );

    const parsed = JSON.parse(response);

    // Parse affected contracts
    const affectedContracts: WhatIfContractImpact[] = [];
    const rawContracts = Array.isArray(parsed.affected_contracts)
      ? parsed.affected_contracts
      : [];

    for (const raw of rawContracts) {
      const impactLevel = ["terminated", "breached", "modified", "unaffected"].includes(
        raw.impact_level
      )
        ? (raw.impact_level as WhatIfContractImpact["impact_level"])
        : "modified";

      affectedContracts.push({
        document_id: String(raw.document_id || ""),
        document_title: String(raw.document_title || ""),
        document_type: String(raw.document_type || ""),
        impact_level: impactLevel,
        impact_description: String(raw.impact_description || ""),
        financial_impact:
          raw.financial_impact != null ? Number(raw.financial_impact) : null,
        clauses_triggered: Array.isArray(raw.clauses_triggered)
          ? raw.clauses_triggered.map(String)
          : [],
        rights_lost: Array.isArray(raw.rights_lost)
          ? raw.rights_lost.map(String)
          : [],
        rights_gained: Array.isArray(raw.rights_gained)
          ? raw.rights_gained.map(String)
          : [],
      });
    }

    // Parse timeline
    const timeline: WhatIfTimelineStep[] = [];
    const rawTimeline = Array.isArray(parsed.timeline) ? parsed.timeline : [];

    for (const raw of rawTimeline) {
      timeline.push({
        day: Number(raw.day) || 0,
        title: String(raw.title || ""),
        description: String(raw.description || ""),
        contracts_affected: Array.isArray(raw.contracts_affected)
          ? raw.contracts_affected.map(String)
          : [],
        financial_impact:
          raw.financial_impact != null ? Number(raw.financial_impact) : null,
        action_required: raw.action_required ? String(raw.action_required) : null,
      });
    }

    // Sort timeline by day
    timeline.sort((a, b) => a.day - b.day);

    // Parse severity
    const validSeverities = [
      "devastating",
      "severe",
      "moderate",
      "manageable",
      "minimal",
    ] as const;
    const overallSeverity = validSeverities.includes(parsed.overall_severity)
      ? (parsed.overall_severity as WhatIfResult["overall_severity"])
      : "moderate";

    return {
      scenario,
      scenario_title: scenarioTitle,
      scenario_description: scenarioDescription,
      affected_contracts: affectedContracts,
      total_financial_impact: Number(parsed.total_financial_impact) || 0,
      immediate_actions: Array.isArray(parsed.immediate_actions)
        ? parsed.immediate_actions.map(String)
        : [],
      timeline,
      overall_severity: overallSeverity,
      protection_score: Math.min(
        100,
        Math.max(0, Number(parsed.protection_score) || 50)
      ),
    };
  } catch (error) {
    console.error("[Vault] What-if simulation failed:", error);
    return buildEmptyResult(scenario, scenarioTitle, scenarioDescription);
  }
}

function buildEmptyResult(
  scenario: WhatIfScenario,
  title: string,
  description: string
): WhatIfResult {
  return {
    scenario,
    scenario_title: title,
    scenario_description: description,
    affected_contracts: [],
    total_financial_impact: 0,
    immediate_actions: ["Analysis could not be completed. Please try again."],
    timeline: [],
    overall_severity: "moderate",
    protection_score: 50,
  };
}
