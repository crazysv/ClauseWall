-- ============================================
-- SMART EVIDENCE CHAIN BUILDER — DATABASE SCHEMA
-- Run this in Supabase SQL Editor
-- ============================================

-- 1. Evidence Cases
CREATE TABLE evidence_cases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  document_id UUID DEFAULT NULL,

  title TEXT NOT NULL,
  description TEXT,
  counterparty_name TEXT NOT NULL,
  counterparty_type TEXT NOT NULL CHECK (counterparty_type IN (
    'landlord', 'employer', 'company', 'bank', 'broker',
    'builder', 'service_provider', 'individual', 'government', 'other'
  )),
  counterparty_details JSONB DEFAULT '{}',

  dispute_type TEXT CHECK (dispute_type IN (
    'rental', 'employment', 'consumer', 'financial', 'property',
    'service', 'insurance', 'telecom', 'ecommerce', 'other'
  )),
  dispute_description TEXT,

  total_items INT DEFAULT 0,
  chain_root_hash TEXT,
  chain_verified BOOLEAN DEFAULT true,
  last_chain_verification TIMESTAMPTZ,

  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'archived', 'submitted', 'resolved')),

  storage_used_bytes BIGINT DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Evidence Items
CREATE TABLE evidence_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID NOT NULL REFERENCES evidence_cases(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  sequence_number INT NOT NULL,
  evidence_type TEXT NOT NULL CHECK (evidence_type IN (
    'contract', 'email', 'whatsapp_chat', 'whatsapp_message',
    'audio_recording', 'photo', 'video_reference', 'payment_receipt',
    'website_archive', 'company_data', 'property_listing',
    'document', 'screenshot', 'tos_archive', 'communication'
  )),

  title TEXT NOT NULL,
  description TEXT,

  original_filename TEXT,
  storage_path TEXT,
  file_size_bytes BIGINT DEFAULT 0,
  mime_type TEXT,
  thumbnail_path TEXT,

  content_hash TEXT NOT NULL,
  chain_hash TEXT NOT NULL,
  previous_item_id UUID REFERENCES evidence_items(id),
  timestamp_proof JSONB,
  hash_algorithm TEXT DEFAULT 'SHA-256',

  extracted_data JSONB DEFAULT '{}',

  captured_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  source TEXT,
  location_data JSONB,
  tags TEXT[] DEFAULT '{}',
  issue_category TEXT,
  notes TEXT,

  is_certified BOOLEAN DEFAULT false,
  certificate_id UUID,

  processing_status TEXT DEFAULT 'completed' CHECK (processing_status IN (
    'uploading', 'processing', 'completed', 'failed'
  )),
  processing_error TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Evidence Certificates (Section 65B)
CREATE TABLE evidence_certificates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  evidence_item_id UUID NOT NULL REFERENCES evidence_items(id) ON DELETE CASCADE,
  case_id UUID NOT NULL REFERENCES evidence_cases(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  certificate_data JSONB NOT NULL,
  pdf_storage_path TEXT,

  generated_at TIMESTAMPTZ DEFAULT NOW(),
  is_signed BOOLEAN DEFAULT false,
  signed_at TIMESTAMPTZ
);

-- 4. Evidence Bundles
CREATE TABLE evidence_bundles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID NOT NULL REFERENCES evidence_cases(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  bundle_type TEXT NOT NULL CHECK (bundle_type IN ('full', 'chronological', 'issue_wise', 'custom')),
  title TEXT NOT NULL,

  included_item_ids UUID[] NOT NULL,

  pdf_storage_path TEXT,
  total_pages INT,
  file_size_bytes BIGINT,

  bundle_hash TEXT NOT NULL,
  chain_root_hash TEXT,
  timestamp_proof JSONB,

  config JSONB DEFAULT '{}',

  generated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_evidence_items_case_id ON evidence_items(case_id);
CREATE INDEX idx_evidence_items_type ON evidence_items(evidence_type);
CREATE INDEX idx_evidence_items_chain ON evidence_items(case_id, sequence_number);
CREATE INDEX idx_evidence_certificates_item ON evidence_certificates(evidence_item_id);
CREATE INDEX idx_evidence_bundles_case ON evidence_bundles(case_id);
CREATE INDEX idx_evidence_cases_user ON evidence_cases(user_id);
CREATE INDEX idx_evidence_cases_document ON evidence_cases(document_id);

-- RLS
ALTER TABLE evidence_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE evidence_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE evidence_certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE evidence_bundles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD own evidence cases" ON evidence_cases FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can CRUD own evidence items" ON evidence_items FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can CRUD own certificates" ON evidence_certificates FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can CRUD own bundles" ON evidence_bundles FOR ALL USING (auth.uid() = user_id);
