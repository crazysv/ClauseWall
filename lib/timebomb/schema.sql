-- ============================================
-- CONTRACT TIME BOMB DEFUSER — DATABASE SCHEMA
-- Run in Supabase SQL Editor
-- ============================================

-- Add temporal_data column to existing documents table
ALTER TABLE documents ADD COLUMN IF NOT EXISTS temporal_data jsonb;

-- ============================================
-- TABLE 1: contract_deadlines
-- ============================================

CREATE TABLE IF NOT EXISTS contract_deadlines (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  document_id uuid NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  clause_id text,
  deadline_date date NOT NULL,
  warning_start_date date NOT NULL,
  deadline_type text NOT NULL DEFAULT 'other',
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  financial_impact numeric,
  financial_description text NOT NULL DEFAULT '',
  consequence_if_missed text NOT NULL DEFAULT '',
  consequence_severity text NOT NULL DEFAULT 'moderate',
  action_required text NOT NULL DEFAULT '',
  action_template text,
  status text NOT NULL DEFAULT 'upcoming',
  urgency text NOT NULL DEFAULT 'low',
  is_recurring boolean NOT NULL DEFAULT false,
  recurrence_interval_days integer,
  next_occurrence_date date,
  reminder_30d_sent boolean NOT NULL DEFAULT false,
  reminder_14d_sent boolean NOT NULL DEFAULT false,
  reminder_7d_sent boolean NOT NULL DEFAULT false,
  reminder_3d_sent boolean NOT NULL DEFAULT false,
  reminder_1d_sent boolean NOT NULL DEFAULT false,
  reminder_today_sent boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_contract_deadlines_document_id ON contract_deadlines(document_id);
CREATE INDEX IF NOT EXISTS idx_contract_deadlines_user_id ON contract_deadlines(user_id);
CREATE INDEX IF NOT EXISTS idx_contract_deadlines_deadline_date ON contract_deadlines(deadline_date);
CREATE INDEX IF NOT EXISTS idx_contract_deadlines_status ON contract_deadlines(status);

ALTER TABLE contract_deadlines ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own deadlines"
  ON contract_deadlines FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own deadlines"
  ON contract_deadlines FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own deadlines"
  ON contract_deadlines FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete own deadlines"
  ON contract_deadlines FOR DELETE
  USING (user_id = auth.uid());

-- ============================================
-- TABLE 2: deadline_reminder_settings
-- ============================================

CREATE TABLE IF NOT EXISTS deadline_reminder_settings (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  telegram_chat_id text,
  telegram_enabled boolean NOT NULL DEFAULT false,
  email_enabled boolean NOT NULL DEFAULT true,
  push_enabled boolean NOT NULL DEFAULT false,
  push_subscription text,
  in_app_enabled boolean NOT NULL DEFAULT true,
  reminder_time text NOT NULL DEFAULT '08:00',
  timezone text NOT NULL DEFAULT 'Asia/Kolkata',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE deadline_reminder_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own reminder settings"
  ON deadline_reminder_settings FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own reminder settings"
  ON deadline_reminder_settings FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own reminder settings"
  ON deadline_reminder_settings FOR UPDATE
  USING (user_id = auth.uid());

-- ============================================
-- TABLE 3: deadline_notifications
-- ============================================

CREATE TABLE IF NOT EXISTS deadline_notifications (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  deadline_id uuid NOT NULL REFERENCES contract_deadlines(id) ON DELETE CASCADE,
  notification_type text NOT NULL DEFAULT 'in_app',
  days_before integer NOT NULL DEFAULT 0,
  sent_at timestamptz NOT NULL DEFAULT now(),
  delivered boolean NOT NULL DEFAULT false,
  read boolean NOT NULL DEFAULT false
);

CREATE INDEX IF NOT EXISTS idx_deadline_notifications_user_read
  ON deadline_notifications(user_id, read);

ALTER TABLE deadline_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notifications"
  ON deadline_notifications FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own notifications"
  ON deadline_notifications FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own notifications"
  ON deadline_notifications FOR UPDATE
  USING (user_id = auth.uid());
