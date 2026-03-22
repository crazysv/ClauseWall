// ============================================
// CLAUSEWALL TYPE DEFINITIONS — INDIA EDITION 🇮🇳
// Matches Supabase database schema exactly
// ============================================

// ============================================
// ENUMS / UNION TYPES
// ============================================

export type RiskLevel = "safe" | "warning" | "dangerous" | "illegal";

export type DocumentType =
  | "rental"
  | "employment"
  | "tos"
  | "loan"
  | "freelance"
  | "sale"
  | "partnership"
  | "nda"
  | "other";

export type AnalysisStatus =
  | "pending"
  | "analyzing"
  | "completed"
  | "failed";

export type EntityType = "landlord" | "employer" | "company" | "other";

export type ReportType = "predatory" | "illegal" | "misleading" | "other";

// ============================================
// DATABASE TABLE INTERFACES
// These match Supabase tables exactly
// ============================================

/**
 * Document - A contract/agreement uploaded by user
 * Table: documents
 */
export interface Document {
  id: string;
  user_id: string | null;
  original_filename: string | null;
  document_type: DocumentType;
  jurisdiction: string;
  detected_jurisdiction: string | null;
  detected_document_type: string | null;
  raw_text: string;
  overall_risk_score: number;
  total_clauses: number;
  safe_count: number;
  warning_count: number;
  dangerous_count: number;
  illegal_count: number;
  entity_name: string | null;
  summary: string | null;
  is_public: boolean;
  analysis_status: AnalysisStatus;
  created_at: string;
  updated_at: string;
  public_share_id: string | null;
  verification_tier: string | null;
  qr_generated_at: string | null;
  share_count: number;
  share_settings: ShareSettings | null;
  power_balance: PowerBalance | null;
  proof_hash: string | null;
  proof_cid: string | null;
  proof_timestamp: string | null;
  proof_status: string | null;
  tsa_token: string | null;
  tsa_serial: string | null;
  state_machine_data: Record<string, unknown> | null;
  deliberation_data?: Record<string, unknown> | null;
  temporal_data?: Record<string, unknown> | null;
  poison_pill_data?: Record<string, unknown> | null;
}

/**
 * Clause - Individual clause extracted from a document
 * Table: clauses
 */
export interface Clause {
  id: string;
  document_id: string;
  clause_number: number;
  original_text: string;
  clause_type: string;
  risk_level: RiskLevel;
  risk_score: number;
  explanation: string;
  legal_issue: string | null;
  legal_citation: string | null;
  statute_code: string | null;
  fair_alternative: string | null;
  red_flags: string[];
  percentile: number | null;
  created_at: string;
  extracted_value: number | null;   
  extracted_unit: string | null;
}

/**
 * LegalRule - Jurisdiction-specific laws (our moat)
 * Table: legal_rules
 */
export interface LegalRule {
  id: string;
  jurisdiction: string;
  document_type: string;
  clause_type: string;
  rule_title: string;
  rule_description: string;
  statute_code: string;
  statute_text: string | null;
  what_makes_it_illegal: string | null;
  max_penalty: string | null;
  source_url: string | null;
  keywords: string[];
  last_verified: string;
  created_at: string;
}

/**
 * FlaggedEntity - Crowdsourced bad actor tracking
 * Table: flagged_entities
 */
export interface FlaggedEntity {
  id: string;
  entity_name: string;
  entity_type: EntityType;
  jurisdiction: string | null;
  total_flags: number;
  common_violations: string[];
  avg_risk_score: number;
  created_at: string;
  updated_at: string;
}

/**
 * Report - User-submitted reports about entities
 * Table: reports
 */
export interface Report {
  id: string;
  document_id: string;
  clause_id: string | null;
  user_id: string | null;
  entity_name: string | null;
  report_type: ReportType;
  description: string | null;
  created_at: string;
}

// ============================================
// AI / ANALYSIS INTERFACES
// Used for AI responses and processing
// ============================================

/**
 * AI response for a single clause analysis
 */
export interface AnalysisResult {
  risk_level: RiskLevel;
  risk_score: number;
  explanation: string;
  legal_issue: string | null;
  applicable_law: string | null;
  fair_alternative: string | null;
  red_flags: string[];
}

/**
 * Single extracted clause before analysis
 */
