// ============================================
// SMART EVIDENCE CHAIN BUILDER — TYPE DEFINITIONS
// All types for the evidence system
// ============================================

// ── Enums / Literal Types ──

export type EvidenceCaseStatus = "active" | "archived" | "submitted" | "resolved";

export type CounterpartyType =
  | "landlord" | "employer" | "company" | "bank" | "broker"
  | "builder" | "service_provider" | "individual" | "government" | "other";

export type DisputeType =
  | "rental" | "employment" | "consumer" | "financial" | "property"
  | "service" | "insurance" | "telecom" | "ecommerce" | "other";

export type EvidenceType =
  | "contract" | "email" | "whatsapp_chat" | "whatsapp_message"
  | "audio_recording" | "photo" | "video_reference" | "payment_receipt"
  | "website_archive" | "company_data" | "property_listing"
  | "document" | "screenshot" | "tos_archive" | "communication";

export type EvidenceSource =
  | "manual_upload" | "whatsapp_export" | "eml_import"
  | "url_archive" | "mca_fetch" | "ocr_capture";

export type ProcessingStatus = "uploading" | "processing" | "completed" | "failed";

export type BundleType = "full" | "chronological" | "issue_wise" | "custom";

export type PaymentMethod = "UPI" | "bank_transfer" | "cash" | "cheque" | "card" | "other";

// ── Core Models ──

export interface EvidenceCase {
  id: string;
  user_id: string;
  document_id: string | null;

  title: string;
  description: string | null;
  counterparty_name: string;
  counterparty_type: CounterpartyType;
  counterparty_details: CounterpartyDetails;

  dispute_type: DisputeType | null;
  dispute_description: string | null;

  total_items: number;
  chain_root_hash: string | null;
  chain_verified: boolean;
  last_chain_verification: string | null;

  status: EvidenceCaseStatus;
  storage_used_bytes: number;

  created_at: string;
  updated_at: string;
}

export interface CounterpartyDetails {
  cin?: string;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
  directors?: CompanyDirector[];
  [key: string]: unknown;
}

export interface EvidenceItem {
  id: string;
  case_id: string;
  user_id: string;

  sequence_number: number;
  evidence_type: EvidenceType;

  title: string;
  description: string | null;

  // File storage
  original_filename: string | null;
  storage_path: string | null;
  file_size_bytes: number;
  mime_type: string | null;
  thumbnail_path: string | null;

  // Cryptographic chain
  content_hash: string;
  chain_hash: string;
  previous_item_id: string | null;
  timestamp_proof: TimestampProof | null;
  hash_algorithm: string;

  // Extracted data (type-specific)
  extracted_data: ExtractedData;

  // Metadata
  captured_at: string;
  source: EvidenceSource | null;
  location_data: LocationData | null;
  tags: string[];
  issue_category: string | null;
  notes: string | null;

  // Legal
  is_certified: boolean;
  certificate_id: string | null;

  // Status
  processing_status: ProcessingStatus;
  processing_error: string | null;

  created_at: string;
  updated_at: string;
}

export interface EvidenceCertificate {
  id: string;
  evidence_item_id: string;
  case_id: string;
  user_id: string;

  certificate_data: Section65BData;
  pdf_storage_path: string | null;

  generated_at: string;
  is_signed: boolean;
  signed_at: string | null;
}

export interface EvidenceBundle {
  id: string;
  case_id: string;
  user_id: string;

  bundle_type: BundleType;
  title: string;
  included_item_ids: string[];

  pdf_storage_path: string | null;
  total_pages: number | null;
  file_size_bytes: number | null;

  bundle_hash: string;
  chain_root_hash: string | null;
  timestamp_proof: TimestampProof | null;

  config: BundleConfig;
  generated_at: string;
}

// ── Section 65B Certificate ──

export interface Section65BData {
  electronic_record_description: string;
  production_manner: string;
  device_description: string;
  device_was_operating_properly: boolean;
  information_derived_from: string;
  accuracy_statement: string;
  person_in_charge_name: string;
  person_in_charge_designation: string;
  person_in_charge_address: string;
  date_of_certificate: string;
  place_of_certificate: string;
  content_hash: string;
  hash_algorithm: string;
  timestamp_proof: string | null;
  original_format: string;
  storage_medium: string;
}

// ── Chain / Crypto ──

export interface TimestampProof {
  authority?: string;
  timestamp?: string;
  serial?: string;
  protocol?: string;
  token?: string;
}

export interface ChainLink {
  item_id: string;
  sequence_number: number;
  content_hash: string;
  chain_hash: string;
  previous_chain_hash: string | null;
  timestamp: string;
  verified: boolean;
}

export interface ChainVerificationResult {
  valid: boolean;
  total_items: number;
  verified_items: number;
  broken_at: number | null;
  details: string[];
}

export interface MerkleNode {
  hash: string;
  left: MerkleNode | null;
  right: MerkleNode | null;
}

export interface MerkleTree {
  root: string;
  levels: string[][];
  leaf_count: number;
}

export interface MerkleProof {
  leaf_hash: string;
  proof: Array<{ hash: string; position: "left" | "right" }>;
  root: string;
}

// ── Parser Output Types ──

export interface WhatsAppMessage {
  sender: string;
  timestamp: Date | string;
  text: string;
  media_type: string | null;
  is_system_message: boolean;
}

