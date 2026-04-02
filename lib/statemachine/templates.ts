// ============================================
// CONTRACT STATE MACHINE — DOCUMENT TYPE TEMPLATES
// Expected base states and transitions per contract type
// ============================================

import type {
  StateTemplate,
  ContractStateMachine,
  TemplateValidationResult,
  ContractState,
  StateTransition,
} from "./types";

// ============================================
// TEMPLATE DEFINITIONS
// ============================================

const RENTAL_TEMPLATE: StateTemplate = {
  documentType: "rental",
  baseStates: [
    { name: "Pre-Signing", type: "initial", description: "Agreement drafted, parties reviewing terms" },
    { name: "Active Tenancy", type: "normal", description: "Tenant occupying property, paying rent regularly" },
    { name: "Lock-In Period", type: "restricted", description: "Tenant bound by lock-in clause, early exit penalized" },
    { name: "Notice Period Given", type: "normal", description: "Notice served by either party, countdown to exit" },
    { name: "Early Termination", type: "dangerous", description: "Tenant exits before lock-in ends, penalties apply" },
    { name: "Penalty Applied", type: "dangerous", description: "Financial penalty imposed for contract breach" },
    { name: "Deposit Forfeited", type: "terminal_loss", description: "Security deposit withheld entirely by landlord" },
    { name: "Normal Termination", type: "terminal_safe", description: "Contract ends normally after notice period" },
    { name: "Deposit Returned", type: "terminal_safe", description: "Security deposit refunded to tenant" },
    { name: "Renewal", type: "normal", description: "Lease renewed for another term" },
    { name: "Dispute", type: "dangerous", description: "Disagreement between parties, potential legal action" },
    { name: "Arbitration", type: "dangerous", description: "Formal dispute resolution process initiated" },
  ],
  baseTransitions: [
    { from: "Pre-Signing", to: "Active Tenancy", trigger: "Agreement signed by both parties" },
    { from: "Active Tenancy", to: "Lock-In Period", trigger: "Lock-in clause activates" },
    { from: "Lock-In Period", to: "Active Tenancy", trigger: "Lock-in period expires" },
    { from: "Lock-In Period", to: "Early Termination", trigger: "Tenant exits during lock-in" },
    { from: "Early Termination", to: "Penalty Applied", trigger: "Penalty clause triggered" },
    { from: "Penalty Applied", to: "Deposit Forfeited", trigger: "Deposit used to cover penalty" },
    { from: "Active Tenancy", to: "Notice Period Given", trigger: "Notice served per contract terms" },
    { from: "Notice Period Given", to: "Normal Termination", trigger: "Notice period completes" },
    { from: "Normal Termination", to: "Deposit Returned", trigger: "Deposit refund processed" },
    { from: "Active Tenancy", to: "Renewal", trigger: "Lease term expires, renewal agreed" },
    { from: "Renewal", to: "Active Tenancy", trigger: "New term begins" },
    { from: "Active Tenancy", to: "Dispute", trigger: "Party raises complaint or breach" },
    { from: "Dispute", to: "Arbitration", trigger: "Mediation fails, formal arbitration begins" },
  ],
  commonTraps: [
    "Early termination → full deposit forfeiture with no proportional refund",
    "Unilateral termination by landlord without notice but tenant requires 3+ months notice",
    "Auto-renewal with no opt-out clause locking tenant indefinitely",
    "Unreasonable lock-in period (>11 months for residential rental)",
  ],
};

