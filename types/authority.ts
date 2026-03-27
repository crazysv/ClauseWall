// ============================================
// CLAUSEWALL — LEGAL AUTHORITY CONNECTOR TYPES
// ============================================

// ---- Authority Type Enums ----

export type AuthorityType =
  | "consumer_forum_district"
  | "consumer_forum_state"
  | "consumer_forum_national"
  | "rera_authority"
  | "rera_appellate"
  | "labour_commissioner"
  | "labour_court"
  | "industrial_tribunal"
  | "rent_controller"
  | "rent_court"
  | "rbi_ombudsman"
  | "insurance_ombudsman"
  | "banking_ombudsman"
  | "epfo_regional"
  | "esic_regional"
  | "cat_bench"
  | "sat_bench"
  | "civil_court_district"
  | "small_causes_court"
  | "commercial_court"
  | "high_court"
  | "dlsa"
  | "slsa"
  | "nalsa"
  | "women_commission_state"
  | "women_commission_national"
  | "sc_st_commission_state"
  | "sc_st_commission_national"
  | "information_commission_state"
  | "information_commission_central"
  | "police_station"
  | "cyber_crime_cell"
  | "other";

export type JurisdictionLevel =
  | "district"
  | "city"
  | "state"
  | "regional"
  | "national";

export type DisputeCategory =
  | "consumer"
  | "employment"
  | "rental"
  | "banking"
  | "insurance"
  | "government"
  | "property"
  | "freelance"
  | "telecom"
  | "ecommerce"
  | "other";

export type CounterpartyType =
  | "company"
  | "individual"
  | "government"
  | "bank"
  | "nbfc"
  | "insurance"
  | "builder"
  | "employer"
  | "landlord"
  | "telecom"
  | "other";

export type EscalationStepStatus =
  | "upcoming"
  | "pending"
  | "completed"
  | "overdue"
  | "skipped";

export type LegalAidProviderType =
  | "dlsa"
  | "slsa"
  | "nalsa"
  | "tele_law"
  | "law_school_clinic"
  | "ngo"
  | "pro_bono_panel"
  | "legal_helpline"
  | "women_helpline"
  | "other";

// ---- Filing Fee Types ----

export interface FeeTier {
  claim_min: number;
  claim_max: number | null;
  fee: number;
}

export interface FilingFeeStructure {
  base_fee?: number;
  fee_tiers?: FeeTier[];
  additional_fees?: Record<string, number>;
  payment_methods?: string[];
  fee_waiver_available?: boolean;
  fee_waiver_conditions?: string;
}

export interface FilingStep {
  step: number;
  description: string;
  required: boolean;
}

// ---- Legal Authority (DB Record) ----

export interface LegalAuthority {
  id: string;
  name: string;
  short_name: string | null;
  authority_type: AuthorityType;
  jurisdiction_level: JurisdictionLevel;
  state_code: string | null;
  city: string | null;
  district: string | null;
  covers_districts: string[];
  covers_states: string[];
  claim_amount_min: number;
  claim_amount_max: number | null;
  handles_document_types: string[];
  handles_dispute_types: string[];
  physical_address: string | null;
  pincode: string | null;
  phone_numbers: string[];
  email: string | null;
  website: string | null;
  e_filing_portal_url: string | null;
  e_filing_instructions: string | null;
  google_maps_url: string | null;
  latitude: number | null;
  longitude: number | null;
  working_hours: string | null;
  working_days: string | null;
  closed_on: string | null;
  lunch_break: string | null;
  filing_fee_structure: FilingFeeStructure;
  required_documents: string[];
  filing_process_steps: FilingStep[];
  typical_resolution_days: number | null;
  current_backlog: string | null;
  success_rate_estimate: number | null;
  last_verified_at: string | null;
  presiding_officer_name: string | null;
  presiding_officer_designation: string | null;
  has_e_filing: boolean;
  has_video_hearing: boolean;
  has_online_tracking: boolean;
  has_online_payment: boolean;
  online_tracking_url: string | null;
  parent_authority_id: string | null;
  escalation_authority_id: string | null;
  escalation_deadline_days: number | null;
  escalation_conditions: string | null;
  notes: string | null;
  data_source: string | null;
  is_active: boolean;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
}

// ---- Authority Subsets ----

export interface AuthorityContactInfo {
  phone_numbers: string[];
  email: string | null;
  website: string | null;
  e_filing_portal_url: string | null;
  google_maps_url: string | null;
  physical_address: string | null;
  pincode: string | null;
}

export interface AuthorityFilingInfo {
  filing_fee_structure: FilingFeeStructure;
  required_documents: string[];
  filing_process_steps: FilingStep[];
  has_e_filing: boolean;
  e_filing_portal_url: string | null;
  e_filing_instructions: string | null;
}

export interface AuthorityPerformanceInfo {
  typical_resolution_days: number | null;
  current_backlog: string | null;
  success_rate_estimate: number | null;
  last_verified_at: string | null;
}

// ---- Jurisdiction Routing ----

export interface JurisdictionRule {
  id: string;
  document_type: string | null;
  dispute_category: string | null;
  clause_types: string[];
  counterparty_type: string | null;
  jurisdiction_state: string | null;
  claim_amount_min: number | null;
  claim_amount_max: number | null;
  additional_conditions: Record<string, unknown>;
  authority_type: AuthorityType;
  priority: number;
  reasoning: string;
  not_this_reason: string | null;
  applicable_law: string | null;
  applicable_section: string | null;
  is_active: boolean;
  created_at: string;
}

