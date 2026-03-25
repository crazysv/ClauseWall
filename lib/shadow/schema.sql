-- ============================================
-- SHADOW AGREEMENT DETECTOR — DATABASE SCHEMA
-- Stores shadow analysis results linking verbal
-- promises to contract mismatches
-- ============================================

-- Table: shadow_analyses
CREATE TABLE IF NOT EXISTS shadow_analyses (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  document_id uuid NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  evidence_sources jsonb NOT NULL DEFAULT '[]',
  total_promises_found integer DEFAULT 0,
  total_mismatches integer DEFAULT 0,
  critical_mismatches integer DEFAULT 0,
  major_mismatches integer DEFAULT 0,
  minor_mismatches integer DEFAULT 0,
  promises jsonb NOT NULL DEFAULT '[]',
  mismatches jsonb NOT NULL DEFAULT '[]',
  overall_trust_score integer DEFAULT 100,
  summary text,
  report_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_shadow_analyses_document_id ON shadow_analyses(document_id);
CREATE INDEX IF NOT EXISTS idx_shadow_analyses_user_id ON shadow_analyses(user_id);

-- One shadow analysis per document per user
CREATE UNIQUE INDEX IF NOT EXISTS idx_shadow_analyses_unique
  ON shadow_analyses(document_id, user_id);

-- Add shadow_analysis_data to documents table
ALTER TABLE documents ADD COLUMN IF NOT EXISTS shadow_analysis_data jsonb;

-- RLS Policies
ALTER TABLE shadow_analyses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own shadow analyses"
  ON shadow_analyses FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own shadow analyses"
  ON shadow_analyses FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own shadow analyses"
  ON shadow_analyses FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete own shadow analyses"
  ON shadow_analyses FOR DELETE
  USING (user_id = auth.uid());

-- Updated at trigger
CREATE OR REPLACE FUNCTION update_shadow_analyses_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER shadow_analyses_updated_at
  BEFORE UPDATE ON shadow_analyses
  FOR EACH ROW
  EXECUTE FUNCTION update_shadow_analyses_updated_at();

-- Storage bucket for shadow evidence
-- Run via Supabase Dashboard → Storage → Create bucket:
--   Name: shadow-evidence
--   Public: false
--   File size limit: 25MB
--   Allowed MIME types:
--     text/plain, text/csv, application/zip,
--     image/jpeg, image/png, image/webp,
--     audio/wav, audio/mp3, audio/ogg, audio/webm, audio/mpeg, audio/m4a,
--     message/rfc822, application/pdf
