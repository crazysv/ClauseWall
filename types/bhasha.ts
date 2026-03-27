// ============================================
// CLAUSEWALL — BHASHA ENGINE TYPE DEFINITIONS
// Regional Language Contract Analyzer
// ============================================

// ============================================
// LANGUAGE TYPES
// ============================================

export type SupportedLanguage =
  | "hi" | "mr" | "bn" | "ta" | "te" | "kn"
  | "gu" | "ml" | "pa" | "or" | "as" | "ur"
  | "en";

export type IndianScript =
  | "devanagari" | "bengali" | "tamil" | "telugu"
  | "kannada" | "gujarati" | "malayalam" | "gurmukhi"
  | "odia" | "assamese" | "nastaliq" | "latin";

export interface LanguageConfig {
  code: SupportedLanguage;
  name: string;                     // English name
  nativeName: string;               // Name in native script
  nativeChar: string;               // Representative character (अ, அ, etc.)
  script: IndianScript;
  scriptUnicodeRange: [number, number]; // Start, end of Unicode block
  bhashiniCode: string;             // Bhashini API language code
  groqSupported: boolean;           // Whether Groq handles this language well
  webSpeechCode: string;            // BCP 47 code for Web Speech API
  fontFile: string;                 // Noto Sans font filename
  priority: 0 | 1 | 2;             // P0=critical, P1=important, P2=nice-to-have
}

export interface LanguageDetectionResult {
  primary_language: SupportedLanguage;
  confidence: number;               // 0-1
  secondary_languages: { language: SupportedLanguage; percentage: number }[];
  is_mixed: boolean;
  script_detected: IndianScript;
  detection_method: "unicode_ranges" | "word_frequency" | "groq_fallback";
}

// ============================================
// TRANSLATION TYPES
// ============================================

export interface TranslationRequest {
  text: string;
  source_language: SupportedLanguage;
  target_language: SupportedLanguage;
}

export interface TranslationResult {
  translated_text: string;
  source_language: SupportedLanguage;
  target_language: SupportedLanguage;
  confidence: number;
  service_used: "bhashini" | "groq";
}

export interface BhashiniConfig {
  apiKey: string;
  userId: string;
  baseUrl: string;
}

export interface BhashiniPipelineTask {
  taskType: "translation" | "tts" | "asr";
  config: {
    language: {
      sourceLanguage: string;
      targetLanguage?: string;
    };
    serviceId?: string;
    audioFormat?: string;
    samplingRate?: number;
  };
}

export interface BhashiniServiceResponse {
  pipelineResponseConfig: {
    pipelineInferenceAPIEndPoint: {
      callbackUrl: string;
      inferenceApiKey: {
        name: string;
        value: string;
      };
    };
    pipelineInferenceSocketEndPoint?: {
      callbackUrl: string;
    };
  }[];
  languages: {
    sourceLanguage: string;
    targetLanguage?: string;
  }[];
}

export interface BhashiniTranslationResponse {
  pipelineResponse: {
    taskType: string;
    output: {
      source: string;
      target: string;
    }[];
  }[];
}

export interface BhashiniTTSResponse {
  pipelineResponse: {
    taskType: string;
    audio: {
      audioContent: string;  // base64
      audioUri?: string;
    }[];
  }[];
}

export interface BhashiniSTTResponse {
  pipelineResponse: {
    taskType: string;
    output: {
      source: string;
    }[];
  }[];
}

// ============================================
// TTS TYPES
// ============================================

export interface TTSRequest {
  text: string;
  language: SupportedLanguage;
  voice?: string;
  speed?: number;               // 0.5 - 2.0
}

export interface TTSResult {
  audio_url: string | null;
  audio_buffer: Buffer | null;
  duration_seconds: number;
  service_used: "bhashini" | "web_speech";
}

export interface TTSVoice {
  id: string;
  name: string;
  language: SupportedLanguage;
  gender: "male" | "female";
  sample_url?: string;
}

// ============================================
// STT TYPES
// ============================================

export interface STTRequest {
  audio_buffer: Buffer;
  language?: SupportedLanguage;
  format?: "wav" | "mp3" | "webm";
}

export interface STTResult {
  text: string;
  language: SupportedLanguage;
  confidence: number;
  segments?: { text: string; start: number; end: number }[];
  service_used: "bhashini" | "groq_whisper" | "web_speech";
}

// ============================================
// OCR TYPES
// ============================================

export interface MultilingualOCRRequest {
  image_buffer?: Buffer;
  pdf_buffer?: Buffer;
  language_hint?: SupportedLanguage;
  is_handwritten?: boolean;
}