const EMPLOYMENT_TEMPLATE: StateTemplate = {
  documentType: "employment",
  baseStates: [
    { name: "Offer Accepted", type: "initial", description: "Candidate accepts employment offer" },
    { name: "Probation", type: "restricted", description: "Employee in probationary period with limited rights" },
    { name: "Confirmed Employment", type: "normal", description: "Employee confirmed after probation" },
    { name: "Notice Period", type: "normal", description: "Resignation notice served, serving out period" },
    { name: "Resignation Submitted", type: "normal", description: "Employee submits formal resignation" },
    { name: "Terminated by Employer", type: "dangerous", description: "Employment terminated by employer" },
    { name: "Garden Leave", type: "restricted", description: "Employee on garden leave, still employed but not working" },
    { name: "Non-Compete Active", type: "restricted", description: "Non-compete clause restricting future employment" },
    { name: "Bond Enforcement", type: "trap", description: "Training bond penalty being enforced" },
    { name: "Relieving Letter Pending", type: "dangerous", description: "Awaiting relieving letter, blocked from new employment" },
    { name: "Final Settlement Pending", type: "dangerous", description: "Waiting for final pay and benefits settlement" },
    { name: "Cleared", type: "terminal_safe", description: "All dues settled, documents issued, free to move" },
    { name: "Dispute", type: "dangerous", description: "Employment dispute raised, potential legal action" },
  ],
  baseTransitions: [
    { from: "Offer Accepted", to: "Probation", trigger: "Employment starts, probation begins" },
    { from: "Probation", to: "Confirmed Employment", trigger: "Probation period completes successfully" },
    { from: "Probation", to: "Terminated by Employer", trigger: "Terminated during probation (minimal notice)" },
    { from: "Confirmed Employment", to: "Resignation Submitted", trigger: "Employee decides to resign" },
    { from: "Resignation Submitted", to: "Notice Period", trigger: "Notice period begins" },
    { from: "Notice Period", to: "Garden Leave", trigger: "Employer puts employee on garden leave" },
    { from: "Notice Period", to: "Relieving Letter Pending", trigger: "Notice period completes" },
    { from: "Confirmed Employment", to: "Terminated by Employer", trigger: "Employer terminates employment" },
    { from: "Terminated by Employer", to: "Final Settlement Pending", trigger: "Exit process initiated" },
    { from: "Relieving Letter Pending", to: "Final Settlement Pending", trigger: "Relieving letter issued" },
    { from: "Relieving Letter Pending", to: "Bond Enforcement", trigger: "Bond clause invoked, payment demanded" },
    { from: "Final Settlement Pending", to: "Cleared", trigger: "All dues settled" },
    { from: "Cleared", to: "Non-Compete Active", trigger: "Non-compete clause activates post-exit" },
    { from: "Confirmed Employment", to: "Dispute", trigger: "Employment dispute raised" },
  ],
  commonTraps: [
    "Training bond with disproportionate penalty amount",
    "Relieving letter withheld to block new employment",
    "Non-compete clause with unreasonable duration or geographic scope",
    "Final settlement delayed indefinitely with no timeline",
    "Notice period buyout priced excessively high",
  ],
};

const LOAN_TEMPLATE: StateTemplate = {
  documentType: "loan",
  baseStates: [
    { name: "Application Approved", type: "initial", description: "Loan application approved and terms accepted" },
    { name: "Disbursed", type: "normal", description: "Loan amount disbursed to borrower" },
    { name: "EMI Active", type: "normal", description: "Regular EMI payments being made on time" },
    { name: "Prepayment Requested", type: "restricted", description: "Borrower requests early loan closure" },
    { name: "Default", type: "dangerous", description: "Missed EMI payments, default status" },
    { name: "NPA Classification", type: "trap", description: "Loan classified as Non-Performing Asset" },
    { name: "Recovery Proceedings", type: "dangerous", description: "Legal recovery action initiated by lender" },
    { name: "Settlement Offer", type: "normal", description: "One-time settlement offered to close loan" },
    { name: "Foreclosure", type: "dangerous", description: "Collateral seizure proceedings initiated" },
    { name: "Legal Action", type: "terminal_loss", description: "Court proceedings for loan recovery" },
    { name: "Loan Closed", type: "terminal_safe", description: "Loan fully repaid, account closed" },
  ],
  baseTransitions: [
    { from: "Application Approved", to: "Disbursed", trigger: "Loan amount credited to borrower" },
    { from: "Disbursed", to: "EMI Active", trigger: "First EMI cycle begins" },
    { from: "EMI Active", to: "Prepayment Requested", trigger: "Borrower requests prepayment/foreclosure" },
    { from: "Prepayment Requested", to: "Loan Closed", trigger: "Prepayment processed with penalty" },
    { from: "EMI Active", to: "Default", trigger: "EMI payment missed for 90+ days" },
    { from: "Default", to: "NPA Classification", trigger: "Default exceeds threshold period" },
    { from: "NPA Classification", to: "Recovery Proceedings", trigger: "Bank initiates SARFAESI proceedings" },
    { from: "Recovery Proceedings", to: "Foreclosure", trigger: "Collateral attached for recovery" },
    { from: "Recovery Proceedings", to: "Settlement Offer", trigger: "Bank offers settlement terms" },
    { from: "Settlement Offer", to: "Loan Closed", trigger: "Settlement accepted and paid" },
    { from: "Foreclosure", to: "Legal Action", trigger: "Court orders asset sale" },
    { from: "EMI Active", to: "Loan Closed", trigger: "All EMIs paid, tenure completes" },
  ],
  commonTraps: [
    "Prepayment penalty locked during initial period with excessive charges",
    "Default → NPA → Recovery spiral with no settlement path visible",
    "Hidden processing fees on settlement/foreclosure",
    "Interest rate reset clause without borrower consent",
  ],
};