export interface ExtractedClause {
  clause_number: number;
  clause_type: string;
  text: string;
}

/**
 * Document metadata extracted by AI
 */
export interface DocumentInfo {
  detected_type: DocumentType | string;
  detected_jurisdiction: string | null;
  entity_name: string | null;
  parties: string[];
  agreement_date?: string | null;
  is_stamp_paper?: boolean;
  stamp_value?: string | null;
}

/**
 * Complete extraction result from AI
 */
export interface ExtractionResult {
  clauses: ExtractedClause[];
  document_info: DocumentInfo;
}

/**
 * Complete document analysis result
 */
export interface DocumentAnalysis {
  document: Document;
  clauses: Clause[];
  overall_score: number;
  summary: string;
  risk_breakdown: {
    safe: number;
    warning: number;
    dangerous: number;
    illegal: number;
  };
}

// ============================================
// DEMAND LETTER INTERFACES
// ============================================

/**
 * Generated demand letter
 */
export interface DemandLetter {
  subject: string;
  body: string;
  agencies: string[];
  legal_references: string[];
}

// ============================================
// API / UI INTERFACES
// ============================================

/**
 * Analysis progress tracking
 */
export interface AnalysisProgress {
  document_id: string;
  status: AnalysisStatus;
  progress: number; // 0-100
  current_step: string;
  clauses_analyzed: number;
  total_clauses: number;
}

/**
 * Upload response from API
 */
export interface UploadResponse {
  documentId: string;
  status: AnalysisStatus;
  message?: string;
}

/**
 * API Error response
 */
export interface ApiError {
  error: string;
  code?: string;
  details?: string;
}

// ============================================
// COMPONENT PROPS
// ============================================

/**
 * Props for ClauseCard component
 */
export interface ClauseCardProps {
  clause: Clause;
  isExpanded?: boolean;
  onToggle?: () => void;
  onFlag?: () => void;
}

/**
 * Props for DangerGauge component
 */
export interface DangerGaugeProps {
  score: number;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  animated?: boolean;
}

/**
 * Props for SummaryStats component
 */
export interface SummaryStatsProps {
  totalClauses: number;
  safeCount: number;
  warningCount: number;
  dangerousCount: number;
  illegalCount: number;
}

// ============================================
// HYBRID SYSTEM TYPES
// ============================================

/**
 * StructuredRule — from structured_rules table
 */
export interface StructuredRule {
  id: string;
  clause_type: string;
  jurisdiction: string;
  document_type: string;
  sub_type: string;
  rule_type: 'max_value' | 'min_value' | 'prohibited' | 'required' | 'must_be_mutual' | 'must_be_reasonable' | 'must_disclose';
  limit_value: number | null;
  limit_unit: string | null;
  statute_name: string;
  statute_section: string | null;
  statute_code: string;
  statute_text: string | null;
  severity: RiskLevel;
  base_risk_score: number;
  violation_template: string;
  fair_alternative: string;
  negotiation_script: string;
  penalty: string | null;
  keywords: string[];
  is_active: boolean;
  notes: string | null;
  last_verified: string;
  created_at: string;
}

/**
 * Values extracted from a clause by AI (lightweight extraction)
 */
export interface ExtractedValues {
  clause_type: string;
  primary_value: number | null;
  primary_unit: string | null;
  secondary_value: number | null;
  secondary_unit: string | null;
  property_type: 'residential' | 'commercial' | 'all' | null;
  is_one_sided: boolean;
  favors_party: string | null;
  has_forfeiture: boolean;
  has_penalty: boolean;
  raw_amount_text: string | null;
}

/**
 * Result from rule engine comparison
 */
export interface RuleMatchResult {
  matched: boolean;
  rule: StructuredRule | null;
  violation: boolean;
  violation_description: string | null;
  severity: RiskLevel;
  risk_score: number;
  statute_code: string | null;
  statute_text: string | null;
  fair_alternative: string | null;
  negotiation_script: string | null;
  penalty: string | null;
}

/**
 * Result from hybrid analysis (DB + AI combined)
 */
