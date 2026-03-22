-- ============================================
-- CROSS-CONTRACT VAULT SCHEMA
-- Stores results of cross-contract analysis
-- ============================================

-- Table: vault_analyses
-- Stores the full analysis result per user per run
CREATE TABLE IF NOT EXISTS vault_analyses (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  document_ids text[] NOT NULL DEFAULT '{}',
  conflicts jsonb NOT NULL DEFAULT '[]',
  coverage_gaps jsonb NOT NULL DEFAULT '[]',
  cascading_failures jsonb NOT NULL DEFAULT '[]',
  financial_exposure jsonb NOT NULL DEFAULT '{}',
  unified_obligations jsonb NOT NULL DEFAULT '[]',
  what_if_results jsonb NOT NULL DEFAULT '[]',
  risk_score integer NOT NULL DEFAULT 0,
  risk_summary text NOT NULL DEFAULT '',
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_vault_analyses_user_id ON vault_analyses(user_id);
CREATE INDEX IF NOT EXISTS idx_vault_analyses_created_at ON vault_analyses(created_at DESC);

-- Row Level Security
ALTER TABLE vault_analyses ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own analyses
CREATE POLICY "Users can view own vault analyses"
  ON vault_analyses FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own vault analyses"
  ON vault_analyses FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own vault analyses"
  ON vault_analyses FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own vault analyses"
  ON vault_analyses FOR DELETE
  USING (auth.uid() = user_id);

-- Auto-update updated_at trigger
CREATE OR REPLACE FUNCTION update_vault_analyses_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_vault_analyses_updated_at
  BEFORE UPDATE ON vault_analyses
  FOR EACH ROW
  EXECUTE FUNCTION update_vault_analyses_updated_at();
