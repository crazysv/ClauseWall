export interface VoiceLanguage {
  code: string;
  speechCode: string;
  label: string;
  shortLabel: string;
  flag: string;
}

export const SUPPORTED_LANGUAGES: VoiceLanguage[] = [
  { code: "hi", speechCode: "hi-IN", label: "Hindi", shortLabel: "हिं", flag: "🇮🇳" },
  { code: "en", speechCode: "en-IN", label: "English", shortLabel: "EN", flag: "🇮🇳" },
];

export const DEFAULT_LANGUAGE = SUPPORTED_LANGUAGES[0];

export function detectLanguage(text: string): VoiceLanguage {
  const hindiPattern = /[\u0900-\u097F]/;
  if (hindiPattern.test(text)) return SUPPORTED_LANGUAGES[0];

  const hinglishWords = [
    "karo", "hai", "kya", "mein", "ka", "ki", "ko", "se", "ye", "yeh",
    "dikhao", "batao", "samjhao", "bhejo", "ruko", "bolo", "sunao",
    "mera", "tera", "uska", "kitna", "kahan", "kaise", "kyun",
  ];
  const lower = text.toLowerCase();
  const hinglishCount = hinglishWords.filter((w) => lower.includes(w)).length;
  if (hinglishCount >= 2) return SUPPORTED_LANGUAGES[0];

  return SUPPORTED_LANGUAGES[1];
}