const FREELANCE_TEMPLATE: StateTemplate = {
  documentType: "freelance",
  baseStates: [
    { name: "Engagement Signed", type: "initial", description: "Freelance contract signed by both parties" },
    { name: "Active Work", type: "normal", description: "Freelancer actively performing contracted work" },
    { name: "Milestone Submitted", type: "normal", description: "Work delivered for client review" },
    { name: "Revision Requested", type: "normal", description: "Client requests changes to delivered work" },
    { name: "Unlimited Revisions Trap", type: "trap", description: "Client demands endless revisions under vague acceptance clause" },
    { name: "Payment Due", type: "normal", description: "Work accepted, payment invoice submitted" },
    { name: "Payment Disputed", type: "dangerous", description: "Client disputes payment or quality of work" },
    { name: "IP Retained by Client", type: "terminal_warning", description: "Intellectual property transferred without full payment" },
    { name: "Scope Creep", type: "dangerous", description: "Work scope expanded beyond original agreement" },
    { name: "Terminated", type: "terminal_warning", description: "Contract terminated before completion" },
    { name: "Completed", type: "terminal_safe", description: "All work delivered, payment received, contract fulfilled" },
  ],
  baseTransitions: [
    { from: "Engagement Signed", to: "Active Work", trigger: "Work begins per agreed scope" },
    { from: "Active Work", to: "Milestone Submitted", trigger: "Deliverable submitted for review" },
    { from: "Milestone Submitted", to: "Revision Requested", trigger: "Client requests revisions" },
    { from: "Revision Requested", to: "Active Work", trigger: "Freelancer completes revisions" },
    { from: "Revision Requested", to: "Unlimited Revisions Trap", trigger: "Unlimited revision clause invoked" },
    { from: "Milestone Submitted", to: "Payment Due", trigger: "Client accepts deliverable" },
    { from: "Payment Due", to: "Completed", trigger: "Payment received in full" },
    { from: "Payment Due", to: "Payment Disputed", trigger: "Client disputes payment terms" },
    { from: "Payment Disputed", to: "IP Retained by Client", trigger: "Client retains work without paying" },
    { from: "Active Work", to: "Scope Creep", trigger: "Additional work requested beyond original scope" },
    { from: "Active Work", to: "Terminated", trigger: "Contract terminated by either party" },
  ],
  commonTraps: [
    "Unlimited revisions clause with no cap or acceptance criteria",
    "IP transfer upon delivery rather than upon payment",
    "Payment upon client satisfaction with no objective criteria",
    "No kill fee or partial payment on early termination",
  ],
};

const NDA_TEMPLATE: StateTemplate = {
  documentType: "nda",
  baseStates: [
    { name: "NDA Signed", type: "initial", description: "Non-disclosure agreement executed by parties" },
    { name: "Active Confidentiality", type: "normal", description: "Confidential information being shared under NDA" },
    { name: "Breach Alleged", type: "dangerous", description: "One party alleges confidentiality breach" },
    { name: "Evidence Review", type: "normal", description: "Investigation into alleged breach" },
    { name: "Penalty Proceedings", type: "dangerous", description: "Financial penalty proceedings initiated" },
    { name: "Legal Action", type: "terminal_loss", description: "Lawsuit filed for breach of NDA" },
    { name: "NDA Expired", type: "terminal_safe", description: "NDA period expires, obligations end" },
    { name: "Settlement", type: "terminal_warning", description: "Breach settled out of court" },
  ],
  baseTransitions: [
    { from: "NDA Signed", to: "Active Confidentiality", trigger: "Confidential information shared" },
    { from: "Active Confidentiality", to: "Breach Alleged", trigger: "Suspected breach reported" },
    { from: "Breach Alleged", to: "Evidence Review", trigger: "Investigation initiated" },
    { from: "Evidence Review", to: "Penalty Proceedings", trigger: "Breach confirmed" },
    { from: "Evidence Review", to: "Active Confidentiality", trigger: "Breach allegation dismissed" },
    { from: "Penalty Proceedings", to: "Legal Action", trigger: "Penalty contested, litigation begins" },
    { from: "Penalty Proceedings", to: "Settlement", trigger: "Penalty paid or negotiated" },
    { from: "Active Confidentiality", to: "NDA Expired", trigger: "NDA term ends naturally" },
  ],
  commonTraps: [
    "Unreasonable confidentiality duration (perpetual or >5 years)",
    "Overly broad definition of confidential information",
    "Disproportionate penalties for minor or unintentional breaches",
    "No carve-outs for information that becomes publicly known",
  ],
};

