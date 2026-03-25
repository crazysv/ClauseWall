-- ============================================
-- COMPLAINT FILING SYSTEM — DATABASE SCHEMA
-- Run this in Supabase SQL Editor
-- ============================================

-- Table 1: complaint_authorities (public reference data)
CREATE TABLE IF NOT EXISTS complaint_authorities (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  type text NOT NULL,
  level text NOT NULL,
  name text NOT NULL,
  short_name text NOT NULL,
  state text,
  district text,
  address text NOT NULL,
  phone text,
  email text,
  portal_url text,
  portal_name text,
  filing_method text DEFAULT 'both',
  jurisdiction_description text,
  working_hours text,
  pincode text,
  latitude numeric,
  longitude numeric,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_complaint_authorities_type ON complaint_authorities(type);
CREATE INDEX IF NOT EXISTS idx_complaint_authorities_state ON complaint_authorities(state);
CREATE INDEX IF NOT EXISTS idx_complaint_authorities_type_state_district ON complaint_authorities(type, state, district);

-- No RLS on complaint_authorities — public reference data

-- Table 2: complaint_filings
CREATE TABLE IF NOT EXISTS complaint_filings (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  document_id uuid NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  authority_id uuid REFERENCES complaint_authorities(id),
  authority_type text NOT NULL,
  status text NOT NULL DEFAULT 'draft',
  complaint_title text NOT NULL,
  complainant_name text,
  complainant_address text,
  complainant_phone text,
  complainant_email text,
  respondent_name text,
  respondent_address text,
  respondent_type text,
  claim_amount numeric DEFAULT 0,
  claim_description text,
  facts_of_case text,
  legal_grounds text[] DEFAULT '{}',
  relief_sought text[] DEFAULT '{}',
  supporting_clauses uuid[] DEFAULT '{}',
  complaint_documents jsonb DEFAULT '[]',
  fee_calculation jsonb,
  filing_guide_completed_steps integer[] DEFAULT '{}',
  case_number text,
  filing_date date,
  next_hearing_date date,
  hearing_history jsonb DEFAULT '[]',
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_complaint_filings_user_id ON complaint_filings(user_id);
CREATE INDEX IF NOT EXISTS idx_complaint_filings_document_id ON complaint_filings(document_id);
CREATE INDEX IF NOT EXISTS idx_complaint_filings_status ON complaint_filings(status);
CREATE INDEX IF NOT EXISTS idx_complaint_filings_hearing ON complaint_filings(next_hearing_date);

ALTER TABLE complaint_filings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own filings" ON complaint_filings
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own filings" ON complaint_filings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own filings" ON complaint_filings
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own filings" ON complaint_filings
  FOR DELETE USING (auth.uid() = user_id);

-- Table 3: complaint_hearing_reminders
CREATE TABLE IF NOT EXISTS complaint_hearing_reminders (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  filing_id uuid NOT NULL REFERENCES complaint_filings(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  hearing_date date NOT NULL,
  reminder_days_before integer[] DEFAULT '{7,3,1}',
  last_reminded_at timestamptz,
  documents_needed text[] DEFAULT '{}',
  preparation_notes text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_hearing_reminders_date ON complaint_hearing_reminders(hearing_date, is_active);
CREATE INDEX IF NOT EXISTS idx_hearing_reminders_user ON complaint_hearing_reminders(user_id);

ALTER TABLE complaint_hearing_reminders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own reminders" ON complaint_hearing_reminders
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own reminders" ON complaint_hearing_reminders
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own reminders" ON complaint_hearing_reminders
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own reminders" ON complaint_hearing_reminders
  FOR DELETE USING (auth.uid() = user_id);

-- Table 4: filing_guides (static reference data)
CREATE TABLE IF NOT EXISTS filing_guides (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  authority_type text NOT NULL UNIQUE,
  authority_name text NOT NULL,
  portal_url text,
  total_steps integer NOT NULL,
  steps jsonb NOT NULL,
  documents_checklist jsonb NOT NULL,
  estimated_time text,
  important_notes text[] DEFAULT '{}',
  common_mistakes text[] DEFAULT '{}',
  helpline text,
  is_active boolean DEFAULT true,
  updated_at timestamptz DEFAULT now()
);

-- No RLS on filing_guides — public reference data

-- Add complaint_data column to documents table
ALTER TABLE documents ADD COLUMN IF NOT EXISTS complaint_data jsonb;

-- Create storage bucket for complaint documents (run via Supabase Dashboard)
-- Bucket name: 'complaint-documents'
-- Public: false
-- File size limit: 10MB
-- Allowed MIME types: application/pdf
