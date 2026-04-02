// ============================================
// WATCHDOG INTERNAL TYPES
// Types used internally by the watchdog subsystem
// ============================================

/** Configuration for scraping a specific ToS page */
export interface ScrapeConfig {
  /** CSS selector for the main content area */
  contentSelector?: string;
  /** Additional selectors to remove (ads, banners) */
  removeSelectors?: string[];
  /** Custom headers (e.g. for sites that require Accept-Language) */
  headers?: Record<string, string>;
  /** Whether to follow redirects */
  followRedirects?: boolean;
  /** Timeout in ms */
  timeout?: number;
}

/** Result from the scraping engine */
export interface ScrapeResult {
  success: boolean;
  raw_html: string | null;
  clean_text: string | null;
  text_hash: string;
  word_count: number;
  scrape_duration_ms: number;
  sections: TextSection[];
  error?: string;
  status_code?: number;
  blocked?: boolean;
}

/** A section of extracted text */
export interface TextSection {
  title: string;
  content: string;
}

/** Result from text cleaning */
export interface CleanTextResult {
  clean_text: string;
  sections: TextSection[];
  word_count: number;
}

/** Paragraph-level diff result (before AI analysis) */
export interface ParagraphDiff {
  type: "added" | "removed" | "modified" | "unchanged";
  old_text: string;
  new_text: string;
  /** Index in the old text paragraphs array */
  old_index: number;
  /** Index in the new text paragraphs array */
  new_index: number;
}

/** Batch of changes sent to Groq for semantic analysis */
export interface DiffBatch {
  changes: ParagraphDiff[];
  batch_index: number;
}

/** Groq response for semantic diff */
export interface SemanticDiffResponse {
  changes: Array<{
    section_title: string;
    old_text: string;
    new_text: string;
    change_type: string;
    severity: string;
    direction: string;
    user_impact_summary: string;
    legal_implications: string;
    affected_user_actions: string[];
    confidence: number;
  }>;
  overall_summary: string;
  overall_direction: string;
}

/** Score calculation input data */
export interface ScoreInput {
  current_changes: Array<{
    direction: string;
    severity: string;
    change_type: string;
  }>;
  total_changes_12mo: number;
  pro_company_12mo: number;
  pro_consumer_12mo: number;
  has_mandatory_arbitration: boolean;
  has_data_sharing_without_consent: boolean;
  has_unilateral_modification: boolean;
  has_no_refund: boolean;
  has_excessive_liability_limit: boolean;
  has_auto_renewal_no_notice: boolean;
  has_clear_cancellation: boolean;
  has_data_deletion_rights: boolean;
  has_grievance_mechanism: boolean;
  has_consumer_court_preserved: boolean;
  has_advance_notice_changes: boolean;
  has_no_dark_patterns: boolean;
  readability_score: number;
}

/** Company seed data entry */
export interface CompanySeedEntry {
  name: string;
  slug: string;
  sector: string;
  website: string;
  logo_url: string | null;
  tos_urls: Array<{ label: string; url: string; type: string }>;
  scrape_config?: ScrapeConfig;
  scrape_frequency?: string;
}

/** Cron job result summary */
export interface CronRunResult {
  companies_processed: number;
  companies_skipped: number;
  changes_detected: number;
  alerts_sent: number;
  errors: string[];
  duration_ms: number;
}

/** Company profile for watchdog tracking */
export interface WatchdogCompany {
  id: string;
  name: string;
  slug: string;
  sector?: string;
  industry?: string;
  description?: string;
  website?: string;
  logo_url?: string | null;
  tos_score?: number;
  last_change_date?: string | null;
  total_changes?: number;
  created_at?: string;
  updated_at?: string;
}

/** A detected change in a company's ToS */
export interface WatchdogChange {
  id: string;
  company_id?: string;
  date: string;
  type: string;
  direction: "better" | "worse" | "neutral";
  summary: string;
  diff_before?: string;
  diff_after?: string;
  severity?: string;
  section_title?: string;
  user_impact_summary?: string;
  legal_implications?: string;
  confidence?: number;
}

/** Alert/notification for watchdog changes */
export interface WatchdogAlert {
  id: string;
  title: string;
  message?: string;
  company_id?: string;
  company_name?: string;
  change_id?: string;
  severity?: "info" | "warning" | "critical";
  read: boolean;
  created_at?: string;
}