export interface HybridAnalysisResult {
  risk_level: RiskLevel;
  risk_score: number;
  explanation: string;
  legal_issue: string | null;
  applicable_law: string | null;
  fair_alternative: string | null;
  red_flags: string[];
  verification_source: 'database' | 'ai';
  confidence: 'verified' | 'partial' | 'ai_suggested';
  matched_rule_id: string | null;
  negotiation_script: string | null;
  penalty_info: string | null;
  extracted_value: number | null;    
  extracted_unit: string | null;
  /** Neurosymbolic proof tree (if formal reasoning was applied) */
  proof_tree?: import("@/lib/reasoning/types").ProofTree | null;
}

/**
 * Updated Clause type with verification fields
 */
export interface ClauseWithVerification extends Clause {
  verification_source: 'database' | 'ai';
  matched_rule_id: string | null;
  negotiation_script: string | null;
  penalty_info: string | null;
  confidence: 'verified' | 'partial' | 'ai_suggested';
}

// ============================================
// CONTRACT BUILDER TYPES
// ============================================

export type ContractTemplateType =
  | "rental"
  | "employment"
  | "freelance"
  | "nda"
  | "loan"
  | "partnership"
  | "sale"
  | "service"
  | "mou"
  | "poa";

export interface TemplateField {
  name: string;
  label: string;
  type: "text" | "number" | "date" | "select" | "textarea" | "currency";
  required: boolean;
  placeholder?: string;
  options?: { value: string; label: string }[];
  default?: string | number;
  validation?: {
    min?: number;
    max?: number;
  };
  helpText?: string;
  group?: string;
}

export interface TemplateConfig {
  type: ContractTemplateType;
  name: string;
  description: string;
  icon: string;
  fields: TemplateField[];
  applicableLaws: {
    name: string;
    section: string;
    relevance: string;
  }[];
}

export interface GeneratedContract {
  id: string;
  user_id: string | null;
  template_id: string | null;
  template_type: ContractTemplateType;
  jurisdiction: string;
  input_values: Record<string, string | number | boolean>;
  generated_text: string;
  generated_clauses: GeneratedClause[];
  title: string | null;
  stamp_paper_note: string | null;
  created_at: string;
}

export interface GeneratedClause {
  number: number;
  title: string;
  text: string;
  law_reference: string | null;
  fairness_note: string | null;
}

export interface ContractGenerationRequest {
  template_type: ContractTemplateType;
  jurisdiction: string;
  values: Record<string, string | number | boolean>;
}

export interface ContractGenerationResponse {
  success: boolean;
  contract_id?: string;
  generated_text?: string;
  generated_clauses?: GeneratedClause[];
  title?: string;
  stamp_paper_note?: string;
  error?: string;
}

// ============================================
// PORTFOLIO & DASHBOARD TYPES
// ============================================

export interface PortfolioStats {
  totalContracts: number;
  totalClauses: number;
  safeClausesCount: number;
  warningClausesCount: number;
  dangerousClausesCount: number;
  illegalClausesCount: number;
  averageRiskScore: number;
  estimatedSavings: number;
  contractsBuilt: number;
  riskTrend: "improving" | "stable" | "worsening";
  riskTrendPercentage: number;
}

export interface RiskDataPoint {
  date: string;
  score: number;
  label: string;
  documentType: string;
}

export interface Achievement {
  code: string;
  name: string;
  description: string;
  icon: string;
  unlocked: boolean;
  progress: number;
  target: number;
}

export interface InsightItem {
  icon: string;
  title: string;
  description: string;
  type: "positive" | "warning" | "neutral" | "tip";
}

// ============================================
// COMMUNITY CLAUSE DATABASE TYPES
// ============================================

export interface CommunityClause {
  id: string;
  pattern_hash: string;
  anonymized_text: string;
  clause_type: string;
  risk_level: "dangerous" | "illegal";
  document_type: string;
  jurisdiction: string;
  occurrence_count: number;
  flag_count: number;
  common_legal_issue: string | null;
  common_statute: string | null;
  first_seen_at: string;
  last_seen_at: string;
}

export interface CommunityMatch {
  found: boolean;
  pattern_hash: string;
  occurrence_count: number;
  jurisdictions_seen: string[];
  first_seen_at: string;
  common_legal_issue: string | null;
  match_percentage: number;
  match_type?: "exact" | "semantic" | "fuzzy";
  semantic_stats?: {
    total_similar_patterns: number;
    illegal_percentage: number;
    dangerous_percentage: number;
  } | null;
}

