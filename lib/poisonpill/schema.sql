-- ============================================
-- POISON PILL INTERCONNECTION DETECTOR — SCHEMA
-- Minimal schema change — results stored as JSONB on documents table
-- ============================================

-- Add poison pill analysis column to documents table
ALTER TABLE documents ADD COLUMN IF NOT EXISTS poison_pill_data jsonb;

-- No new tables needed. The analysis result is stored directly on
-- the document row because it's a per-document analysis (not cross-document
-- like vault_analyses).