const GENERIC_TEMPLATE: StateTemplate = {
  documentType: "generic",
  baseStates: [
    { name: "Pre-Signing", type: "initial", description: "Contract under review before execution" },
    { name: "Active", type: "normal", description: "Contract is in force, obligations being performed" },
    { name: "Breach", type: "dangerous", description: "One party breaches contract terms" },
    { name: "Penalty", type: "dangerous", description: "Financial penalties applied for breach" },
    { name: "Normal Termination", type: "terminal_safe", description: "Contract expires or terminates normally" },
    { name: "Dispute", type: "dangerous", description: "Formal dispute between parties" },
    { name: "Resolution", type: "terminal_warning", description: "Dispute resolved through settlement or arbitration" },
  ],
  baseTransitions: [
    { from: "Pre-Signing", to: "Active", trigger: "Contract signed by all parties" },
    { from: "Active", to: "Breach", trigger: "Contract term violated" },
    { from: "Breach", to: "Penalty", trigger: "Penalty clause invoked" },
    { from: "Active", to: "Normal Termination", trigger: "Contract term completes" },
    { from: "Active", to: "Dispute", trigger: "Disagreement between parties" },
    { from: "Dispute", to: "Resolution", trigger: "Dispute resolved" },
    { from: "Penalty", to: "Dispute", trigger: "Penalty contested" },
  ],
  commonTraps: [
    "One-sided termination rights",
    "Automatic renewal without consent",
    "Disproportionate penalty clauses",
  ],
};

// ============================================
// TEMPLATE REGISTRY
// ============================================

const TEMPLATE_MAP: Record<string, StateTemplate> = {
  rental: RENTAL_TEMPLATE,
  employment: EMPLOYMENT_TEMPLATE,
  loan: LOAN_TEMPLATE,
  freelance: FREELANCE_TEMPLATE,
  nda: NDA_TEMPLATE,
  sale: GENERIC_TEMPLATE,
  partnership: GENERIC_TEMPLATE,
  tos: GENERIC_TEMPLATE,
  other: GENERIC_TEMPLATE,
};

// ============================================
// PUBLIC API
// ============================================

/**
 * Get the state machine template for a given document type.
 * Returns GENERIC_TEMPLATE as fallback for unrecognized types.
 */
export function getTemplate(documentType: string): StateTemplate {
  return TEMPLATE_MAP[documentType.toLowerCase()] || GENERIC_TEMPLATE;
}

/**
 * Validate a state machine against its expected template.
 * Returns missing states, transitions, and a completeness score.
 */
