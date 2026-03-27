// ============================================
// CLAUSEWALL — BHASHA ENGINE
// Regional Language Contract Analyzer
// ============================================
//
// SQL MIGRATION — Run on Supabase:
//
// -- Add language columns to existing documents table
// ALTER TABLE documents ADD COLUMN IF NOT EXISTS source_language TEXT DEFAULT 'en';
// ALTER TABLE documents ADD COLUMN IF NOT EXISTS detected_language TEXT;
// ALTER TABLE documents ADD COLUMN IF NOT EXISTS output_language TEXT DEFAULT 'en';
// ALTER TABLE documents ADD COLUMN IF NOT EXISTS language_confidence NUMERIC;
// ALTER TABLE documents ADD COLUMN IF NOT EXISTS is_multilingual BOOLEAN DEFAULT false;
//
// -- User language preferences
// CREATE TABLE IF NOT EXISTS user_language_preferences (
//   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
//   user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
//   preferred_input_language TEXT DEFAULT 'auto',
//   preferred_output_language TEXT DEFAULT 'en',
//   preferred_tts_voice TEXT,
//   enable_audio_by_default BOOLEAN DEFAULT false,
//   enable_bilingual_by_default BOOLEAN DEFAULT false,
//   created_at TIMESTAMPTZ DEFAULT NOW(),
//   updated_at TIMESTAMPTZ DEFAULT NOW(),
//   UNIQUE(user_id)
// );
//
// -- TTS audio cache
// CREATE TABLE IF NOT EXISTS tts_cache (
//   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
//   text_hash TEXT NOT NULL,
//   language TEXT NOT NULL,
//   voice TEXT,
//   audio_storage_path TEXT NOT NULL,
//   audio_duration_seconds NUMERIC,
//   audio_size_bytes BIGINT,
//   created_at TIMESTAMPTZ DEFAULT NOW(),
//   expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '30 days'),
//   UNIQUE(text_hash, language, voice)
// );
//
// -- Regional legal terminology
// CREATE TABLE IF NOT EXISTS legal_terminology (
//   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
//   language_code TEXT NOT NULL,
//   regional_term TEXT NOT NULL,
//   regional_term_transliterated TEXT,
//   english_equivalent TEXT NOT NULL,
//   clause_type TEXT,
//   legal_context TEXT,
//   usage_example TEXT,
//   is_verified BOOLEAN DEFAULT false,
//   created_at TIMESTAMPTZ DEFAULT NOW(),
//   UNIQUE(language_code, regional_term)
// );
//
// -- Indexes
// CREATE INDEX IF NOT EXISTS idx_documents_source_language ON documents(source_language);
// CREATE INDEX IF NOT EXISTS idx_documents_detected_lang ON documents(detected_language);
// CREATE INDEX IF NOT EXISTS idx_user_lang_prefs ON user_language_preferences(user_id);
// CREATE INDEX IF NOT EXISTS idx_tts_cache_lookup ON tts_cache(text_hash, language);
// CREATE INDEX IF NOT EXISTS idx_tts_cache_expiry ON tts_cache(expires_at);
// CREATE INDEX IF NOT EXISTS idx_legal_terminology_lang ON legal_terminology(language_code);
// CREATE INDEX IF NOT EXISTS idx_legal_terminology_clause ON legal_terminology(clause_type);
// CREATE INDEX IF NOT EXISTS idx_legal_terminology_term ON legal_terminology(regional_term);
//
// -- RLS
// ALTER TABLE user_language_preferences ENABLE ROW LEVEL SECURITY;
// ALTER TABLE tts_cache ENABLE ROW LEVEL SECURITY;
// ALTER TABLE legal_terminology ENABLE ROW LEVEL SECURITY;
//
// CREATE POLICY "Users manage own language preferences" ON user_language_preferences
//   FOR ALL USING (auth.uid() = user_id);
// CREATE POLICY "TTS cache readable by all" ON tts_cache
//   FOR SELECT USING (true);
// CREATE POLICY "Legal terminology readable by all" ON legal_terminology
//   FOR SELECT USING (true);
//
// ============================================
// FONT DOWNLOAD INSTRUCTIONS
// ============================================
//
// Download Noto Sans fonts from Google Fonts (OFL license, free):
//
// PowerShell:
//   mkdir -p public/fonts
//   Invoke-WebRequest -Uri "https://github.com/google/fonts/raw/main/ofl/notosansdevanagari/NotoSansDevanagari%5Bwdth%2Cwght%5D.ttf" -OutFile "public/fonts/NotoSansDevanagari-Regular.ttf"
//   Invoke-WebRequest -Uri "https://github.com/google/fonts/raw/main/ofl/notosanstamil/NotoSansTamil%5Bwdth%2Cwght%5D.ttf" -OutFile "public/fonts/NotoSansTamil-Regular.ttf"
//   Invoke-WebRequest -Uri "https://github.com/google/fonts/raw/main/ofl/notosanstelugu/NotoSansTelugu%5Bwdth%2Cwght%5D.ttf" -OutFile "public/fonts/NotoSansTelugu-Regular.ttf"
//   Invoke-WebRequest -Uri "https://github.com/google/fonts/raw/main/ofl/notosanskannada/NotoSansKannada%5Bwdth%2Cwght%5D.ttf" -OutFile "public/fonts/NotoSansKannada-Regular.ttf"
//   Invoke-WebRequest -Uri "https://github.com/google/fonts/raw/main/ofl/notosansbengali/NotoSansBengali%5Bwdth%2Cwght%5D.ttf" -OutFile "public/fonts/NotoSansBengali-Regular.ttf"
//   Invoke-WebRequest -Uri "https://github.com/google/fonts/raw/main/ofl/notosansgujarati/NotoSansGujarati%5Bwdth%2Cwght%5D.ttf" -OutFile "public/fonts/NotoSansGujarati-Regular.ttf"
//   Invoke-WebRequest -Uri "https://github.com/google/fonts/raw/main/ofl/notosansmalayalam/NotoSansMalayalam%5Bwdth%2Cwght%5D.ttf" -OutFile "public/fonts/NotoSansMalayalam-Regular.ttf"
//   Invoke-WebRequest -Uri "https://github.com/google/fonts/raw/main/ofl/notosansgurmukhi/NotoSansGurmukhi%5Bwdth%2Cwght%5D.ttf" -OutFile "public/fonts/NotoSansGurmukhi-Regular.ttf"
//   Invoke-WebRequest -Uri "https://github.com/google/fonts/raw/main/ofl/notosansoriya/NotoSansOriya%5Bwdth%2Cwght%5D.ttf" -OutFile "public/fonts/NotoSansOriya-Regular.ttf"
//
// Or download from: https://fonts.google.com/noto
// Search "Noto Sans [Script]", download Regular weight.
//
// ENV VARS NEEDED:
//   BHASHINI_API_KEY — Free from bhashini.gov.in/ulca
//   BHASHINI_USER_ID — Free registration
// ============================================

// Re-exports for convenience
export { LANGUAGE_CONFIGS, SUPPORTED_LANGUAGES, INDIAN_LANGUAGES } from "./constants";
export type {
  SupportedLanguage,
  IndianScript,
  LanguageConfig,
  LanguageDetectionResult,
  TranslationRequest,
  TranslationResult,
  TTSRequest,
  TTSResult,
  STTRequest,
  STTResult,
  MultilingualOCRResult,
  LegalTerm,
  BilingualText,
  BilingualClause,
  BilingualReport,
  RegionalNumber,
  UserLanguagePreferences,
} from "@/types/bhasha";
