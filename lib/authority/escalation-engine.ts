// ============================================
// CLAUSEWALL — ESCALATION ENGINE
// Computes escalation paths + deadlines
// ============================================

import type {
  EscalationPath,
  EscalationStep,
  EscalationDeadline,
  DisputeCategory,
} from "@/types/authority";
import { ESCALATION_DEADLINES } from "./constants";

/**
 * Compute the full escalation path for a dispute category.
 */
export function computeEscalationPath(
  disputeCategory: DisputeCategory,
  documentType: string,
  startDate?: string
): EscalationPath {
  const steps = getEscalationSteps(disputeCategory);
  return {
    steps,
    current_step: 0,
    total_steps: steps.length,
    dispute_category: disputeCategory,
    document_type: documentType,
  };
}

/**
 * Compute upcoming deadlines from current escalation state.
 */
export function computeDeadlines(
  steps: EscalationStep[],
  currentStep: number,
  startDate: string
): EscalationDeadline[] {
  const deadlines: EscalationDeadline[] = [];
  const start = new Date(startDate);
  let cumulativeDays = 0;

  for (const step of steps) {
    cumulativeDays += step.deadline_days;
    const deadlineDate = new Date(start);
    deadlineDate.setDate(deadlineDate.getDate() + cumulativeDays);

    const now = new Date();
    const daysRemaining = Math.ceil(
      (deadlineDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );

    deadlines.push({
      step_number: step.step_number,
      action: step.action,
      deadline_date: deadlineDate.toISOString(),
      days_remaining: daysRemaining,
      is_overdue: daysRemaining < 0,
    });
  }

  return deadlines;
}

// ============================================
// ESCALATION STEP TEMPLATES BY CATEGORY
// ============================================

function getEscalationSteps(category: DisputeCategory): EscalationStep[] {
  switch (category) {
    case "consumer":
    case "telecom":
    case "ecommerce":
      return getConsumerEscalation();
    case "banking":
      return getBankingEscalation();
    case "insurance":
      return getInsuranceEscalation();
    case "employment":
      return getEmploymentEscalation();
    case "property":
      return getPropertyEscalation();
    case "rental":
      return getRentalEscalation();
    default:
      return getGenericEscalation();
  }
}

function getConsumerEscalation(): EscalationStep[] {
  return [
    { step_number: 1, action: "Send Legal Notice", description: "Send a formal legal notice to the company citing specific clauses violated and demanding resolution within 15 days under CPA 2019.", deadline_days: ESCALATION_DEADLINES.legal_notice_response, required_documents: ["Legal notice (typed, signed)", "Proof of sending (courier receipt / email read receipt)"], status: "upcoming" },
    { step_number: 2, action: "File at District Consumer Forum", description: "If no satisfactory response within 15 days, file a consumer complaint at the District Forum (e-Daakhil at edaakhil.nic.in).", deadline_days: 30, required_documents: ["Complaint in CPA format (4 copies)", "Affidavit", "Copy of legal notice + delivery proof", "Supporting documents with index", "Court fee stamp / online payment receipt"], filing_fee: 200, authority_type: "consumer_forum_district", status: "upcoming" },
    { step_number: 3, action: "Attend Hearings", description: "Attend hearing dates. You can appear in person — lawyer not mandatory for Consumer Forum.", deadline_days: 90, required_documents: ["All previously filed documents", "Written arguments (if any)"], status: "upcoming" },
    { step_number: 4, action: "Appeal to State Commission (if needed)", description: "If District Forum order is unsatisfactory, appeal to State Commission within 45 days of order.", deadline_days: ESCALATION_DEADLINES.consumer_forum_appeal_state, required_documents: ["Appeal memo", "Certified copy of District Forum order", "Court fee"], authority_type: "consumer_forum_state", status: "upcoming" },
    { step_number: 5, action: "Appeal to NCDRC (if needed)", description: "If State Commission order is unsatisfactory, appeal to NCDRC within 30 days.", deadline_days: ESCALATION_DEADLINES.consumer_forum_appeal_national, required_documents: ["Appeal memo", "Certified copy of State Commission order", "Court fee ₹25,000"], authority_type: "consumer_forum_national", status: "upcoming" },
  ];
}

function getBankingEscalation(): EscalationStep[] {
  return [
    { step_number: 1, action: "File Internal Complaint with Bank", description: "Complain via bank's official grievance portal / email. Keep complaint reference number.", deadline_days: ESCALATION_DEADLINES.internal_grievance, required_documents: ["Written complaint with account details", "Supporting documents"], status: "upcoming" },
    { step_number: 2, action: "Escalate to Bank's Nodal Officer", description: "If no response in 30 days or unsatisfactory reply, escalate to the bank's Principal Nodal Officer (listed on bank's website).", deadline_days: 15, required_documents: ["Copy of original complaint", "Bank's response (if any)"], status: "upcoming" },
    { step_number: 3, action: "File with RBI Ombudsman", description: "File online complaint at cms.rbi.org.in. FREE. The RBI Integrated Ombudsman covers banks, NBFCs, and payment operators.", deadline_days: ESCALATION_DEADLINES.rbi_ombudsman_response, required_documents: ["Online complaint form", "Bank's complaint reference", "Bank's response / proof of 30-day wait"], authority_type: "rbi_ombudsman", filing_fee: 0, status: "upcoming" },
    { step_number: 4, action: "RBI Appellate Authority (if needed)", description: "If RBI Ombudsman order is unsatisfactory, appeal to the Appellate Authority (Deputy Governor, RBI) within 30 days.", deadline_days: ESCALATION_DEADLINES.rbi_appellate, required_documents: ["Appeal letter", "Copy of Ombudsman order"], status: "upcoming" },
    { step_number: 5, action: "File at Consumer Forum", description: "If RBI process is exhausted, file consumer complaint at District Consumer Forum.", deadline_days: 30, required_documents: ["Consumer complaint", "All RBI correspondence", "Bank's responses"], authority_type: "consumer_forum_district", status: "upcoming" },
  ];
}

function getInsuranceEscalation(): EscalationStep[] {
  return [
    { step_number: 1, action: "Complain to Insurance Company", description: "File written complaint with insurer's grievance department. Keep reference number.", deadline_days: ESCALATION_DEADLINES.internal_grievance, required_documents: ["Written complaint", "Policy copy", "Claim documents"], status: "upcoming" },
    { step_number: 2, action: "File with Insurance Ombudsman", description: "If no response in 30 days, file with Insurance Ombudsman (closest to your city). FREE, online via igms.irda.gov.in.", deadline_days: ESCALATION_DEADLINES.insurance_ombudsman_response, required_documents: ["Online complaint form", "Insurer's response / proof of wait", "Policy documents"], authority_type: "insurance_ombudsman", filing_fee: 0, status: "upcoming" },
    { step_number: 3, action: "File at Consumer Forum", description: "If Ombudsman order is unsatisfactory, file consumer complaint.", deadline_days: 30, required_documents: ["Consumer complaint", "Insurance Ombudsman order", "All correspondence"], authority_type: "consumer_forum_district", status: "upcoming" },
  ];
}

function getEmploymentEscalation(): EscalationStep[] {
  return [
    { step_number: 1, action: "Internal Grievance / HR Complaint", description: "File a written grievance with your employer's HR department. Keep dated copies.", deadline_days: ESCALATION_DEADLINES.internal_grievance, required_documents: ["Written grievance letter", "Supporting evidence (payslips, contracts)"], status: "upcoming" },
    { step_number: 2, action: "Send Legal Notice", description: "If internal grievance fails, send a legal notice demanding resolution within 15 days.", deadline_days: ESCALATION_DEADLINES.legal_notice_response, required_documents: ["Legal notice", "Proof of sending"], status: "upcoming" },
    { step_number: 3, action: "File with Labour Commissioner", description: "Approach Labour Commissioner for conciliation. FREE, no lawyer needed.", deadline_days: ESCALATION_DEADLINES.labour_commissioner_conciliation, required_documents: ["Application for conciliation", "Copy of employment contract", "Legal notice + response"], authority_type: "labour_commissioner", filing_fee: 0, status: "upcoming" },
    { step_number: 4, action: "Refer to Labour Court (if conciliation fails)", description: "If conciliation fails, the Labour Commissioner refers the dispute to Labour Court.", deadline_days: 90, required_documents: ["Conciliation report", "Full evidence"], authority_type: "labour_court", status: "upcoming" },
  ];
}

function getPropertyEscalation(): EscalationStep[] {
  return [
    { step_number: 1, action: "Send Legal Notice to Builder", description: "Send a formal legal notice citing RERA violations and demanding resolution.", deadline_days: ESCALATION_DEADLINES.legal_notice_response, required_documents: ["Legal notice", "Proof of sending", "Sale agreement copy"], status: "upcoming" },
    { step_number: 2, action: "File RERA Complaint", description: "File online complaint at state RERA portal. RERA must dispose within 60 days.", deadline_days: ESCALATION_DEADLINES.rera_order_deadline, required_documents: ["Online complaint form", "Sale agreement", "Payment receipts", "Legal notice + response", "Builder's advertisements/brochure"], authority_type: "rera_authority", status: "upcoming" },
    { step_number: 3, action: "Appeal to RERA Appellate Tribunal", description: "If RERA order is unsatisfactory, appeal within 60 days of order.", deadline_days: ESCALATION_DEADLINES.rera_appeal, required_documents: ["Appeal memo", "RERA order copy", "Court fee"], authority_type: "rera_appellate", status: "upcoming" },
    { step_number: 4, action: "File at Consumer Forum (alternative)", description: "Consumer Forum can also hear property disputes. File as deficiency in service.", deadline_days: 30, required_documents: ["Consumer complaint", "All RERA correspondence"], authority_type: "consumer_forum_district", status: "upcoming" },
  ];
}

function getRentalEscalation(): EscalationStep[] {
  return [
    { step_number: 1, action: "Send Written Complaint to Landlord", description: "Send a formal written complaint citing lease violations. Keep dated copies.", deadline_days: 15, required_documents: ["Written complaint", "Rental agreement copy"], status: "upcoming" },
    { step_number: 2, action: "Send Legal Notice", description: "If no response, send a legal notice demanding resolution within 15 days.", deadline_days: ESCALATION_DEADLINES.legal_notice_response, required_documents: ["Legal notice", "Proof of sending"], status: "upcoming" },
    { step_number: 3, action: "File Consumer Complaint", description: "File at District Consumer Forum for illegal deductions, unfair clauses, or deficiency.", deadline_days: 30, required_documents: ["Consumer complaint", "Rental agreement", "Payment receipts", "Legal notice + response", "Photos (if property damage claim)"], authority_type: "consumer_forum_district", status: "upcoming" },
    { step_number: 4, action: "Approach Rent Controller (if applicable)", description: "For eviction or standard rent disputes, approach Rent Controller under state law.", deadline_days: 60, required_documents: ["Application", "Rental agreement", "Proof of tenancy"], authority_type: "rent_controller", status: "upcoming" },
  ];
}

function getGenericEscalation(): EscalationStep[] {
  return [
    { step_number: 1, action: "Send Legal Notice", description: "Send a formal legal notice demanding resolution within 15 days.", deadline_days: ESCALATION_DEADLINES.legal_notice_response, required_documents: ["Legal notice", "Proof of sending"], status: "upcoming" },
    { step_number: 2, action: "File Consumer Complaint", description: "If no response, file at District Consumer Forum.", deadline_days: 30, required_documents: ["Consumer complaint", "Supporting documents", "Legal notice + response"], authority_type: "consumer_forum_district", status: "upcoming" },
    { step_number: 3, action: "Seek Legal Aid", description: "If unable to afford a lawyer, approach DLSA for free legal aid (income < ₹3L).", deadline_days: 30, required_documents: ["Income certificate", "ID proof", "Case documents"], authority_type: "dlsa", status: "upcoming" },
  ];
}