export function validateAgainstTemplate(
  stateMachine: ContractStateMachine,
  template: StateTemplate
): TemplateValidationResult {
  const stateNames = new Set(
    stateMachine.states.map((s) => s.name.toLowerCase())
  );
  const transitionKeys = new Set(
    stateMachine.transitions.map(
      (t) => {
        const from = stateMachine.states.find((s) => s.id === t.fromStateId);
        const to = stateMachine.states.find((s) => s.id === t.toStateId);
        return `${(from?.name || "").toLowerCase()}->${(to?.name || "").toLowerCase()}`;
      }
    )
  );

  const missingStates: string[] = [];
  for (const baseState of template.baseStates) {
    const nameLC = baseState.name.toLowerCase();
    // Check if any existing state name is similar
    const found = Array.from(stateNames).some(
      (sn) => sn.includes(nameLC) || nameLC.includes(sn) || levenshteinSimilar(sn, nameLC)
    );
    if (!found) {
      missingStates.push(baseState.name);
    }
  }

  const missingTransitions: string[] = [];
  for (const baseTrans of template.baseTransitions) {
    const key = `${baseTrans.from.toLowerCase()}->${baseTrans.to.toLowerCase()}`;
    const found = Array.from(transitionKeys).some(
      (tk) => tk.includes(baseTrans.from.toLowerCase()) && tk.includes(baseTrans.to.toLowerCase())
    );
    if (!found) {
      missingTransitions.push(`${baseTrans.from} → ${baseTrans.to}`);
    }
  }

  const totalExpected = template.baseStates.length + template.baseTransitions.length;
  const totalMissing = missingStates.length + missingTransitions.length;
  const completeness = totalExpected > 0
    ? Math.round(((totalExpected - totalMissing) / totalExpected) * 100)
    : 100;

  return { missingStates, missingTransitions, completeness };
}

/**
 * Enhance a state machine by adding missing template states.
 * Only adds states that are clearly absent. Does NOT override AI extraction.
 */
export function enhanceWithTemplate(
  stateMachine: ContractStateMachine,
  template: StateTemplate
): ContractStateMachine {
  const validation = validateAgainstTemplate(stateMachine, template);

  if (validation.missingStates.length === 0) {
    return stateMachine;
  }

  const enhanced = { ...stateMachine };
  const newStates = [...enhanced.states];
  const newTransitions = [...enhanced.transitions];
  let addedCount = 0;

  for (const missingName of validation.missingStates) {
    const templateState = template.baseStates.find(
      (s) => s.name === missingName
    );
    if (!templateState) continue;

    // Only add non-initial, non-terminal states to avoid duplicates
    if (templateState.type === "initial" && enhanced.initialStateId) continue;

    const stateId = `state_template_${missingName.toLowerCase().replace(/\s+/g, "_")}`;
    const newState: ContractState = {
      id: stateId,
      name: templateState.name,
      description: templateState.description,
      type: templateState.type,
      party: "user",
      financialImpact: { type: "none" },
      isTrap: false,
      isAbsorbing: false,
      metadata: { addedFromTemplate: true, confidence: 0.4 },
    };

    newStates.push(newState);
    addedCount++;

    // Add transitions connecting this state to existing ones
    for (const baseTrans of template.baseTransitions) {
      if (baseTrans.from === missingName || baseTrans.to === missingName) {
        const fromName = baseTrans.from;
        const toName = baseTrans.to;
        const fromState = newStates.find(
          (s) => s.name.toLowerCase() === fromName.toLowerCase()
        );
        const toState = newStates.find(
          (s) => s.name.toLowerCase() === toName.toLowerCase()
        );

        if (fromState && toState) {
          const transId = `trans_template_${fromState.id}_${toState.id}`;
          // Don't add duplicate transitions
          const exists = newTransitions.some(
            (t) => t.fromStateId === fromState.id && t.toStateId === toState.id
          );
          if (!exists) {
            newTransitions.push({
              id: transId,
              fromStateId: fromState.id,
              toStateId: toState.id,
              trigger: baseTrans.trigger,
              triggerType: "user_action",
              party: "user",
              isVoluntary: true,
              isReversible: false,
              probability: "possible",
              metadata: { addedFromTemplate: true },
            });
          }
        }
      }
    }
  }

  enhanced.states = newStates;
  enhanced.transitions = newTransitions;
  enhanced.metadata = {
    ...enhanced.metadata,
    totalStates: newStates.length,
    totalTransitions: newTransitions.length,
    confidence: Math.max(0.3, enhanced.metadata.confidence - addedCount * 0.05),
  };


  return enhanced;
}

// ============================================
// UTILITY
// ============================================

/** Simple Levenshtein-based similarity check (threshold: 60%) */
function levenshteinSimilar(a: string, b: string): boolean {
  if (a.length === 0 || b.length === 0) return false;
  const maxLen = Math.max(a.length, b.length);
  if (maxLen === 0) return true;

  const matrix: number[][] = [];
  for (let i = 0; i <= a.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= b.length; j++) {
    matrix[0][j] = j;
  }
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      );
    }
  }

  const distance = matrix[a.length][b.length];
  const similarity = 1 - distance / maxLen;
  return similarity >= 0.6;
}
