// ============================================
// VOICE-FIRST LEGAL AID — LANGUAGE REGISTRY
// 13 Indian languages across 3 tiers
// ============================================

import type { SupportedLanguage, LanguageConfig } from '@/types';

export const SUPPORTED_LANGUAGES: Record<SupportedLanguage, LanguageConfig> = {
  hi: {
    code: 'hi',
    name: 'Hindi',
    nativeName: 'हिन्दी',
    flag: '🇮🇳',
    bhashiniCode: 'hi',
    whisperCode: 'hi',
    webSpeechCode: 'hi-IN',
    tier: 1,
    sttSupported: true,
    ttsSupported: true,
    greeting: 'नमस्ते! मैं आपकी मदद के लिए हूँ।',
    freshStartPhrases: ['naya contract', 'naya shuru', 'dobara shuru', 'fresh start', 'नया कॉन्ट्रैक्ट', 'नया शुरू', 'दोबारा'],
    helpPhrases: ['madad', 'help', 'kya kar sakte ho', 'मदद', 'क्या कर सकते हो', 'kaise use kare'],
  },
  mr: {
    code: 'mr',
    name: 'Marathi',
    nativeName: 'मराठी',
    flag: '🇮🇳',
    bhashiniCode: 'mr',
    whisperCode: 'mr',
    webSpeechCode: 'mr-IN',
    tier: 1,
    sttSupported: true,
    ttsSupported: true,
    greeting: 'नमस्कार! मी तुम्हाला मदत करण्यासाठी आहे.',
    freshStartPhrases: ['nava contract', 'punha suru', 'नवा कॉन्ट्रॅक्ट', 'पुन्हा सुरू'],
    helpPhrases: ['madad', 'मदत', 'काय करू शकता'],
  },
  ta: {
    code: 'ta',
    name: 'Tamil',
    nativeName: 'தமிழ்',
    flag: '🇮🇳',
    bhashiniCode: 'ta',
    whisperCode: 'ta',
    webSpeechCode: 'ta-IN',
    tier: 1,
    sttSupported: true,
    ttsSupported: true,
    greeting: 'வணக்கம்! நான் உங்களுக்கு உதவ இங்கே இருக்கிறேன்.',
    freshStartPhrases: ['pudhu contract', 'pudhu thodakku', 'புது கான்ட்ராக்ட்', 'புது தொடக்கு'],
    helpPhrases: ['உதவி', 'enna seiyya mudiyum', 'என்ன செய்ய முடியும்'],
  },
  te: {
    code: 'te',
    name: 'Telugu',
    nativeName: 'తెలుగు',
    flag: '🇮🇳',
    bhashiniCode: 'te',
    whisperCode: 'te',
    webSpeechCode: 'te-IN',
    tier: 1,
    sttSupported: true,
    ttsSupported: true,
    greeting: 'నమస్కారం! నేను మీకు సహాయం చేయడానికి ఇక్కడ ఉన్నాను.',
    freshStartPhrases: ['kotha contract', 'malli start', 'కొత్త కాంట్రాక్ట్', 'మళ్ళీ స్టార్ట్'],
    helpPhrases: ['సహాయం', 'emi cheyagalaru', 'ఏమి చేయగలరు'],
  },
  bn: {
    code: 'bn',
    name: 'Bengali',
    nativeName: 'বাংলা',
    flag: '🇮🇳',
    bhashiniCode: 'bn',
    whisperCode: 'bn',
    webSpeechCode: 'bn-IN',
    tier: 2,
    sttSupported: true,
    ttsSupported: true,
    greeting: 'নমস্কার! আমি আপনাকে সাহায্য করতে এখানে আছি।',
    freshStartPhrases: ['notun contract', 'নতুন কন্ট্র্যাক্ট', 'আবার শুরু'],
    helpPhrases: ['সাহায্য', 'ki korte paro'],
  },
  kn: {
    code: 'kn',
    name: 'Kannada',
    nativeName: 'ಕನ್ನಡ',
    flag: '🇮🇳',
    bhashiniCode: 'kn',
    whisperCode: 'kn',
    webSpeechCode: 'kn-IN',
    tier: 2,
    sttSupported: true,
    ttsSupported: true,
    greeting: 'ನಮಸ್ಕಾರ! ನಾನು ನಿಮಗೆ ಸಹಾಯ ಮಾಡಲು ಇಲ್ಲಿದ್ದೇನೆ.',
    freshStartPhrases: ['hosa contract', 'ಹೊಸ ಕಾಂಟ್ರಾಕ್ಟ್', 'ಮತ್ತೆ ಶುರು'],
    helpPhrases: ['ಸಹಾಯ', 'enu maadaballu'],
  },
  gu: {
    code: 'gu',
    name: 'Gujarati',
    nativeName: 'ગુજરાતી',
    flag: '🇮🇳',
    bhashiniCode: 'gu',
    whisperCode: 'gu',
    webSpeechCode: 'gu-IN',
    tier: 2,
    sttSupported: true,
    ttsSupported: true,
    greeting: 'નમસ્તે! હું તમારી મદદ માટે અહીં છું.',
    freshStartPhrases: ['navo contract', 'નવો કોન્ટ્રાક્ટ', 'ફરીથી શરૂ'],
    helpPhrases: ['મદદ', 'shu kari shako'],
  },
  ml: {
    code: 'ml',
    name: 'Malayalam',
    nativeName: 'മലയാളം',
    flag: '🇮🇳',
    bhashiniCode: 'ml',
    whisperCode: 'ml',
    webSpeechCode: 'ml-IN',
    tier: 2,
    sttSupported: true,
    ttsSupported: true,
    greeting: 'നമസ്കാരം! ഞാൻ നിങ്ങളെ സഹായിക്കാൻ ഇവിടെയുണ്ട്.',
    freshStartPhrases: ['puthiya contract', 'പുതിയ കോൺട്രാക്ട്', 'വീണ്ടും തുടങ്ങുക'],
    helpPhrases: ['സഹായം', 'enthu cheyyaan kazhiyum'],
  },
  pa: {
    code: 'pa',
    name: 'Punjabi',
    nativeName: 'ਪੰਜਾਬੀ',
    flag: '🇮🇳',
    bhashiniCode: 'pa',
    whisperCode: 'pa',
    webSpeechCode: 'pa-IN',
    tier: 3,
    sttSupported: true,
    ttsSupported: true,
    greeting: 'ਸਤ ਸ੍ਰੀ ਅਕਾਲ! ਮੈਂ ਤੁਹਾਡੀ ਮਦਦ ਲਈ ਇੱਥੇ ਹਾਂ।',
    freshStartPhrases: ['nava contract', 'ਨਵਾਂ ਕੰਟਰੈਕਟ', 'ਦੁਬਾਰਾ ਸ਼ੁਰੂ'],
    helpPhrases: ['ਮਦਦ', 'ki kar sakde ho'],
  },
  or: {
    code: 'or',
    name: 'Odia',
    nativeName: 'ଓଡ଼ିଆ',
    flag: '🇮🇳',
    bhashiniCode: 'or',
    whisperCode: 'or',
    webSpeechCode: 'or-IN',
    tier: 3,
    sttSupported: true,
    ttsSupported: true,
    greeting: 'ନମସ୍କାର! ମୁଁ ଆପଣଙ୍କୁ ସାହାଯ୍ୟ କରିବାକୁ ଏଠାରେ ଅଛି।',
    freshStartPhrases: ['nua contract', 'ନୂଆ କଣ୍ଟ୍ରାକ୍ଟ', 'ପୁଣି ଆରମ୍ଭ'],
    helpPhrases: ['ସାହାଯ୍ୟ', 'kana kari pariba'],
  },
  as: {
    code: 'as',
    name: 'Assamese',
    nativeName: 'অসমীয়া',
    flag: '🇮🇳',
    bhashiniCode: 'as',
    whisperCode: 'as',
    webSpeechCode: 'as-IN',
    tier: 3,
    sttSupported: true,
    ttsSupported: true,
    greeting: 'নমস্কাৰ! মই আপোনাক সহায় কৰিবলৈ ইয়াত আছোঁ।',
    freshStartPhrases: ['notun contract', 'নতুন কন্ট্ৰেক্ট', 'আকৌ আৰম্ভ'],
    helpPhrases: ['সহায়', 'ki koribo pari'],
  },
  ur: {
    code: 'ur',
    name: 'Urdu',
    nativeName: 'اردو',
    flag: '🇮🇳',
    bhashiniCode: 'ur',
    whisperCode: 'ur',
    webSpeechCode: 'ur-IN',
    tier: 3,
    sttSupported: true,
    ttsSupported: true,
    greeting: 'السلام علیکم! میں آپ کی مدد کے لیے یہاں ہوں۔',
    freshStartPhrases: ['naya contract', 'نیا کانٹریکٹ', 'دوبارہ شروع'],
    helpPhrases: ['مدد', 'kya kar sakte hain'],
  },
  en: {
    code: 'en',
    name: 'English',
    nativeName: 'English',
    flag: '🇬🇧',
    bhashiniCode: 'en',
    whisperCode: 'en',
    webSpeechCode: 'en-IN',
    tier: 1,
    sttSupported: true,
    ttsSupported: true,
    greeting: 'Hello! I am here to help you understand your contract.',
    freshStartPhrases: ['new contract', 'fresh start', 'start over', 'new document', 'reset'],
    helpPhrases: ['help', 'what can you do', 'how to use'],
  },
};