export interface WhatsAppChat {
  participants: string[];
  message_count: number;
  date_range: { start: string; end: string };
  messages: WhatsAppMessage[];
  chat_type: "individual" | "group";
}

export interface ParsedEmail {
  from: EmailHeader | null;
  to: EmailHeader[];
  cc: EmailHeader[];
  bcc: EmailHeader[];
  reply_to: EmailHeader | null;
  subject: string;
  date: string | null;
  headers: Record<string, string>;
  body_text: string;
  body_html: string | null;
  attachments: EmailAttachment[];
}

export interface EmailHeader {
  name: string;
  address: string;
}

export interface EmailAttachment {
  filename: string;
  mime_type: string;
  size_bytes: number;
  content_hash: string;
  storage_path: string | null;
}

export interface ParsedReceipt {
  amount: number | null;
  currency: string;
  date: string | null;
  time: string | null;
  from_name: string | null;
  to_name: string | null;
  payment_method: PaymentMethod;
  upi_id: string | null;
  transaction_id: string | null;
  reference_number: string | null;
  bank_name: string | null;
  status: "success" | "pending" | "failed" | null;
  notes: string | null;
}

export interface AudioTranscription {
  text: string;
  duration_seconds: number;
  language: string;
  segments: TranscriptionSegment[];
}

export interface TranscriptionSegment {
  start: number;
  end: number;
  text: string;
  speaker: string | null;
}

// ── Archiver Types ──

export interface WebArchive {
  url: string;
  title: string;
  archived_at: string;
  screenshot_hash: string | null;
  html_hash: string | null;
  screenshot_path: string | null;
  html_snippet: string | null;
}

export interface WebArchiveResult {
  success: boolean;
  url: string;
  title: string;
  screenshot: Buffer | Uint8Array | null;
  html: string | null;
  archived_at: string;
  error?: string;
}

export interface MCACompanyData {
  cin: string;
  company_name: string;
  registration_date: string | null;
  category: string | null;
  sub_category: string | null;
  class_of_company: string | null;
  authorized_capital: number | null;
  paid_up_capital: number | null;
  registered_address: string | null;
  registrar_of_companies: string | null;
  company_status: CompanyStatus;
  directors: CompanyDirector[];
  email: string | null;
  website: string | null;
  last_agm_date: string | null;
  last_balance_sheet_date: string | null;
}

export type CompanyStatus = "Active" | "Strike Off" | "Under Process of Striking off" | "Dormant" | "Unknown";

export interface CompanyDirector {
  name: string;
  din: string | null;
  designation: string | null;
  appointment_date: string | null;
}

export interface PropertyListingData {
  url: string;
  price: string | null;
  location: string | null;
  listing_date: string | null;
  broker_name: string | null;
  broker_phone: string | null;
  description: string | null;
}

// ── Extracted Data Union ──

export type ExtractedData =
  | WhatsAppChat
  | ParsedEmail
  | ParsedReceipt
  | AudioTranscription
  | WebArchive
  | MCACompanyData
  | PropertyListingData
  | Record<string, unknown>;

// ── Location ──

export interface LocationData {
  lat: number;
  lon: number;
  address: string | null;
}

// ── Bundle Config ──

export interface BundleConfig {
  include_certificates?: boolean;
  include_index?: boolean;
  include_chain_report?: boolean;
  issue_categories?: string[];
  selected_item_ids?: string[];
}

// ── UI Helper Types ──

export interface EvidenceTimelineItem {
  id: string;
  type: EvidenceType;
  title: string;
  captured_at: string;
  is_certified: boolean;
  chain_verified: boolean;
  sequence_number: number;
  description: string | null;
  issue_category: string | null;
}

export interface EvidenceStats {
  total_items: number;
  by_type: Record<EvidenceType, number>;
  certified_count: number;
  chain_verified: boolean;
  storage_used_bytes: number;
  storage_limit_bytes: number;
}

export interface CaptureResult {
  success: boolean;
  item?: EvidenceItem;
  error?: string;
  extracted_data?: ExtractedData;
}

// ── Evidence type metadata ──

export const EVIDENCE_TYPE_META: Record<EvidenceType, {
  label: string;
  emoji: string;
  color: string;
}> = {
  contract: { label: "Contract", emoji: "📄", color: "blue-500" },
  email: { label: "Email", emoji: "✉️", color: "sky-400" },
  whatsapp_chat: { label: "WhatsApp Chat", emoji: "📱", color: "emerald-500" },
  whatsapp_message: { label: "WhatsApp Message", emoji: "💬", color: "emerald-400" },
  audio_recording: { label: "Audio Recording", emoji: "🎤", color: "violet-500" },
  photo: { label: "Photo", emoji: "📸", color: "amber-500" },
  video_reference: { label: "Video Reference", emoji: "🎥", color: "amber-400" },
  payment_receipt: { label: "Payment Receipt", emoji: "💰", color: "green-500" },
  website_archive: { label: "Web Archive", emoji: "🌐", color: "slate-400" },
  company_data: { label: "Company Data", emoji: "🏢", color: "orange-500" },
  property_listing: { label: "Property Listing", emoji: "🏠", color: "orange-400" },
  document: { label: "Document", emoji: "📋", color: "gray-400" },
  screenshot: { label: "Screenshot", emoji: "🖼️", color: "gray-500" },
  tos_archive: { label: "ToS Archive", emoji: "📜", color: "slate-500" },
  communication: { label: "Communication", emoji: "📞", color: "indigo-400" },
};
