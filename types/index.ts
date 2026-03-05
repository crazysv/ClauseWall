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