// ============================================
// CONTRACT STATE MACHINE — AI EXTRACTION ENGINE
// Uses Groq LLM to extract formal state machines from contracts
// ============================================

import { callGroq } from "@/lib/ai/groq-client";
import { getTemplate, enhanceWithTemplate, validateAgainstTemplate } from "./templates";
import type {
  ContractStateMachine,
  ContractState,
  StateTransition,
  StateType,
  TriggerType,
  TransitionParty,
  Probability,
  FinancialImpactType,
  StateParty,
} from "./types";

// ============================================
// SYSTEM PROMPT — The core of the extraction engine
// ============================================

function buildSystemPrompt(documentType: string, jurisdiction: string): string {
  const template = getTemplate(documentType);
  const templateStates = template.baseStates.map((s) => s.name).join(", ");

  return `You are a contract analysis expert specializing in formal state machine extraction. Your task is to read a complete contract and extract its formal state machine — the complete set of states (situations the parties can be in) and transitions (events that move the relationship from one state to another).

A contract defines a state machine: a formal system where the parties start in an initial state (pre-signing or signing), and through various events — time passing, actions taken, breaches committed, external events — they transition through different states. Some states are safe, some are dangerous, and some are **traps** — states where all paths forward lead to loss for one party.

## Your Task

Read the ENTIRE contract holistically (not clause by clause) and extract:
1. **Every possible state** the contractual relationship can be in
2. **Every possible transition** between states, including triggers, conditions, and consequences
3. **Implicit states** — what happens if a party doesn't act? What if payment is missed? What if notice is late?
4. **Financial impacts** at each state
5. **Duration** of time-limited states
6. **Who controls** each transition (user, counterparty, automatic, mutual)

## Output JSON Schema

Return valid JSON with exactly this structure:

{
  "states": [
    {
      "id": "state_descriptive_id",
      "name": "Human Readable State Name",
      "description": "One-sentence description of what this state means for the parties",
      "type": "initial|normal|restricted|dangerous|trap|absorbing_trap|terminal_safe|terminal_warning|terminal_loss",
      "party": "tenant|employee|borrower|user|both|landlord|employer|lender|counterparty",
      "financialImpact": {
        "type": "none|payment|penalty|partial_loss|total_loss|gain|refund",
        "amount": "description like '2 months rent' or '₹50,000'"
      },
      "duration": {
        "value": 11,
        "unit": "months",
        "isFixed": true
      },
      "legalIssues": ["Section 74 Indian Contract Act — unreasonable penalty"],
      "clauseReferences": ["clause 7.2", "clause 12"]
    }
  ],
  "transitions": [
    {
      "id": "trans_descriptive_id",
      "fromStateId": "state_xxx",
      "toStateId": "state_yyy",
      "trigger": "Human readable trigger description",
      "triggerType": "automatic|time_based|user_action|counterparty_action|external_event|breach",
      "condition": "Optional condition that must be true",
      "timeConstraint": {
        "afterMonths": 11,
        "afterDays": 30,
        "withinPeriod": "30 days of breach"
      },
      "party": "user|counterparty|automatic|mutual",
      "isVoluntary": true,
      "isReversible": false,
      "financialConsequence": "Penalty of 2 months rent",
      "clauseReference": "clause 7.2",
      "probability": "certain|likely|possible|unlikely"
    }
  ],
  "initialStateId": "state_pre_signing",
  "terminalStateIds": ["state_normal_termination", "state_deposit_forfeited"]
}

## State Type Guidelines

- **initial**: Starting state (signing, acceptance, disbursement)
- **normal**: Regular operational states (active tenancy, confirmed employment, EMI payments)
- **restricted**: User's options are limited but not dangerous (lock-in period, probation, garden leave)
- **dangerous**: User faces significant risk or potential loss (default, breach alleged, penalty proceedings)
- **trap**: States where ALL outgoing paths lead to user loss — mark these carefully
- **absorbing_trap**: States with NO outgoing transitions at all — the user is stuck permanently
- **terminal_safe**: Contract ends favorably (deposit returned, loan closed, all dues cleared)
- **terminal_warning**: Contract ends with minor loss (partial deposit deduction, settlement with fees)
- **terminal_loss**: Contract ends with significant loss (full deposit forfeiture, legal judgment, bond enforcement)

## Critical Extraction Rules

1. **Be exhaustive**: Missing a state = missing a risk. Real contracts have 8-20+ states.
2. **Include implicit states**: If the contract has a penalty clause, there MUST be a "Penalty Applied" state even if not explicitly named.
3. **Think temporally**: What happens at month 1? Month 6? Month 11? Month 12? Month 24? Each significant time boundary may be a state transition.
4. **Think adversarially**: What's the WORST that can happen? What if the counterparty acts in bad faith? What if the user misses a deadline? These create dangerous states and transitions.
5. **Identify one-sided power**: Transitions that only one party can trigger are asymmetries. Mark who controls each transition.
6. **Financial precision**: Every state with financial impact should quantify it (e.g., "2 months deposit" not just "money").
7. **Clause references**: Every transition MUST reference the specific clause that creates it.
8. **Unique IDs**: State IDs like "state_lock_in_period", transition IDs like "trans_early_exit_penalty". Always start with "state_" or "trans_".
9. **At least one initial state, at least one terminal state.**
10. **Every non-terminal state must have at least one outgoing transition.**

## Expected States for ${documentType.toUpperCase()} Contracts

For this type of contract, you should typically find states related to: ${templateStates}.

But don't limit yourself — extract ALL states that the specific contract text defines, including unusual or custom ones.

## Example 1: Rental Agreement

For a rental agreement with 11-month lock-in, 2-month security deposit, and early termination penalty:

{
  "states": [
    {"id": "state_pre_signing", "name": "Pre-Signing", "type": "initial", "party": "both", "description": "Agreement under review", "financialImpact": {"type": "none"} },
    {"id": "state_active", "name": "Active Tenancy", "type": "normal", "party": "tenant", "description": "Tenant occupying property, rent paid monthly", "financialImpact": {"type": "payment", "amount": "Monthly rent ₹25,000"}, "duration": {"value": 11, "unit": "months", "isFixed": false} },
    {"id": "state_lock_in", "name": "Lock-In Period", "type": "restricted", "party": "tenant", "description": "First 6 months — early exit triggers full deposit forfeiture", "financialImpact": {"type": "payment", "amount": "Monthly rent ₹25,000"}, "duration": {"value": 6, "unit": "months", "isFixed": true}, "legalIssues": ["Lock-in exceeds fair duration"], "clauseReferences": ["clause 4.1"] },
    {"id": "state_early_exit", "name": "Early Termination Initiated", "type": "dangerous", "party": "tenant", "description": "Tenant attempts to leave during lock-in", "financialImpact": {"type": "penalty", "amount": "2 months rent penalty"}, "clauseReferences": ["clause 7.2"] },
    {"id": "state_deposit_forfeited", "name": "Deposit Forfeited", "type": "terminal_loss", "party": "tenant", "description": "Full security deposit withheld by landlord", "financialImpact": {"type": "total_loss", "amount": "₹50,000 deposit"} },
    {"id": "state_notice_period", "name": "Notice Period", "type": "normal", "party": "both", "description": "2-month notice period served", "financialImpact": {"type": "payment", "amount": "Monthly rent"}, "duration": {"value": 2, "unit": "months", "isFixed": true}, "clauseReferences": ["clause 5"] },
    {"id": "state_normal_end", "name": "Normal Termination", "type": "terminal_safe", "party": "both", "description": "Lease ends after notice served properly", "financialImpact": {"type": "refund", "amount": "Full deposit minus deductions"} },
    {"id": "state_rent_default", "name": "Rent Default", "type": "dangerous", "party": "tenant", "description": "Tenant fails to pay rent for 15+ days", "financialImpact": {"type": "penalty", "amount": "Late fee ₹500/day"}, "clauseReferences": ["clause 3.4"] },
    {"id": "state_eviction", "name": "Eviction", "type": "terminal_loss", "party": "tenant", "description": "Landlord evicts tenant, deposit withheld", "financialImpact": {"type": "total_loss", "amount": "Deposit + moving costs"} },
    {"id": "state_renewal", "name": "Renewal", "type": "normal", "party": "both", "description": "Lease renewed with 10% rent escalation", "financialImpact": {"type": "payment", "amount": "₹27,500/month"}, "clauseReferences": ["clause 11"] }
  ],
  "transitions": [
    {"id": "trans_sign", "fromStateId": "state_pre_signing", "toStateId": "state_lock_in", "trigger": "Agreement signed, deposit paid", "triggerType": "user_action", "party": "mutual", "isVoluntary": true, "isReversible": false, "probability": "certain", "financialConsequence": "Pay 2 months security deposit + 1 month rent", "clauseReference": "clause 1"},
    {"id": "trans_lock_in_ends", "fromStateId": "state_lock_in", "toStateId": "state_active", "trigger": "6-month lock-in period expires", "triggerType": "time_based", "timeConstraint": {"afterMonths": 6}, "party": "automatic", "isVoluntary": false, "isReversible": false, "probability": "certain", "clauseReference": "clause 4.1"},
    {"id": "trans_early_exit", "fromStateId": "state_lock_in", "toStateId": "state_early_exit", "trigger": "Tenant vacates during lock-in", "triggerType": "user_action", "party": "user", "isVoluntary": true, "isReversible": false, "probability": "possible", "financialConsequence": "Triggers penalty clause", "clauseReference": "clause 7.2"},
    {"id": "trans_penalty_to_forfeit", "fromStateId": "state_early_exit", "toStateId": "state_deposit_forfeited", "trigger": "Penalty deducted from deposit, entire deposit withheld", "triggerType": "automatic", "party": "counterparty", "isVoluntary": false, "isReversible": false, "probability": "certain", "financialConsequence": "Full ₹50,000 deposit lost", "clauseReference": "clause 7.2"},
    {"id": "trans_give_notice", "fromStateId": "state_active", "toStateId": "state_notice_period", "trigger": "Tenant serves 2-month written notice", "triggerType": "user_action", "party": "user", "isVoluntary": true, "isReversible": false, "probability": "likely", "clauseReference": "clause 5"},
    {"id": "trans_notice_complete", "fromStateId": "state_notice_period", "toStateId": "state_normal_end", "trigger": "Notice period expires", "triggerType": "time_based", "timeConstraint": {"afterMonths": 2}, "party": "automatic", "isVoluntary": false, "isReversible": false, "probability": "certain", "clauseReference": "clause 5"},
    {"id": "trans_rent_missed", "fromStateId": "state_active", "toStateId": "state_rent_default", "trigger": "Rent not paid for 15 consecutive days", "triggerType": "breach", "party": "user", "isVoluntary": false, "isReversible": true, "probability": "possible", "financialConsequence": "Late fee ₹500/day", "clauseReference": "clause 3.4"},
    {"id": "trans_evict", "fromStateId": "state_rent_default", "toStateId": "state_eviction", "trigger": "Landlord serves eviction notice after 30 days default", "triggerType": "counterparty_action", "party": "counterparty", "isVoluntary": false, "isReversible": false, "probability": "likely", "financialConsequence": "Deposit forfeited + legal costs", "clauseReference": "clause 8"},
    {"id": "trans_renew", "fromStateId": "state_active", "toStateId": "state_renewal", "trigger": "Both parties agree to renew at term end", "triggerType": "user_action", "party": "mutual", "isVoluntary": true, "isReversible": false, "probability": "possible", "financialConsequence": "10% rent increase", "clauseReference": "clause 11"}
  ],
  "initialStateId": "state_pre_signing",
  "terminalStateIds": ["state_normal_end", "state_deposit_forfeited", "state_eviction"]
}

## Example 2: Employment Contract

For an employment contract with 3-month probation, 2-month notice period, and training bond:

{
  "states": [
    {"id": "state_offer", "name": "Offer Accepted", "type": "initial", "party": "employee", "description": "Employee accepts offer letter", "financialImpact": {"type": "none"} },
    {"id": "state_probation", "name": "Probation Period", "type": "restricted", "party": "employee", "description": "3-month probation with 1-week notice period", "financialImpact": {"type": "payment", "amount": "Monthly salary"}, "duration": {"value": 3, "unit": "months", "isFixed": true}, "clauseReferences": ["clause 2"] },
    {"id": "state_confirmed", "name": "Confirmed Employee", "type": "normal", "party": "employee", "description": "Probation cleared, full employee status", "financialImpact": {"type": "payment", "amount": "Monthly salary + benefits"}, "clauseReferences": ["clause 2.3"] },
    {"id": "state_resignation", "name": "Resignation Submitted", "type": "normal", "party": "employee", "description": "Employee submits resignation", "financialImpact": {"type": "payment", "amount": "Salary during notice"}, "clauseReferences": ["clause 8"] },
    {"id": "state_notice", "name": "Serving Notice Period", "type": "restricted", "party": "employee", "description": "2-month mandatory notice period", "financialImpact": {"type": "payment", "amount": "Salary"}, "duration": {"value": 2, "unit": "months", "isFixed": true}, "clauseReferences": ["clause 8.1"] },
    {"id": "state_bond_triggered", "name": "Training Bond Enforced", "type": "trap", "party": "employee", "description": "If employee leaves before 2 years, must repay ₹3,00,000 training cost", "financialImpact": {"type": "total_loss", "amount": "₹3,00,000"}, "legalIssues": ["Section 27 Indian Contract Act — restraint of trade"], "clauseReferences": ["clause 15"] },
    {"id": "state_relieving_pending", "name": "Relieving Letter Pending", "type": "dangerous", "party": "employee", "description": "Notice served but relieving letter not yet issued", "financialImpact": {"type": "none"}, "clauseReferences": ["clause 8.4"] },
    {"id": "state_cleared", "name": "Fully Cleared", "type": "terminal_safe", "party": "employee", "description": "All dues settled, documents issued, free to join new employer", "financialImpact": {"type": "refund", "amount": "Final settlement + gratuity"} },
    {"id": "state_terminated", "name": "Terminated by Employer", "type": "terminal_warning", "party": "employee", "description": "Employment terminated by company", "financialImpact": {"type": "partial_loss", "amount": "Loss of unvested benefits"} },
    {"id": "state_non_compete", "name": "Non-Compete Active", "type": "restricted", "party": "employee", "description": "12-month non-compete clause restricting employment at competitors", "financialImpact": {"type": "partial_loss", "amount": "Limited employment options"}, "duration": {"value": 12, "unit": "months", "isFixed": true}, "legalIssues": ["Section 27 Indian Contract Act"], "clauseReferences": ["clause 16"] }
  ],
  "transitions": [
    {"id": "trans_start", "fromStateId": "state_offer", "toStateId": "state_probation", "trigger": "Employee joins on start date", "triggerType": "user_action", "party": "user", "isVoluntary": true, "isReversible": false, "probability": "certain", "clauseReference": "clause 1"},
    {"id": "trans_confirm", "fromStateId": "state_probation", "toStateId": "state_confirmed", "trigger": "Probation completed successfully", "triggerType": "time_based", "timeConstraint": {"afterMonths": 3}, "party": "automatic", "isVoluntary": false, "isReversible": false, "probability": "likely", "clauseReference": "clause 2"},
    {"id": "trans_resign", "fromStateId": "state_confirmed", "toStateId": "state_resignation", "trigger": "Employee submits resignation", "triggerType": "user_action", "party": "user", "isVoluntary": true, "isReversible": true, "probability": "possible", "clauseReference": "clause 8"},
    {"id": "trans_serve_notice", "fromStateId": "state_resignation", "toStateId": "state_notice", "trigger": "Notice period begins", "triggerType": "automatic", "party": "automatic", "isVoluntary": false, "isReversible": false, "probability": "certain", "clauseReference": "clause 8.1"},
    {"id": "trans_bond_check", "fromStateId": "state_resignation", "toStateId": "state_bond_triggered", "trigger": "Resignation within 2 years triggers training bond", "triggerType": "automatic", "condition": "Employee tenure < 2 years", "party": "counterparty", "isVoluntary": false, "isReversible": false, "probability": "certain", "financialConsequence": "Must pay ₹3,00,000", "clauseReference": "clause 15"},
    {"id": "trans_notice_done", "fromStateId": "state_notice", "toStateId": "state_relieving_pending", "trigger": "Notice period completes", "triggerType": "time_based", "timeConstraint": {"afterMonths": 2}, "party": "automatic", "isVoluntary": false, "isReversible": false, "probability": "certain", "clauseReference": "clause 8.1"},
    {"id": "trans_relieved", "fromStateId": "state_relieving_pending", "toStateId": "state_cleared", "trigger": "Relieving letter and experience certificate issued", "triggerType": "counterparty_action", "party": "counterparty", "isVoluntary": false, "isReversible": false, "probability": "likely", "clauseReference": "clause 8.4"},
    {"id": "trans_terminate", "fromStateId": "state_confirmed", "toStateId": "state_terminated", "trigger": "Company terminates employment", "triggerType": "counterparty_action", "party": "counterparty", "isVoluntary": false, "isReversible": false, "probability": "unlikely", "financialConsequence": "1 month salary in lieu of notice", "clauseReference": "clause 9"},
    {"id": "trans_non_compete_start", "fromStateId": "state_cleared", "toStateId": "state_non_compete", "trigger": "Non-compete clause activates after exit", "triggerType": "automatic", "party": "automatic", "isVoluntary": false, "isReversible": false, "probability": "certain", "clauseReference": "clause 16"}
  ],
  "initialStateId": "state_offer",
  "terminalStateIds": ["state_cleared", "state_terminated"]
}

## Context

This contract is from **${jurisdiction}** jurisdiction. Apply relevant local laws and regulations when identifying legal issues. The document type is **${documentType}**.

Now analyze the provided contract text and extract the complete state machine. Be thorough, be precise, and identify every possible trap.`;
}