// ============================================
// ANALYSIS PROGRESS TYPES
// ============================================

export interface AnalysisProgressData {
  status: AnalysisStatus;
  progress: number; // 0-100
  step: string;
  clauses_analyzed: number;
  total_clauses: number;
}

// ============================================
// NEGOTIATION PLAYBOOK TYPES
// ============================================

export interface NegotiationScript {
  clause_number: number;
  clause_type: string;
  risk_level: string;
  clause_summary: string;
  opening_statement: string;
  counter_responses: {
    they_say: string;
    you_say: string;
  }[];
  escalation: {
    action: string;
    authority: string;
    law_reference: string;
  };
  strength: "strong" | "moderate" | "weak";
}

export interface NegotiationPlaybook {
  document_type: string;
  jurisdiction: string;
  entity_name: string | null;
  total_issues: number;
  priority_order: string;
  scripts: NegotiationScript[];
  general_tips: string[];
  opening_approach: string;
  closing_statement: string;
}

// ============================================
// QR VERIFICATION TYPES
// ============================================

export type VerificationTier = "verified" | "reviewed" | "needs_work";

export interface ShareSettings {
  show_entity: boolean;
  show_summary: boolean;
  allow_full_analysis: boolean;
}

// ============================================
// CLAUSE AUTOPSY TYPES
// ============================================

export interface AutopsyViolation {
  phrase: string;
  severity: RiskLevel;
  issue: string;
  explanation: string;
  statute: string | null;
  penalty: string | null;
}

export interface AutopsyResult {
  violations: AutopsyViolation[];
  total_violations: number;
  most_severe: RiskLevel;
  dissection_summary: string;
}

export interface AutopsyDisplaySegment {
  text: string;
  type: "violation" | "neutral";
  violation_index?: number;
}

// ============================================
// CONTRACT ROAST TYPES
// ============================================

export interface RoastResult {
  roasts: Record<string, string>; // clauseId → roast text
  total_roasted: number;
}

// ============================================
// ESCAPE PLAN TYPES
// ============================================

export interface VoidClause {
  clause_number: number;
  clause_text: string;
  why_void: string;
  law: string;
  law_explanation: string;
  void_type: "fully_void" | "partially_void";
  enforceable_portion: string | null;
  recoverable_amount: number;
  recovery_method: string;
}

export interface EscapeAuthority {
  name: string;
  for: string;
  jurisdiction: string;
  cost: string;
  timeline: string;
  how_to_file: string;
}

export interface EscapeStep {
  step_number: number;
  title: string;
  description: string;
  action_type: "awareness" | "notice" | "negotiate" | "complaint" | "refund";
  timeframe: string;
  details: string;
  link_to?: "letter" | "negotiate" | null;
  authorities?: EscapeAuthority[];
}

export interface RecoveryBreakdown {
  items: {
    label: string;
    amount: number;
    explanation: string;
  }[];
  interest_rate: string;
  interest_amount: number;
  total: number;
}

export interface EscapePlan {
  severity: "low" | "medium" | "high" | "critical";
  can_escape: boolean;
  summary: string;
  void_clauses: VoidClause[];
  escape_steps: EscapeStep[];
  recovery: RecoveryBreakdown;
  total_recoverable: number;
  estimated_timeline: string;
  success_probability: "low" | "medium" | "high" | "very_high";
  success_explanation: string;
  warnings: string[];
  immediate_actions: string[];
}

// ============================================
// CONTRACT SIMULATOR TYPES
// ============================================

export interface SimUpfrontCost {
  label: string;
  amount: number;
  is_refundable: boolean;
  refund_conditions: string | null;
  fair_amount: number;
  issue: string | null;
}

export interface SimMonthlyCost {
  label: string;
  amount: number;
  escalation_percent: number;
  escalation_frequency_months: number;
  fair_amount: number;
}

export interface SimExitCost {
  label: string;
  amount: number;
  condition: string;
  fair_amount: number;
  issue: string | null;
}

export interface SimPenalty {
  amount: number;
  description: string;
  is_legal: boolean;
  law: string | null;
}

export interface SimDangerZone {
  month_start: number;
  month_end: number;
  label: string;
  description: string;
  severity: "warning" | "critical";
}

export interface SimScenario {
  label: string;
  total_cost: number;
  deposit_returned: number;
  penalty: number;
  net_cost: number;
}