export interface MultilingualOCRResult {
  text: string;
  language_detected: SupportedLanguage;
  confidence: number;
  uncertain_regions?: {
    text: string;
    bbox?: { x: number; y: number; width: number; height: number };
    confidence: number;
  }[];
}

// ============================================
// LEGAL TERMINOLOGY TYPES
// ============================================

export interface LegalTerm {
  regional_term: string;
  transliterated: string;
  english_equivalent: string;
  clause_type: string | null;
  legal_context: string;
  usage_example?: string;
}

export type TerminologyMap = Record<string, LegalTerm[]>;

// ============================================
// BILINGUAL TYPES
// ============================================

export interface BilingualText {
  source_language: SupportedLanguage;
  source_text: string;
  english_text: string;
  is_auto_translated: boolean;
}

export interface BilingualClause {
  clause_number: number;
  clause_type: string;
  original_text: BilingualText;
  explanation: BilingualText;
  fair_alternative: BilingualText | null;
  red_flags: BilingualText[];
  risk_level: string;
  risk_score: number;
}

export interface BilingualReport {
  summary: BilingualText;
  clauses: BilingualClause[];
  language_pair: {
    source: SupportedLanguage;
    target: SupportedLanguage;
  };
}

// ============================================
// NUMERAL TYPES
// ============================================

export interface NumeralSystem {
  language: SupportedLanguage;
  script: IndianScript;
  digits: string[];               // Array of 10 digits (0-9) in script
  decimal: string;
  thousand_separator: string;
  lakh_crore_system: boolean;
}

export interface RegionalNumber {
  original_text: string;
  parsed_value: number;
  unit?: string;
  confidence: number;
}

// ============================================
// USER PREFERENCES
// ============================================

export interface UserLanguagePreferences {
  id?: string;
  user_id: string;
  preferred_input_language: SupportedLanguage | "auto";
  preferred_output_language: SupportedLanguage;
  preferred_tts_voice: string | null;
  enable_audio_by_default: boolean;
  enable_bilingual_by_default: boolean;
  created_at?: string;
  updated_at?: string;
}

// ============================================
// AUDIO CACHE
// ============================================

export interface TTSCacheEntry {
  id?: string;
  text_hash: string;
  language: SupportedLanguage;
  voice: string | null;
  audio_storage_path: string;
  audio_duration_seconds: number | null;
  audio_size_bytes: number | null;
  created_at?: string;
  expires_at?: string;
}

// ============================================
// COMPONENT PROPS
// ============================================

export interface LanguageSelectorProps {
  value: SupportedLanguage | "auto";
  onChange: (language: SupportedLanguage | "auto") => void;
  showResultsLanguage?: boolean;
  resultsLanguage?: SupportedLanguage;
  onResultsLanguageChange?: (language: SupportedLanguage) => void;
}

export interface BilingualToggleProps {
  mode: "source" | "english" | "both";
  onChange: (mode: "source" | "english" | "both") => void;
  sourceLanguage: SupportedLanguage;
}

export interface BilingualViewerProps {
  sourceText: string;
  englishText: string;
  sourceLanguage: SupportedLanguage;
  showAudioButton?: boolean;
  onPlayAudio?: (text: string, language: SupportedLanguage) => void;
}

export interface AudioPlayerProps {
  text: string;
  language: SupportedLanguage;
  title?: string;
  autoPlay?: boolean;
}

export interface AudioPlayerInlineProps {
  text: string;
  language: SupportedLanguage;
  size?: "sm" | "md";
}

export interface VoiceInputButtonProps {
  language: SupportedLanguage;
  onTranscription: (text: string) => void;
  onError?: (error: string) => void;
}

export interface ScriptConfidenceBannerProps {
  confidence: number;
  language: SupportedLanguage;
  onReviewClick: () => void;
}

export interface TextCorrectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  extractedText: string;
  imageUrl?: string;
  language: SupportedLanguage;
  onSave: (correctedText: string) => void;
}

export interface TerminologyTooltipProps {
  term: string;
  language: SupportedLanguage;
  englishEquivalent: string;
  legalContext?: string;
  children: React.ReactNode;
}

export interface LanguageBadgeProps {
  sourceLanguage: SupportedLanguage;
  targetLanguage?: SupportedLanguage;
  showAudioAvailable?: boolean;
}

export interface LanguagePreferencesModalProps {
  isOpen: boolean;
  onClose: () => void;
  preferences: UserLanguagePreferences | null;
  onSave: (preferences: Partial<UserLanguagePreferences>) => void;
}