/** Get language configuration by code */
export function getLanguageConfig(code: SupportedLanguage): LanguageConfig {
  return SUPPORTED_LANGUAGES[code] || SUPPORTED_LANGUAGES.hi;
}

/** Get all languages as an array, sorted by tier */
export function getAllLanguages(): LanguageConfig[] {
  return Object.values(SUPPORTED_LANGUAGES).sort((a, b) => a.tier - b.tier);
}

/** Detect language from text using Unicode script ranges */
export function detectLanguageFromText(text: string): SupportedLanguage {
  if (!text || text.trim().length === 0) return 'hi';

  // Count characters in each script range
  const scriptCounts: Record<string, number> = {};

  for (const char of text) {
    const code = char.charCodeAt(0);
    if (code >= 0x0900 && code <= 0x097F) scriptCounts['devanagari'] = (scriptCounts['devanagari'] || 0) + 1;
    else if (code >= 0x0B80 && code <= 0x0BFF) scriptCounts['tamil'] = (scriptCounts['tamil'] || 0) + 1;
    else if (code >= 0x0C00 && code <= 0x0C7F) scriptCounts['telugu'] = (scriptCounts['telugu'] || 0) + 1;
    else if (code >= 0x0980 && code <= 0x09FF) scriptCounts['bengali'] = (scriptCounts['bengali'] || 0) + 1;
    else if (code >= 0x0C80 && code <= 0x0CFF) scriptCounts['kannada'] = (scriptCounts['kannada'] || 0) + 1;
    else if (code >= 0x0A80 && code <= 0x0AFF) scriptCounts['gujarati'] = (scriptCounts['gujarati'] || 0) + 1;
    else if (code >= 0x0D00 && code <= 0x0D7F) scriptCounts['malayalam'] = (scriptCounts['malayalam'] || 0) + 1;
    else if (code >= 0x0A00 && code <= 0x0A7F) scriptCounts['gurmukhi'] = (scriptCounts['gurmukhi'] || 0) + 1;
    else if (code >= 0x0B00 && code <= 0x0B7F) scriptCounts['odia'] = (scriptCounts['odia'] || 0) + 1;
    else if (code >= 0x0600 && code <= 0x06FF) scriptCounts['arabic'] = (scriptCounts['arabic'] || 0) + 1;
    else if ((code >= 0x0041 && code <= 0x007A)) scriptCounts['latin'] = (scriptCounts['latin'] || 0) + 1;
  }

  // Find dominant script
  let maxScript = '';
  let maxCount = 0;
  for (const [script, count] of Object.entries(scriptCounts)) {
    if (count > maxCount) {
      maxCount = count;
      maxScript = script;
    }
  }

  const scriptToLang: Record<string, SupportedLanguage> = {
    tamil: 'ta',
    telugu: 'te',
    kannada: 'kn',
    gujarati: 'gu',
    malayalam: 'ml',
    gurmukhi: 'pa',
    odia: 'or',
    arabic: 'ur',
    latin: 'en',
  };

  if (scriptToLang[maxScript]) return scriptToLang[maxScript];

  // Devanagari: could be Hindi or Marathi
  if (maxScript === 'devanagari') {
    const lower = text.toLowerCase();
    const marathiWords = ['आहे', 'नाही', 'तुम्ही', 'आम्ही', 'करा', 'आणि', 'पण', 'हे', 'ते', 'ही'];
    const marathiCount = marathiWords.filter(w => lower.includes(w)).length;
    return marathiCount >= 2 ? 'mr' : 'hi';
  }

  // Bengali script: could be Bengali or Assamese
  if (maxScript === 'bengali') {
    const assameseWords = ['আছোঁ', 'কৰি', 'নকৰি', 'হয়', 'আৰু'];
    const assameseCount = assameseWords.filter(w => text.includes(w)).length;
    return assameseCount >= 1 ? 'as' : 'bn';
  }

  // If Latin (English) with Hinglish patterns, default to Hindi
  if (maxScript === 'latin') {
    const hinglishWords = ['karo', 'hai', 'kya', 'mein', 'dikhao', 'batao', 'samjhao', 'bhejo', 'mera', 'tera'];
    const lower = text.toLowerCase();
    const hinglishCount = hinglishWords.filter(w => lower.includes(w)).length;
    if (hinglishCount >= 2) return 'hi';
    return 'en';
  }

  return 'hi'; // Default to Hindi
}

/** Check if text is a fresh start phrase for the given language */
export function isFreshStartPhrase(text: string, language: SupportedLanguage): boolean {
  const normalized = text.toLowerCase().trim();
  const config = getLanguageConfig(language);

  // Check language-specific phrases
  if (config.freshStartPhrases.some(p => normalized.includes(p.toLowerCase()))) return true;

  // Universal phrases
  const universal = ['reset', 'new', 'start over', 'fresh'];
  return universal.some(p => normalized.includes(p));
}

/** Check if text is a help phrase for the given language */
export function isHelpPhrase(text: string, language: SupportedLanguage): boolean {
  const normalized = text.toLowerCase().trim();
  const config = getLanguageConfig(language);

  if (config.helpPhrases.some(p => normalized.includes(p.toLowerCase()))) return true;

  const universal = ['help', '?'];
  return universal.some(p => normalized.includes(p));
}