export interface SimulatorData {
  contract_duration_months: number;
  document_type: string;
  upfront_costs: SimUpfrontCost[];
  monthly_costs: SimMonthlyCost[];
  exit_costs: SimExitCost[];
  penalties: {
    early_exit_during_lockin: SimPenalty | null;
    early_exit_after_lockin: SimPenalty | null;
    late_rent_per_day: SimPenalty | null;
  };
  lock_in: {
    months: number;
    applies_to: string;
    is_mutual: boolean;
    fair_months: number;
    issue: string | null;
  };
  notice_period: {
    days: number;
    fair_days: number;
    issue: string | null;
  };
  deposit_refund: {
    total_deposit: number;
    refund_timeline_days: number;
    conditions: string;
    refundable_if_full_term: boolean;
    refundable_if_early_exit: boolean;
    deductions: number;
  };
  danger_zones: SimDangerZone[];
  scenarios: SimScenario[];
  overpayment_vs_fair: number;
  worst_case_total: number;
  fair_contract_total: number;
  summary: string;
}

// ============================================
// POWER BALANCE TYPES
// ============================================

export interface PowerCategory {
  name: string;
  key: string;
  party_a_percent: number;
  party_b_percent: number;
  description: string;
  key_clause: string | null;
}

export interface PowerBalance {
  party_a_name: string;
  party_b_name: string;
  party_a_role: string;
  party_b_role: string;
  overall_party_a: number;
  overall_party_b: number;
  categories: PowerCategory[];
  verdict: string;
  verdict_description: string;
  fairness_score: number;
}

// ============================================
// CLAUSE REWRITE TYPES
// ============================================

export interface RewriteChange {
  label: string;
  original: string;
  rewritten: string;
  legal_basis: string | null;
}

export interface RewriteResult {
  rewritten_clause: string;
  changes: RewriteChange[];
  total_changes: number;
  legal_compliance_note: string;
  tone: "formal" | "friendly" | "assertive";
}

// ============================================
// ADVERSARIAL CLAUSE DETECTION TYPES
// ============================================

export type DeceptionSeverity = "low" | "medium" | "high";

export type DeceptionLevel = "none" | "low" | "medium" | "high" | "extreme";

export interface DisguiseTechnique {
  technique: string;
  label: string;
  phrase: string;
  explanation: string;
  severity: DeceptionSeverity;
}

export interface AdversarialResult {
  deception_score: number;
  deception_level: DeceptionLevel;
  disguise_techniques: DisguiseTechnique[];
  decoded_meaning: string;
  hidden_powers: string[];
  cross_references: string[];
  vague_terms: string[];
  one_sided_triggers: string[];
  surface_reading: string;
  true_reading: string;
  risk_amplification: number;
}

// ============================================
// COLLABORATIVE REVIEW TYPES
// ============================================

export interface CollabRoom {
  id: string;
  document_id: string;
  room_code: string;
  created_by: string | null;
  host_name: string;
  host_session_id: string;
  is_active: boolean;
  max_participants: number;
  expires_at: string;
  created_at: string;
}

export interface CollabParticipant {
  user_id: string;
  user_name: string;
  user_color: string;
  role: "host" | "collaborator" | "viewer";
  current_clause: string | null;
  joined_at: string;
}

export interface CollabAnnotation {
  id: string;
  room_id: string;
  clause_id: string;
  author_id: string;
  author_name: string;
  author_color: string;
  content: string;
  parent_id: string | null;
  reactions: Record<string, number>;
  created_at: string;
}

export interface CollabVote {
  id: string;
  room_id: string;
  clause_id: string;
  voter_id: string;
  voter_name: string;
  vote: "negotiate" | "accept" | "reject";
  created_at: string;
}

export interface VoteSummary {
  clause_id: string;
  negotiate_count: number;
  accept_count: number;
  reject_count: number;
  total_voters: number;
  consensus: boolean;
  consensus_action: string | null;
}

export interface CollabRoomState {
  room: CollabRoom;
  participants: CollabParticipant[];
  annotations: Record<string, CollabAnnotation[]>;
  votes: Record<string, VoteSummary>;
}

// ============================================
// CONTRACT TIME BOMB DEFUSER TYPES
// ============================================