export interface JurisdictionQuery {
  document_type: string;
  jurisdiction: string;
  claim_amount?: number;
  counterparty_type?: CounterpartyType;
  clause_types?: string[];
  entity_name?: string;
  additional_conditions?: Record<string, unknown>;
}

export interface AuthorityRecommendation {
  authority: LegalAuthority;
  reasoning: string;
  applicable_law: string | null;
  applicable_section: string | null;
  priority: number;
  confidence: "high" | "medium" | "low";
  filing_fee?: number;
}

export interface NotThisAuthority {
  authority_type: AuthorityType;
  authority_name: string;
  reason_not_applicable: string;
}

export interface JurisdictionResult {
  primary: AuthorityRecommendation | null;
  alternatives: AuthorityRecommendation[];
  not_these: NotThisAuthority[];
  dispute_category: DisputeCategory;
  query: JurisdictionQuery;
}

// ---- Escalation Types ----

export interface EscalationStep {
  step_number: number;
  action: string;
  description: string;
  authority_id?: string;
  authority_name?: string;
  authority_type?: AuthorityType;
  deadline_days: number;
  required_documents: string[];
  filing_fee?: number;
  status: EscalationStepStatus;
  date?: string;
  deadline_date?: string;
  notes?: string;
  outcome?: "no_response" | "partial_response" | "resolved" | null;
}

export interface EscalationPath {
  steps: EscalationStep[];
  current_step: number;
  total_steps: number;
  dispute_category: DisputeCategory;
  document_type: string;
}

export interface EscalationTracking {
  id: string;
  user_id: string;
  document_id: string | null;
  current_step: number;
  current_authority_id: string | null;
  steps: EscalationStep[];
  status: "active" | "paused" | "resolved" | "escalated" | "abandoned";
  resolution_summary: string | null;
  created_at: string;
  updated_at: string;
}

export interface EscalationDeadline {
  step_number: number;
  action: string;
  deadline_date: string;
  days_remaining: number;
  is_overdue: boolean;
}

// ---- Legal Aid Types ----

export interface LegalAidProvider {
  id: string;
  provider_type: LegalAidProviderType;
  name: string;
  description: string | null;
  state_code: string | null;
  city: string | null;
  district: string | null;
  address: string | null;
  pincode: string | null;
  phone_numbers: string[];
  email: string | null;
  website: string | null;
  helpline_number: string | null;
  income_threshold: number | null;
  eligible_categories: string[];
  eligibility_description: string | null;
  services_offered: string[];
  languages: string[];
  operating_hours: string | null;
  is_free: boolean;
  is_active: boolean;
  last_verified_at: string | null;
  created_at: string;
}

export interface LegalAidQuery {
  annual_income?: number;
  category?: string;
  state: string;
  city?: string;
  gender?: string;
  age?: number;
  is_disabled?: boolean;
}

export interface LegalAidEligibility {
  is_eligible: boolean;
  reasons: string[];
  eligible_categories: string[];
}

export interface Helpline {
  name: string;
  number: string;
  hours: string;
  description: string;
}

export interface LegalAidResult {
  eligibility: LegalAidEligibility;
  providers: LegalAidProvider[];
  helplines: Helpline[];
}

// ---- RTI Types ----

export interface RTIQuestion {
  question: string;
  context: string;
  related_clause_type?: string;
}

export interface RTIApplication {
  recipient_authority: string;
  recipient_address: string;
  subject: string;
  questions: string[];
  applicant_name: string;
  applicant_address: string;
  fee_amount: number;
  fee_methods: string[];
  full_text: string;
  date: string;
}

export interface RTIPreview {
  formatted_text: string;
  pdf_ready: boolean;
  recipient_authority: string;
  questions: string[];
}

// ---- Complaint Types ----

export interface ComplaintDraft {
  subject: string;
  body: string;
  authority_name: string;
  authority_type: AuthorityType;
  format: string;
  attachments_needed: string[];
}

export interface ComplaintEmailData {
  to: string;
  subject: string;
  body: string;
  cc: string | null;
  attachments_needed: string[];
}

// ---- Connectivity Types ----

export interface ConnectivityLinks {
  tel_url: string | null;
  mailto_url: string | null;
  website_url: string | null;
  maps_url: string | null;
  efiling_url: string | null;
}

// ---- Authority Routing (stored on document) ----

export interface AuthorityRouting {
  primary_authority_id: string | null;
  primary_authority_name: string | null;
  primary_authority_type: AuthorityType | null;
  alternative_ids: string[];
  dispute_category: DisputeCategory;
  claim_amount_estimate: number | null;
  routing_reasoning: string;
  filing_fee_estimate: number | null;
  e_filing_available: boolean;
}

// ---- Fee Calculation Result ----

export interface FeeCalculationResult {
  fee: number;
  breakdown: { item: string; amount: number }[];
  waiver_available: boolean;
  waiver_conditions: string;
  payment_methods: string[];
}

// ---- Search / Filter Types ----

export interface AuthoritySearchQuery {
  search_text?: string;
  authority_type?: AuthorityType;
  state?: string;
  city?: string;
  jurisdiction_level?: JurisdictionLevel;
  has_e_filing?: boolean;
  limit?: number;
  offset?: number;
}

// ---- Report Issue ----

export interface AuthorityIssueReport {
  authority_id: string;
  user_id?: string;
  issue_type: "wrong_phone" | "wrong_email" | "wrong_address" | "closed" | "moved" | "other";
  description: string;
  suggested_correction?: string;
}
