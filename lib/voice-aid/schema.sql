-- ============================================
-- VOICE-FIRST LEGAL AID — DATABASE SCHEMA
-- Tables: voice_sessions, voice_messages, voice_analytics
-- ============================================

-- Table 1: Voice Sessions
CREATE TABLE IF NOT EXISTS voice_sessions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  telegram_chat_id text,
  language text NOT NULL DEFAULT 'hi',
  status text NOT NULL DEFAULT 'active',
  document_id uuid REFERENCES documents(id) ON DELETE SET NULL,
  context_summary text,
  created_at timestamptz DEFAULT now(),
  last_message_at timestamptz DEFAULT now(),
  expires_at timestamptz DEFAULT (now() + interval '30 minutes')
);

CREATE INDEX IF NOT EXISTS idx_voice_sessions_user_id ON voice_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_voice_sessions_telegram ON voice_sessions(telegram_chat_id);
CREATE INDEX IF NOT EXISTS idx_voice_sessions_status ON voice_sessions(status, expires_at);

-- RLS for voice_sessions
ALTER TABLE voice_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own voice sessions"
  ON voice_sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own voice sessions"
  ON voice_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can update own voice sessions"
  ON voice_sessions FOR UPDATE
  USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Service role full access to voice sessions"
  ON voice_sessions FOR ALL
  USING (auth.role() = 'service_role');

-- Table 2: Voice Messages
CREATE TABLE IF NOT EXISTS voice_messages (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id uuid REFERENCES voice_sessions(id) ON DELETE CASCADE NOT NULL,
  role text NOT NULL,
  text text NOT NULL,
  language text NOT NULL,
  audio_url text,
  metadata jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_voice_messages_session ON voice_messages(session_id, created_at);

-- RLS for voice_messages (via session ownership)
ALTER TABLE voice_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own voice messages"
  ON voice_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM voice_sessions
      WHERE voice_sessions.id = voice_messages.session_id
      AND (voice_sessions.user_id = auth.uid() OR auth.role() = 'service_role')
    )
  );

CREATE POLICY "Users can insert voice messages"
  ON voice_messages FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM voice_sessions
      WHERE voice_sessions.id = voice_messages.session_id
      AND (voice_sessions.user_id = auth.uid() OR voice_sessions.user_id IS NULL OR auth.role() = 'service_role')
    )
  );

CREATE POLICY "Service role full access to voice messages"
  ON voice_messages FOR ALL
  USING (auth.role() = 'service_role');

-- Table 3: Voice Analytics (no RLS — internal analytics)
CREATE TABLE IF NOT EXISTS voice_analytics (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  language text NOT NULL,
  source text NOT NULL,
  stt_provider text,
  tts_provider text,
  stt_success boolean,
  tts_success boolean,
  response_time_ms integer,
  had_photo boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Storage bucket for voice audio
-- Run via Supabase Dashboard or API:
-- INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
-- VALUES ('voice-audio', 'voice-audio', false, 10485760, ARRAY['audio/wav', 'audio/mp3', 'audio/ogg', 'audio/webm', 'audio/mpeg']);