export type DeadlineType =
  | "notice_period"
  | "renewal_window"
  | "penalty_trigger"
  | "lock_in_expiry"
  | "grace_period"
  | "escalation"
  | "payment_due"
  | "auto_renewal"
  | "termination_window"
  | "price_increase"
  | "review_period"
  | "warranty_expiry"
  | "dispute_deadline"
  | "compliance_deadline"
  | "other";

export type DeadlineUrgency = "critical" | "high" | "medium" | "low";

export type DeadlineSeverity = "catastrophic" | "major" | "moderate" | "minor";

export type DeadlineStatus =
  | "upcoming"
  | "warning"
  | "urgent"
  | "action_taken"
  | "missed"
  | "expired"
  | "defused";

export type ActionTemplateType =
  | "termination_notice"
  | "renewal_rejection"
  | "refund_request"
  | "payment_reminder"
  | "dispute_notice"
  | "compliance_report"
  | "general_notice"
  | "none";

export interface ExtractedDeadline {
  deadline_type: DeadlineType;
  title: string;
  description: string;
  clause_reference: string;
  clause_number: number;
  relative_days: number;
  relative_description: string;
  is_recurring: boolean;
  recurrence_interval_days: number | null;
  financial_impact: number | null;
  financial_description: string;
  consequence_if_missed: string;
  consequence_severity: DeadlineSeverity;
  action_required: string;
  action_template_type: ActionTemplateType;
  linked_deadline_index: number | null;
  warning_days: number[];
}

export interface DeadlineChain {
  chain_name: string;
  description: string;
  deadline_indices: number[];
  total_financial_risk: number;
  chain_type: "sequential" | "parallel" | "conditional";
}

export interface TemporalExtractionResult {
  signing_date_detected: string | null;
  contract_duration_days: number | null;
  contract_end_date_relative: number | null;
  deadlines: ExtractedDeadline[];
  deadline_chains: DeadlineChain[];
  overall_temporal_risk: "low" | "medium" | "high" | "extreme";
  temporal_risk_summary: string;
}

export interface ContractDeadline {
  id: string;
  document_id: string;
  user_id: string;
  clause_id: string | null;
  deadline_date: string;
  warning_start_date: string;
  deadline_type: DeadlineType;
  title: string;
  description: string;
  financial_impact: number | null;
  financial_description: string;
  consequence_if_missed: string;
  consequence_severity: DeadlineSeverity;
  action_required: string;
  action_template: string | null;
  status: DeadlineStatus;
  urgency: DeadlineUrgency;
  is_recurring: boolean;
  recurrence_interval_days: number | null;
  next_occurrence_date: string | null;
  reminder_30d_sent: boolean;
  reminder_14d_sent: boolean;
  reminder_7d_sent: boolean;
  reminder_3d_sent: boolean;
  reminder_1d_sent: boolean;
  reminder_today_sent: boolean;
  created_at: string;
  updated_at: string;
}

export interface DeadlineReminderSettings {
  user_id: string;
  telegram_chat_id: string | null;
  telegram_enabled: boolean;
  email_enabled: boolean;
  push_enabled: boolean;
  push_subscription: string | null;
  in_app_enabled: boolean;
  reminder_time: string;
  timezone: string;
}

export interface DeadlineNotification {
  id: string;
  user_id: string;
  deadline_id: string;
  notification_type: "telegram" | "email" | "push" | "in_app";
  days_before: number;
  sent_at: string;
  delivered: boolean;
  read: boolean;
}

export interface TimelineEvent {
  date: string;
  deadline: ContractDeadline;
  position: "past" | "today" | "upcoming" | "far";
  days_from_now: number;
  urgency_color: string;
}

export interface ICSEvent {
  title: string;
  description: string;
  start_date: Date;
  end_date: Date;
  alarms: { days_before: number }[];
  location: string;
  url: string;
}

export interface DeadlineStats {
  total: number;
  critical: number;
  high: number;
  medium: number;
  low: number;
  defused: number;
  missed: number;
  total_financial_exposure: number;
  next_critical: ContractDeadline | null;
}

// ============================================
// CROSS-CONTRACT VAULT TYPES
// ============================================