// ============================================
// EXTRACTION FUNCTION
// ============================================

/**
 * Extract a contract state machine using Groq AI.
 * Returns null on unrecoverable failure — NEVER throws.
 */
export async function extractStateMachine(
  fullContractText: string,
  documentType: string,
  jurisdiction: string,
  clauses?: Array<{ text: string; type: string; index: number }>
): Promise<ContractStateMachine | null> {
  try {

    if (!fullContractText || fullContractText.trim().length < 100) {
      console.warn("[ClauseWall] [StateMachine] Contract text too short for extraction");
      return null;
    }

    // Build prompts
    const systemPrompt = buildSystemPrompt(documentType, jurisdiction);

    // Include clause summary if available for better context
    let clauseContext = "";
    if (clauses && clauses.length > 0) {
      const clauseSummary = clauses
        .slice(0, 30)
        .map((c) => `- Clause ${c.index + 1} (${c.type}): ${c.text.substring(0, 120)}...`)
        .join("\n");
      clauseContext = `\n\nThe following clauses have been identified:\n${clauseSummary}`;
    }

    const userPrompt = `Extract the complete state machine from this ${documentType} contract from ${jurisdiction}. Include ALL states, transitions, triggers, conditions, time constraints, financial impacts, and clause references. Be thorough — identify every trap state where the user could lose money or get stuck.${clauseContext}\n\nCONTRACT TEXT:\n${fullContractText.substring(0, 12000)}`;

    // Call Groq AI
    const response = await callGroq(
      [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      {
        temperature: 0.1,
        maxTokens: 4096,
        retries: 2,
      }
    );

    // Parse the JSON response
    let parsed: RawExtractionResult;
    try {
      parsed = JSON.parse(response);
    } catch (parseError) {
      console.error("[ClauseWall] [StateMachine] JSON parse failed, retrying with stricter prompt");

      // Retry with a stricter prompt
      const retryResponse = await callGroq(
        [
          { role: "system", content: "Return ONLY valid JSON. No markdown, no explanation. " + systemPrompt },
          { role: "user", content: userPrompt },
        ],
        { temperature: 0.05, maxTokens: 4096, retries: 1 }
      );

      try {
        parsed = JSON.parse(retryResponse);
      } catch {
        console.error("[ClauseWall] [StateMachine] JSON parse failed on retry — giving up");
        return null;
      }
    }

    // Validate and post-process
    const stateMachine = postProcess(parsed, documentType, jurisdiction);
    if (!stateMachine) {
      console.error("[ClauseWall] [StateMachine] Post-processing failed");
      return null;
    }

    // Enhance with template
    const template = getTemplate(documentType);
    const validation = validateAgainstTemplate(stateMachine, template);

    const enhanced = validation.completeness < 50
      ? enhanceWithTemplate(stateMachine, template)
      : stateMachine;


    return enhanced;
  } catch (error) {
    console.error("[ClauseWall] [StateMachine] Extraction failed:", error);
    return null;
  }
}

// ============================================
// RAW AI RESPONSE TYPE
// ============================================

interface RawState {
  id?: string;
  name?: string;
  description?: string;
  type?: string;
  party?: string;
  financialImpact?: {
    type?: string;
    amount?: string;
    monetaryValue?: number;
  };
  duration?: {
    value?: number;
    unit?: string;
    isFixed?: boolean;
  };
  legalIssues?: string[];
  clauseReferences?: string[];
}

interface RawTransition {
  id?: string;
  fromStateId?: string;
  toStateId?: string;
  trigger?: string;
  triggerType?: string;
  condition?: string;
  timeConstraint?: {
    afterMonths?: number;
    afterDays?: number;
    beforeDate?: string;
    withinPeriod?: string;
  };
  party?: string;
  isVoluntary?: boolean;
  isReversible?: boolean;
  financialConsequence?: string;
  clauseReference?: string;
  probability?: string;
}

interface RawExtractionResult {
  states?: RawState[];
  transitions?: RawTransition[];
  initialStateId?: string;
  terminalStateIds?: string[];
}

// ============================================
// POST-PROCESSING AND VALIDATION
// ============================================

const VALID_STATE_TYPES: Set<string> = new Set([
  "initial", "normal", "restricted", "dangerous", "trap",
  "absorbing_trap", "terminal_safe", "terminal_warning", "terminal_loss",
]);

const VALID_TRIGGER_TYPES: Set<string> = new Set([
  "automatic", "time_based", "user_action", "counterparty_action",
  "external_event", "breach",
]);

const VALID_PARTIES: Set<string> = new Set([
  "user", "counterparty", "automatic", "mutual",
]);

const VALID_STATE_PARTIES: Set<string> = new Set([
  "tenant", "employee", "borrower", "user", "both",
  "landlord", "employer", "lender", "counterparty",
]);

const VALID_PROBABILITIES: Set<string> = new Set([
  "certain", "likely", "possible", "unlikely",
]);

const VALID_IMPACT_TYPES: Set<string> = new Set([
  "none", "payment", "penalty", "partial_loss", "total_loss", "gain", "refund",
]);

function postProcess(
  raw: RawExtractionResult,
  documentType: string,
  jurisdiction: string
): ContractStateMachine | null {
  if (!raw || !raw.states || !Array.isArray(raw.states) || raw.states.length === 0) {
    console.warn("[ClauseWall] [StateMachine] No states in extraction result");
    return null;
  }

  // Process states
  const stateIdSet = new Set<string>();
  const states: ContractState[] = [];
  let idCounter = 1;

  for (const rawState of raw.states) {
    if (!rawState.name) continue;

    let id = rawState.id || `state_${rawState.name.toLowerCase().replace(/[^a-z0-9]+/g, "_")}`;

    // Ensure unique IDs
    if (stateIdSet.has(id)) {
      id = `${id}_${idCounter++}`;
    }
    stateIdSet.add(id);

    const stateType = VALID_STATE_TYPES.has(rawState.type || "")
      ? (rawState.type as StateType)
      : "normal";

    const stateParty = VALID_STATE_PARTIES.has(rawState.party || "")
      ? (rawState.party as StateParty)
      : "user";

    const impactType = VALID_IMPACT_TYPES.has(rawState.financialImpact?.type || "")
      ? (rawState.financialImpact!.type as FinancialImpactType)
      : "none";

    const state: ContractState = {
      id,
      name: rawState.name.trim(),
      description: (rawState.description || rawState.name).trim(),
      type: stateType,
      party: stateParty,
      financialImpact: {
        type: impactType,
        amount: rawState.financialImpact?.amount,
        monetaryValue: rawState.financialImpact?.monetaryValue,
      },
      isTrap: stateType === "trap" || stateType === "absorbing_trap",
      isAbsorbing: stateType === "absorbing_trap",
      legalIssues: rawState.legalIssues || undefined,
      clauseReferences: rawState.clauseReferences || undefined,
      metadata: {},
    };

    // Add duration if present
    if (rawState.duration && typeof rawState.duration.value === "number") {
      const unit = (rawState.duration.unit || "months") as "days" | "months" | "years";
      state.duration = {
        value: rawState.duration.value,
        unit: ["days", "months", "years"].includes(unit) ? unit : "months",
        isFixed: rawState.duration.isFixed !== false,
      };
    }

    states.push(state);
  }

  if (states.length < 2) {
    console.warn("[ClauseWall] [StateMachine] Too few valid states extracted");
    return null;
  }

  // Process transitions
  const transitions: StateTransition[] = [];
  let transIdCounter = 1;
  const transIdSet = new Set<string>();

  for (const rawTrans of raw.transitions || []) {
    if (!rawTrans.fromStateId || !rawTrans.toStateId) continue;

    // Validate state references
    if (!stateIdSet.has(rawTrans.fromStateId) || !stateIdSet.has(rawTrans.toStateId)) {
      console.warn(
        `[ClauseWall] [StateMachine] Orphan transition: ${rawTrans.fromStateId} → ${rawTrans.toStateId}`
      );
      continue;
    }

    let id = rawTrans.id || `trans_${transIdCounter++}`;
    if (transIdSet.has(id)) {
      id = `${id}_${transIdCounter++}`;
    }
    transIdSet.add(id);

    const triggerType = VALID_TRIGGER_TYPES.has(rawTrans.triggerType || "")
      ? (rawTrans.triggerType as TriggerType)
      : "user_action";

    const party = VALID_PARTIES.has(rawTrans.party || "")
      ? (rawTrans.party as TransitionParty)
      : "user";

    const probability = VALID_PROBABILITIES.has(rawTrans.probability || "")
      ? (rawTrans.probability as Probability)
      : "possible";

    transitions.push({
      id,
      fromStateId: rawTrans.fromStateId,
      toStateId: rawTrans.toStateId,
      trigger: (rawTrans.trigger || "Unknown trigger").trim(),
      triggerType,
      condition: rawTrans.condition || undefined,
      timeConstraint: rawTrans.timeConstraint || undefined,
      party,
      isVoluntary: rawTrans.isVoluntary !== false,
      isReversible: rawTrans.isReversible === true,
      financialConsequence: rawTrans.financialConsequence || undefined,
      clauseReference: rawTrans.clauseReference || undefined,
      probability,
      metadata: {},
    });
  }

  // Determine initial state
  let initialStateId = raw.initialStateId || "";
  if (!stateIdSet.has(initialStateId)) {
    const initialState = states.find((s) => s.type === "initial");
    if (initialState) {
      initialStateId = initialState.id;
    } else {
      // Mark first state as initial
      states[0].type = "initial";
      initialStateId = states[0].id;
    }
  }

  // Determine terminal states
  let terminalStateIds = (raw.terminalStateIds || []).filter((id) => stateIdSet.has(id));
  if (terminalStateIds.length === 0) {
    const terminalStates = states.filter(
      (s) => s.type === "terminal_safe" || s.type === "terminal_warning" || s.type === "terminal_loss"
    );
    if (terminalStates.length > 0) {
      terminalStateIds = terminalStates.map((s) => s.id);
    } else {
      // Find states with no outgoing transitions
      const statesWithOutgoing = new Set(transitions.map((t) => t.fromStateId));
      const deadEnds = states.filter((s) => !statesWithOutgoing.has(s.id) && s.id !== initialStateId);
      if (deadEnds.length > 0) {
        deadEnds.forEach((s) => { s.type = "terminal_warning"; });
        terminalStateIds = deadEnds.map((s) => s.id);
      } else {
        // Last resort: mark last state as terminal
        const lastState = states[states.length - 1];
        lastState.type = "terminal_safe";
        terminalStateIds = [lastState.id];
      }
    }
  }

  // Calculate metadata
  const now = new Date().toISOString();
  let confidence = 1.0;

  // Reduce confidence for issues found
  if (states.length < 6) confidence -= 0.15;
  if (transitions.length < 8) confidence -= 0.1;
  if (terminalStateIds.length === 0) confidence -= 0.2;
  confidence = Math.max(0.3, confidence);

  const stateMachine: ContractStateMachine = {
    id: `sm_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
    documentId: "",
    documentType,
    jurisdiction,
    states,
    transitions,
    initialStateId,
    terminalStateIds,
    metadata: {
      totalStates: states.length,
      totalTransitions: transitions.length,
      trapStates: states.filter((s) => s.isTrap).length,
      absorbingStates: states.filter((s) => s.isAbsorbing).length,
      maxPathLength: 0,
      avgPathLength: 0,
      extractedAt: now,
      confidence,
    },
  };

  return stateMachine;
}
