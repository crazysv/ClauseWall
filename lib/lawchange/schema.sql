-- ============================================
-- LAW CHANGE IMPACT ENGINE — DATABASE SCHEMA
-- Run this in Supabase SQL Editor
-- ============================================

-- Table 1: law_changes — Scraped legal changes from all sources
CREATE TABLE IF NOT EXISTS law_changes (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  source text NOT NULL,
  source_url text NOT NULL,
  change_type text NOT NULL,
  title text NOT NULL,
  summary text NOT NULL,
  full_text text,
  date_published date NOT NULL,
  date_effective date,
  date_scraped timestamptz DEFAULT now(),
  court_name text,
  case_number text,
  act_name text,
  section_affected text,
  affected_clause_types text[] DEFAULT '{}',
  affected_jurisdictions text[] DEFAULT '{}',
  affected_document_types text[] DEFAULT '{}',
  impact_type text,
  status text DEFAULT 'scraped',
  classification_confidence text DEFAULT 'low',
  is_verified boolean DEFAULT false,
  raw_scraped_data jsonb,
  UNIQUE(source_url)
);

-- Indexes for law_changes
CREATE INDEX IF NOT EXISTS idx_law_changes_date_published ON law_changes (date_published DESC);
CREATE INDEX IF NOT EXISTS idx_law_changes_status ON law_changes (status);
CREATE INDEX IF NOT EXISTS idx_law_changes_clause_types ON law_changes USING GIN (affected_clause_types);
CREATE INDEX IF NOT EXISTS idx_law_changes_jurisdictions ON law_changes USING GIN (affected_jurisdictions);

-- NO RLS — public reference data, only service role can INSERT/UPDATE


-- Table 2: law_change_impacts — How each law change affects specific contracts
CREATE TABLE IF NOT EXISTS law_change_impacts (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  law_change_id uuid REFERENCES law_changes(id) ON DELETE CASCADE,
  document_id uuid REFERENCES documents(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  clause_id uuid REFERENCES clauses(id) ON DELETE SET NULL,
  clause_number integer,
  clause_type text,
  impact_description text NOT NULL,
  impact_severity text NOT NULL,
  financial_impact numeric,
  financial_description text,
  action_required text,
  action_letter text,
  new_legal_citation text,
  old_legal_position text,
  new_legal_position text,
  notified boolean DEFAULT false,
  notified_at timestamptz,
  notification_channels text[] DEFAULT '{}',
  user_acknowledged boolean DEFAULT false,
  acknowledged_at timestamptz,
  created_at timestamptz DEFAULT now(),
  UNIQUE(law_change_id, document_id, clause_type)
);

-- Indexes for law_change_impacts
CREATE INDEX IF NOT EXISTS idx_law_change_impacts_user ON law_change_impacts (user_id);
CREATE INDEX IF NOT EXISTS idx_law_change_impacts_document ON law_change_impacts (document_id);
CREATE INDEX IF NOT EXISTS idx_law_change_impacts_notified ON law_change_impacts (notified);
CREATE INDEX IF NOT EXISTS idx_law_change_impacts_law_change ON law_change_impacts (law_change_id);

-- RLS for law_change_impacts
ALTER TABLE law_change_impacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own impacts"
  ON law_change_impacts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own impacts"
  ON law_change_impacts FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can insert impacts"
  ON law_change_impacts FOR INSERT
  WITH CHECK (true);


-- Table 3: law_change_notifications — In-app notifications for law changes
CREATE TABLE IF NOT EXISTS law_change_notifications (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  law_change_id uuid REFERENCES law_changes(id) ON DELETE CASCADE,
  impact_id uuid REFERENCES law_change_impacts(id) ON DELETE CASCADE,
  title text NOT NULL,
  body text NOT NULL,
  urgency text DEFAULT 'informational',
  read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Indexes for law_change_notifications
CREATE INDEX IF NOT EXISTS idx_law_change_notifications_user_read ON law_change_notifications (user_id, read);

-- RLS for law_change_notifications
ALTER TABLE law_change_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own notifications"
  ON law_change_notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications"
  ON law_change_notifications FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can insert notifications"
  ON law_change_notifications FOR INSERT
  WITH CHECK (true);


-- Table 4: pending_law_changes — Upcoming/predicted law changes
CREATE TABLE IF NOT EXISTS pending_law_changes (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  description text,
  expected_date date,
  probability text DEFAULT 'possible',
  source text,
  source_url text,
  affected_clause_types text[] DEFAULT '{}',
  affected_jurisdictions text[] DEFAULT '{}',
  what_to_prepare text,
  created_at timestamptz DEFAULT now(),
  is_active boolean DEFAULT true
);

-- NO RLS — public reference data


-- Table 5: scraping_logs — Audit trail for scraping runs
CREATE TABLE IF NOT EXISTS scraping_logs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  date date NOT NULL,
  source text NOT NULL,
  success boolean,
  changes_found integer DEFAULT 0,
  new_changes integer DEFAULT 0,
  error text,
  duration_ms integer,
  created_at timestamptz DEFAULT now()
);

-- Index for scraping_logs
CREATE INDEX IF NOT EXISTS idx_scraping_logs_date ON scraping_logs (date DESC);

-- NO RLS — admin-only table


-- Add law_changes_data column to documents table
ALTER TABLE documents ADD COLUMN IF NOT EXISTS law_changes_data jsonb;