export type ConflictType =
  | "direct_contradiction"
  | "obligation_overlap"
  | "ip_conflict"
  | "non_compete_clash"
  | "exclusivity_violation"
  | "jurisdiction_conflict"
  | "confidentiality_breach"
  | "time_commitment_impossible"
  | "financial_conflict"
  | "termination_cascade"
  | "insurance_gap"
  | "coverage_overlap"
  | "other";

export type ConflictSeverity = "critical" | "high" | "medium" | "low";

export type GapCategory =
  | "health_insurance"
  | "life_insurance"
  | "disability"
  | "dental"
  | "vision"
  | "accident"
  | "liability"
  | "legal_protection"
  | "ip_protection"
  | "termination_protection"
  | "notice_period"
  | "severance"
  | "gratuity"
  | "retirement"
  | "maternity"
  | "data_privacy"
  | "dispute_resolution"
  | "other";

export type WhatIfScenario =
  | "job_loss"
  | "city_relocation"
  | "marriage"
  | "divorce"
  | "child_birth"
  | "disability"
  | "hospitalization"
  | "business_start"
  | "property_purchase"
  | "loan_default"
  | "death"
  | "retirement"
  | "company_acquisition"
  | "lawsuit"
  | "natural_disaster"
  | "custom";

export interface CrossContractConflict {
  id: string;
  conflict_type: ConflictType;
  severity: ConflictSeverity;
  title: string;
  description: string;
  document_a_id: string;
  document_a_title: string;
  document_a_clause: string;
  document_a_clause_number: number;
  document_b_id: string;
  document_b_title: string;
  document_b_clause: string;
  document_b_clause_number: number;
  legal_implication: string;
  legal_citation: string | null;
  resolution_suggestion: string;
  financial_risk: number | null;
  affects_documents: string[];
}

export interface CoverageGap {
  id: string;
  category: GapCategory;
  title: string;
  description: string;
  importance: "essential" | "recommended" | "optional";
  estimated_annual_risk: number | null;
  contracts_checked: string[];
  suggestion: string;
}

export interface CascadingFailure {
  id: string;
  trigger_event: string;
  trigger_document_id: string;
  trigger_document_title: string;
  chain: CascadeStep[];
  total_financial_impact: number;
  probability: "likely" | "possible" | "unlikely";
  prevention_steps: string[];
}

export interface CascadeStep {
  step_number: number;
  document_id: string;
  document_title: string;
  clause_reference: string;
  what_happens: string;
  financial_impact: number | null;
  time_delay: string;
  can_be_prevented: boolean;
  prevention_action: string | null;
}

export interface FinancialExposure {
  total_worst_case: number;
  total_monthly_obligations: number;
  total_deposits_at_risk: number;
  total_penalties_possible: number;
  by_contract: ContractExposure[];
  by_category: CategoryExposure[];
}

export interface ContractExposure {
  document_id: string;
  document_title: string;
  document_type: string;
  monthly_obligation: number;
  deposits: number;
  max_penalty: number;
  worst_case_total: number;
}

export interface CategoryExposure {
  category: string;
  total: number;
  contracts: string[];
}

export interface UnifiedObligation {
  id: string;
  document_id: string;
  document_title: string;
  document_type: string;
  obligation_type: "payment" | "action" | "restriction" | "deadline";
  title: string;
  description: string;
  frequency:
    | "one_time"
    | "daily"
    | "weekly"
    | "monthly"
    | "quarterly"
    | "semi_annual"
    | "annual"
    | "on_event";
  amount: number | null;
  next_due: string | null;
  risk_if_missed: string;
  risk_level: RiskLevel;
}

export interface WhatIfResult {
  scenario: WhatIfScenario;
  scenario_title: string;
  scenario_description: string;
  affected_contracts: WhatIfContractImpact[];
  total_financial_impact: number;
  immediate_actions: string[];
  timeline: WhatIfTimelineStep[];
  overall_severity:
    | "devastating"
    | "severe"
    | "moderate"
    | "manageable"
    | "minimal";
  protection_score: number;
}

export interface WhatIfContractImpact {
  document_id: string;
  document_title: string;
  document_type: string;
  impact_level: "terminated" | "breached" | "modified" | "unaffected";
  impact_description: string;
  financial_impact: number | null;
  clauses_triggered: string[];
  rights_lost: string[];
  rights_gained: string[];
}

export interface WhatIfTimelineStep {
  day: number;
  title: string;
  description: string;
  contracts_affected: string[];
  financial_impact: number | null;
  action_required: string | null;
}

