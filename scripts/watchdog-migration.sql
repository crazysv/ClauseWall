-- ============================================
-- CONTRACT WATCHDOG — DATABASE MIGRATION
-- Run this in Supabase SQL Editor
-- ============================================

-- ─── TABLE: monitored_companies ───
CREATE TABLE IF NOT EXISTS monitored_companies (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name          text NOT NULL,
  slug          text UNIQUE NOT NULL,
  logo_url      text,
  sector        text NOT NULL DEFAULT 'other',
  website       text NOT NULL,
  tos_urls      jsonb NOT NULL DEFAULT '[]'::jsonb,
  scrape_config jsonb,
  scrape_frequency text DEFAULT 'weekly',
  current_tos_score int,
  score_trend   text,
  total_changes int DEFAULT 0,
  pro_company_changes int DEFAULT 0,
  pro_consumer_changes int DEFAULT 0,
  last_scraped_at timestamptz,
  last_change_detected timestamptz,
  is_active     bool DEFAULT true,
  created_at    timestamptz DEFAULT now(),
  updated_at    timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_companies_sector ON monitored_companies(sector);
CREATE INDEX IF NOT EXISTS idx_companies_slug ON monitored_companies(slug);
CREATE INDEX IF NOT EXISTS idx_companies_active ON monitored_companies(is_active);

-- ─── TABLE: tos_snapshots ───
CREATE TABLE IF NOT EXISTS tos_snapshots (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id      uuid NOT NULL REFERENCES monitored_companies(id) ON DELETE CASCADE,
  tos_type        text NOT NULL,
  version_number  int NOT NULL,
  raw_html        text,
  clean_text      text NOT NULL,
  text_hash       text NOT NULL,
  word_count      int,
  readability_score numeric,
  section_count   int,
  url_scraped     text NOT NULL,
  scrape_status   text DEFAULT 'success',
  scrape_error    text,
  scraped_at      timestamptz DEFAULT now(),
  analyzed        bool DEFAULT false,
  created_at      timestamptz DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_snapshots_unique ON tos_snapshots(company_id, tos_type, text_hash);
CREATE INDEX IF NOT EXISTS idx_snapshots_company ON tos_snapshots(company_id, tos_type, scraped_at DESC);

-- ─── TABLE: tos_changes ───
CREATE TABLE IF NOT EXISTS tos_changes (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id        uuid NOT NULL REFERENCES monitored_companies(id) ON DELETE CASCADE,
  old_snapshot_id   uuid REFERENCES tos_snapshots(id),
  new_snapshot_id   uuid NOT NULL REFERENCES tos_snapshots(id),
  tos_type          text NOT NULL,
  change_number     int,
  changes           jsonb NOT NULL DEFAULT '[]'::jsonb,
  total_changes     int DEFAULT 0,
  critical_count    int DEFAULT 0,
  major_count       int DEFAULT 0,
  minor_count       int DEFAULT 0,
  cosmetic_count    int DEFAULT 0,
  pro_company_count int DEFAULT 0,
  pro_consumer_count int DEFAULT 0,
  neutral_count     int DEFAULT 0,
  overall_direction text,
  legality_issues   jsonb,
  summary           text,
  is_published      bool DEFAULT true,
  detected_at       timestamptz DEFAULT now(),
  analyzed_at       timestamptz,
  created_at        timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_changes_company ON tos_changes(company_id, detected_at DESC);
CREATE INDEX IF NOT EXISTS idx_changes_severity ON tos_changes(critical_count DESC, major_count DESC);

-- ─── TABLE: user_watchlist ───
CREATE TABLE IF NOT EXISTS user_watchlist (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id      uuid NOT NULL REFERENCES monitored_companies(id) ON DELETE CASCADE,
  alert_email     bool DEFAULT true,
  alert_telegram  bool DEFAULT false,
  alert_inapp     bool DEFAULT true,
  sensitivity     text DEFAULT 'major_and_critical',
  telegram_chat_id text,
  created_at      timestamptz DEFAULT now(),
  UNIQUE(user_id, company_id)
);

CREATE INDEX IF NOT EXISTS idx_watchlist_user ON user_watchlist(user_id);
CREATE INDEX IF NOT EXISTS idx_watchlist_company ON user_watchlist(company_id);

-- ─── TABLE: watchdog_alerts ───
CREATE TABLE IF NOT EXISTS watchdog_alerts (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id  uuid NOT NULL REFERENCES monitored_companies(id) ON DELETE CASCADE,
  change_id   uuid NOT NULL REFERENCES tos_changes(id) ON DELETE CASCADE,
  alert_type  text NOT NULL,
  title       text NOT NULL,
  body        text NOT NULL,
  severity    text NOT NULL,
  is_read     bool DEFAULT false,
  sent_at     timestamptz DEFAULT now(),
  read_at     timestamptz,
  created_at  timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_alerts_user ON watchdog_alerts(user_id, is_read, sent_at DESC);

-- ─── TABLE: optout_campaigns ───
CREATE TABLE IF NOT EXISTS optout_campaigns (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id        uuid NOT NULL REFERENCES monitored_companies(id),
  change_id         uuid NOT NULL REFERENCES tos_changes(id),
  title             text NOT NULL,
  description       text NOT NULL,
  legal_basis       text NOT NULL,
  objection_template text NOT NULL,
  status            text DEFAULT 'active',
  signatory_count   int DEFAULT 0,
  target_count      int DEFAULT 100,
  company_email     text,
  created_by        uuid REFERENCES auth.users(id),
  created_at        timestamptz DEFAULT now(),
  updated_at        timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_campaigns_status ON optout_campaigns(status);

-- ─── TABLE: campaign_signatories ───
CREATE TABLE IF NOT EXISTS campaign_signatories (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id   uuid NOT NULL REFERENCES optout_campaigns(id) ON DELETE CASCADE,
  user_id       uuid REFERENCES auth.users(id),
  display_name  text NOT NULL,
  email         text,
  signed_at     timestamptz DEFAULT now(),
  UNIQUE(campaign_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_signatories_campaign ON campaign_signatories(campaign_id);

-- ─── RLS POLICIES ───

ALTER TABLE monitored_companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE tos_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE tos_changes ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_watchlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE watchdog_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE optout_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_signatories ENABLE ROW LEVEL SECURITY;

-- Public read for companies, snapshots, changes, campaigns, signatories
CREATE POLICY "Public read monitored_companies" ON monitored_companies FOR SELECT USING (true);
CREATE POLICY "Public read tos_snapshots" ON tos_snapshots FOR SELECT USING (true);
CREATE POLICY "Public read tos_changes" ON tos_changes FOR SELECT USING (true);
CREATE POLICY "Public read optout_campaigns" ON optout_campaigns FOR SELECT USING (true);
CREATE POLICY "Public read campaign_signatories" ON campaign_signatories FOR SELECT USING (true);

-- User watchlist: own rows only
CREATE POLICY "Users manage own watchlist" ON user_watchlist FOR ALL USING (auth.uid() = user_id);

-- Alerts: users read/update own only
CREATE POLICY "Users read own alerts" ON watchdog_alerts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users update own alerts" ON watchdog_alerts FOR UPDATE USING (auth.uid() = user_id);

-- Campaigns: users can create
CREATE POLICY "Users create campaigns" ON optout_campaigns FOR INSERT WITH CHECK (auth.uid() = created_by);

-- Signatories: users can sign
CREATE POLICY "Users sign campaigns" ON campaign_signatories FOR INSERT WITH CHECK (auth.uid() = user_id);