export interface VaultAnalysisResult {
  id: string;
  user_id: string;
  analyzed_at: string;
  document_ids: string[];
  conflicts: CrossContractConflict[];
  coverage_gaps: CoverageGap[];
  cascading_failures: CascadingFailure[];
  financial_exposure: FinancialExposure;
  unified_obligations: UnifiedObligation[];
  risk_score: number;
  risk_summary: string;
  what_if_results: WhatIfResult[];
}

export interface VaultSummaryStats {
  total_contracts: number;
  total_clauses: number;
  total_conflicts: number;
  critical_conflicts: number;
  coverage_gaps: number;
  essential_gaps: number;
  total_financial_exposure: number;
  total_monthly_obligations: number;
  cascading_failure_chains: number;
  overall_vault_risk: "low" | "medium" | "high" | "extreme";
  worst_scenario: string;
  worst_scenario_impact: number;
}

// ==================== POISON PILL INTERCONNECTION TYPES ====================

export type TrapPatternType =
  | 'infinite_loop'
  | 'escalation_trap'
  | 'waiver_chain'
  | 'scope_creep'
  | 'silent_amendment'
  | 'deposit_trap'
  | 'termination_asymmetry'
  | 'insurance_void'
  | 'jurisdiction_trap'
  | 'data_hostage'
  | 'custom';

export type TrapSeverity = 'devastating' | 'severe' | 'moderate' | 'minor';

export interface ClauseConnection {
  from_clause_number: number;
  to_clause_number: number;
  connection_type:
    | 'enables'
    | 'amplifies'
    | 'blocks_escape'
    | 'triggers'
    | 'compounds'
    | 'overrides'
    | 'references'
    | 'depends_on';
  description: string;
  strength: 'strong' | 'moderate' | 'weak';
}

export interface TrapMechanism {
  step_number: number;
  clause_number: number;
  clause_type: string;
  clause_text_snippet: string;
  role_in_trap: string;
  individual_risk: RiskLevel;
  contribution_to_trap: string;
}

export interface PoisonPillTrap {
  id: string;
  pattern_type: TrapPatternType;
  trap_name: string;
  severity: TrapSeverity;
  title: string;
  description: string;
  how_it_works: string;
  real_world_impact: string;
  mechanisms: TrapMechanism[];
  connections: ClauseConnection[];
  individual_risk_average: number;
  combined_risk_score: number;
  risk_multiplier: number;
  financial_worst_case: number | null;
  financial_explanation: string;
  trigger_event: string;
  escape_difficulty: 'impossible' | 'very_hard' | 'hard' | 'moderate' | 'easy';
  escape_options: string[];
  legal_citations: string[];
  negotiation_priority: 'must_change' | 'should_change' | 'nice_to_change';
  which_clause_to_target: number;
  why_target_this_clause: string;
}

export interface InterconnectionNode {
  clause_number: number;
  clause_type: string;
  clause_text_snippet: string;
  risk_level: RiskLevel;
  x: number;
  y: number;
  is_part_of_trap: boolean;
  trap_ids: string[];
  connection_count: number;
}

export interface InterconnectionEdge {
  from_clause: number;
  to_clause: number;
  connection_type: ClauseConnection['connection_type'];
  strength: ClauseConnection['strength'];
  trap_id: string | null;
  label: string;
}

export interface InterconnectionCluster {
  id: string;
  clause_numbers: number[];
  trap_id: string | null;
  density: number;
  risk_level: RiskLevel;
}

export interface InterconnectionGraph {
  nodes: InterconnectionNode[];
  edges: InterconnectionEdge[];
  clusters: InterconnectionCluster[];
}

export interface NegotiationTarget {
  priority: number;
  clause_number: number;
  clause_type: string;
  why: string;
  traps_broken: string[];
  difficulty: 'easy' | 'medium' | 'hard';
  suggested_change: string;
}

export interface PoisonPillAnalysisResult {
  traps: PoisonPillTrap[];
  graph: InterconnectionGraph;
  combined_trap_score: number;
  trap_density: number;
  most_dangerous_trap: PoisonPillTrap | null;
  most_connected_clause: number | null;
  risk_amplification_summary: string;
  negotiation_roadmap: NegotiationTarget[];
}