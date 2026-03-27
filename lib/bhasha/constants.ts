// ============================================
// CLAUSEWALL — BHASHA ENGINE CONSTANTS
// Language configs, script mappings, numerals
// ============================================

import type {
  SupportedLanguage,
  IndianScript,
  LanguageConfig,
  NumeralSystem,
} from "@/types/bhasha";

// ============================================
// LANGUAGE CONFIGURATIONS
// ============================================

export const LANGUAGE_CONFIGS: Record<SupportedLanguage, LanguageConfig> = {
  en: {
    code: "en", name: "English", nativeName: "English", nativeChar: "A",
    script: "latin", scriptUnicodeRange: [0x0041, 0x024F],
    bhashiniCode: "en", groqSupported: true, webSpeechCode: "en-IN",
    fontFile: "", priority: 0,
  },
  hi: {
    code: "hi", name: "Hindi", nativeName: "हिन्दी", nativeChar: "अ",
    script: "devanagari", scriptUnicodeRange: [0x0900, 0x097F],
    bhashiniCode: "hi", groqSupported: true, webSpeechCode: "hi-IN",
    fontFile: "NotoSansDevanagari-Regular.ttf", priority: 0,
  },
  mr: {
    code: "mr", name: "Marathi", nativeName: "मराठी", nativeChar: "अ",
    script: "devanagari", scriptUnicodeRange: [0x0900, 0x097F],
    bhashiniCode: "mr", groqSupported: true, webSpeechCode: "mr-IN",
    fontFile: "NotoSansDevanagari-Regular.ttf", priority: 0,
  },
  bn: {
    code: "bn", name: "Bengali", nativeName: "বাংলা", nativeChar: "ব",
    script: "bengali", scriptUnicodeRange: [0x0980, 0x09FF],
    bhashiniCode: "bn", groqSupported: true, webSpeechCode: "bn-IN",
    fontFile: "NotoSansBengali-Regular.ttf", priority: 1,
  },
  ta: {
    code: "ta", name: "Tamil", nativeName: "தமிழ்", nativeChar: "அ",
    script: "tamil", scriptUnicodeRange: [0x0B80, 0x0BFF],
    bhashiniCode: "ta", groqSupported: true, webSpeechCode: "ta-IN",
    fontFile: "NotoSansTamil-Regular.ttf", priority: 1,
  },
  te: {
    code: "te", name: "Telugu", nativeName: "తెలుగు", nativeChar: "అ",
    script: "telugu", scriptUnicodeRange: [0x0C00, 0x0C7F],
    bhashiniCode: "te", groqSupported: true, webSpeechCode: "te-IN",
    fontFile: "NotoSansTelugu-Regular.ttf", priority: 1,
  },
  kn: {
    code: "kn", name: "Kannada", nativeName: "ಕನ್ನಡ", nativeChar: "ಅ",
    script: "kannada", scriptUnicodeRange: [0x0C80, 0x0CFF],
    bhashiniCode: "kn", groqSupported: true, webSpeechCode: "kn-IN",
    fontFile: "NotoSansKannada-Regular.ttf", priority: 1,
  },
  gu: {
    code: "gu", name: "Gujarati", nativeName: "ગુજરાતી", nativeChar: "અ",
    script: "gujarati", scriptUnicodeRange: [0x0A80, 0x0AFF],
    bhashiniCode: "gu", groqSupported: true, webSpeechCode: "gu-IN",
    fontFile: "NotoSansGujarati-Regular.ttf", priority: 1,
  },
  ml: {
    code: "ml", name: "Malayalam", nativeName: "മലയാളം", nativeChar: "അ",
    script: "malayalam", scriptUnicodeRange: [0x0D00, 0x0D7F],
    bhashiniCode: "ml", groqSupported: false, webSpeechCode: "ml-IN",
    fontFile: "NotoSansMalayalam-Regular.ttf", priority: 2,
  },
  pa: {
    code: "pa", name: "Punjabi", nativeName: "ਪੰਜਾਬੀ", nativeChar: "ਅ",
    script: "gurmukhi", scriptUnicodeRange: [0x0A00, 0x0A7F],
    bhashiniCode: "pa", groqSupported: false, webSpeechCode: "pa-IN",
    fontFile: "NotoSansGurmukhi-Regular.ttf", priority: 2,
  },
  or: {
    code: "or", name: "Odia", nativeName: "ଓଡ଼ିଆ", nativeChar: "ଅ",
    script: "odia", scriptUnicodeRange: [0x0B00, 0x0B7F],
    bhashiniCode: "or", groqSupported: false, webSpeechCode: "or-IN",
    fontFile: "NotoSansOriya-Regular.ttf", priority: 2,
  },
  as: {
    code: "as", name: "Assamese", nativeName: "অসমীয়া", nativeChar: "অ",
    script: "assamese", scriptUnicodeRange: [0x0980, 0x09FF],
    bhashiniCode: "as", groqSupported: false, webSpeechCode: "as-IN",
    fontFile: "NotoSansBengali-Regular.ttf", priority: 2, // shares Bengali script
  },
  ur: {
    code: "ur", name: "Urdu", nativeName: "اردو", nativeChar: "ا",
    script: "nastaliq", scriptUnicodeRange: [0x0600, 0x06FF],
    bhashiniCode: "ur", groqSupported: true, webSpeechCode: "ur-IN",
    fontFile: "NotoNaskhArabic-Regular.ttf", priority: 2,
  },
};

// ============================================
// SUPPORTED LANGUAGES LIST (for iteration)
// ============================================

export const SUPPORTED_LANGUAGES: SupportedLanguage[] = [
  "en", "hi", "mr", "bn", "ta", "te", "kn", "gu", "ml", "pa", "or", "as", "ur",
];

export const INDIAN_LANGUAGES: SupportedLanguage[] = [
  "hi", "mr", "bn", "ta", "te", "kn", "gu", "ml", "pa", "or", "as", "ur",
];

// ============================================
// SCRIPT UNICODE RANGES (for detection)
// ============================================

export const SCRIPT_UNICODE_RANGES: Record<IndianScript, RegExp> = {
  devanagari: /[\u0900-\u097F]/g,
  bengali: /[\u0980-\u09FF]/g,
  tamil: /[\u0B80-\u0BFF]/g,
  telugu: /[\u0C00-\u0C7F]/g,
  kannada: /[\u0C80-\u0CFF]/g,
  gujarati: /[\u0A80-\u0AFF]/g,
  malayalam: /[\u0D00-\u0D7F]/g,
  gurmukhi: /[\u0A00-\u0A7F]/g,
  odia: /[\u0B00-\u0B7F]/g,
  assamese: /[\u0980-\u09FF]/g,  // shares Bengali block
  nastaliq: /[\u0600-\u06FF\uFB50-\uFDFF\uFE70-\uFEFF]/g,
  latin: /[a-zA-Z]/g,
};

// ============================================
// NUMERAL SYSTEMS
// ============================================

export const NUMERAL_SYSTEMS: Record<string, NumeralSystem> = {
  devanagari: {
    language: "hi",
    script: "devanagari",
    digits: ["०", "१", "२", "३", "४", "५", "६", "७", "८", "९"],
    decimal: ".",
    thousand_separator: ",",
    lakh_crore_system: true,
  },
  bengali: {
    language: "bn",
    script: "bengali",
    digits: ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"],
    decimal: ".",
    thousand_separator: ",",
    lakh_crore_system: true,
  },
  tamil: {
    language: "ta",
    script: "tamil",
    digits: ["௦", "௧", "௨", "௩", "௪", "௫", "௬", "௭", "௮", "௯"],
    decimal: ".",
    thousand_separator: ",",
    lakh_crore_system: true,
  },
  telugu: {
    language: "te",
    script: "telugu",
    digits: ["౦", "౧", "౨", "౩", "౪", "౫", "౬", "౭", "౮", "౯"],
    decimal: ".",
    thousand_separator: ",",
    lakh_crore_system: true,
  },
  kannada: {
    language: "kn",
    script: "kannada",
    digits: ["೦", "೧", "೨", "೩", "೪", "೫", "೬", "೭", "೮", "೯"],
    decimal: ".",
    thousand_separator: ",",
    lakh_crore_system: true,
  },
  gujarati: {
    language: "gu",
    script: "gujarati",
    digits: ["૦", "૧", "૨", "૩", "૪", "૫", "૬", "૭", "૮", "૯"],
    decimal: ".",
    thousand_separator: ",",
    lakh_crore_system: true,
  },
  gurmukhi: {
    language: "pa",
    script: "gurmukhi",
    digits: ["੦", "੧", "੨", "੩", "੪", "੫", "੬", "੭", "੮", "੯"],
    decimal: ".",
    thousand_separator: ",",
    lakh_crore_system: true,
  },
  odia: {
    language: "or",
    script: "odia",
    digits: ["୦", "୧", "୨", "୩", "୪", "୫", "୬", "୭", "୮", "୯"],
    decimal: ".",
    thousand_separator: ",",
    lakh_crore_system: true,
  },
  malayalam: {
    language: "ml",
    script: "malayalam",
    digits: ["൦", "൧", "൨", "൩", "൪", "൫", "൬", "൭", "൮", "൯"],
    decimal: ".",
    thousand_separator: ",",
    lakh_crore_system: true,
  },
};

// ============================================
// REGIONAL NUMBER WORDS (lakh, crore, thousand)
// ============================================

export const REGIONAL_NUMBER_WORDS: Record<string, Record<string, number>> = {
  hi: {
    "हजार": 1000, "हज़ार": 1000,
    "लाख": 100000, "लाख़": 100000,
    "करोड़": 10000000, "करोड": 10000000,
    "सौ": 100, "दस": 10,
    "अरब": 1000000000,
  },
  mr: {
    "हजार": 1000,
    "लाख": 100000, "लक्ष": 100000,
    "कोटी": 10000000, "करोड": 10000000,
    "शंभर": 100,
  },
  bn: {
    "হাজার": 1000,
    "লক্ষ": 100000, "লাখ": 100000,
    "কোটি": 10000000,
    "শত": 100,
  },
  ta: {
    "ஆயிரம்": 1000,
    "லட்சம்": 100000, "இலட்சம்": 100000,
    "கோடி": 10000000,
    "நூறு": 100,
  },
  te: {
    "వేలు": 1000, "వేల": 1000,
    "లక్ష": 100000, "లక్షల": 100000,
    "కోటి": 10000000, "కోట్ల": 10000000,
    "వందల": 100,
  },
  kn: {
    "ಸಾವಿರ": 1000,
    "ಲಕ್ಷ": 100000,
    "ಕೋಟಿ": 10000000,
    "ನೂರು": 100,
  },
  gu: {
    "હજાર": 1000,
    "લાખ": 100000,
    "કરોડ": 10000000,
    "સો": 100,
  },
  ml: {
    "ആയിരം": 1000,
    "ലക്ഷം": 100000,
    "കോടി": 10000000,
    "നൂറ്": 100,
  },
  pa: {
    "ਹਜ਼ਾਰ": 1000,
    "ਲੱਖ": 100000,
    "ਕਰੋੜ": 10000000,
    "ਸੌ": 100,
  },
  or: {
    "ହଜାର": 1000,
    "ଲକ୍ଷ": 100000,
    "କୋଟି": 10000000,
    "ଶହ": 100,
  },
  as: {
    "হাজাৰ": 1000,
    "লাখ": 100000,
    "কোটি": 10000000,
  },
  ur: {
    "ہزار": 1000,
    "لاکھ": 100000,
    "کروڑ": 10000000,
    "سو": 100,
  },
};

// ============================================
// REGIONAL UNIT WORDS (months, days, years)
// ============================================

export const REGIONAL_UNIT_WORDS: Record<string, Record<string, string>> = {
  hi: {
    "महीने": "months", "महीना": "months", "माह": "months", "मास": "months",
    "दिन": "days", "दिवस": "days",
    "साल": "years", "वर्ष": "years", "सालों": "years",
    "हफ्ता": "weeks", "सप्ताह": "weeks",
    "घंटे": "hours", "घंटा": "hours",
    "प्रतिशत": "percent", "फीसदी": "percent",
  },
  mr: {
    "महिने": "months", "महिना": "months",
    "दिवस": "days",
    "वर्ष": "years", "वर्षे": "years",
    "आठवडे": "weeks",
    "तास": "hours",
    "टक्के": "percent",
  },
  bn: {
    "মাস": "months",
    "দিন": "days",
    "বছর": "years",
    "সপ্তাহ": "weeks",
    "ঘণ্টা": "hours",
    "শতাংশ": "percent",
  },
  ta: {
    "மாதம்": "months", "மாதங்கள்": "months",
    "நாட்கள்": "days", "நாள்": "days",
    "ஆண்டு": "years", "வருடம்": "years",
    "வாரம்": "weeks",
    "மணி": "hours",
    "சதவீதம்": "percent",
  },
  te: {
    "నెలలు": "months", "నెల": "months",
    "రోజులు": "days", "రోజు": "days",
    "సంవత్సరాలు": "years", "ఏళ్ళు": "years",
    "వారాలు": "weeks",
    "గంటలు": "hours",
    "శాతం": "percent",
  },
  kn: {
    "ತಿಂಗಳು": "months",
    "ದಿನ": "days", "ದಿನಗಳು": "days",
    "ವರ್ಷ": "years", "ವರ್ಷಗಳು": "years",
    "ವಾರ": "weeks",
    "ಗಂಟೆ": "hours",
    "ಶೇಕಡ": "percent",
  },
  gu: {
    "મહિના": "months", "મહિનો": "months",
    "દિવસ": "days",
    "વર્ષ": "years",
    "અઠવાડિયા": "weeks",
    "કલાક": "hours",
    "ટકા": "percent",
  },
  ml: {
    "മാസം": "months",
    "ദിവസം": "days",
    "വർഷം": "years",
    "ആഴ്ച": "weeks",
    "മണിക്കൂർ": "hours",
    "ശതമാനം": "percent",
  },
  pa: {
    "ਮਹੀਨੇ": "months", "ਮਹੀਨਾ": "months",
    "ਦਿਨ": "days",
    "ਸਾਲ": "years",
    "ਹਫ਼ਤੇ": "weeks",
    "ਘੰਟੇ": "hours",
    "ਫ਼ੀਸਦੀ": "percent",
  },
  or: {
    "ମାସ": "months",
    "ଦିନ": "days",
    "ବର୍ଷ": "years",
    "ସପ୍ତାହ": "weeks",
    "ଘଣ୍ଟା": "hours",
    "ପ୍ରତିଶତ": "percent",
  },
  as: {
    "মাহ": "months",
    "দিন": "days",
    "বছৰ": "years",
    "সপ্তাহ": "weeks",
    "ঘণ্টা": "hours",
    "শতাংশ": "percent",
  },
  ur: {
    "مہینے": "months", "ماہ": "months",
    "دن": "days",
    "سال": "years",
    "ہفتے": "weeks",
    "گھنٹے": "hours",
    "فیصد": "percent",
  },
};

// ============================================
// HINDI vs MARATHI DISAMBIGUATION WORDS
// ============================================

export const MARATHI_DISTINCTIVE_WORDS = new Set([
  "आहे", "नाही", "आणि", "करणे", "होणे", "करार", "करारनामा",
  "भाडे", "भाडेकरू", "मालक", "अनामत", "रक्कम", "नोंदणी",
  "महाराष्ट्र", "मुंबई", "पुणे", "नागपूर", "ठाणे",
  "कलम", "अधिनियम", "कायदा", "न्यायालय",
]);

export const HINDI_DISTINCTIVE_WORDS = new Set([
  "है", "हैं", "नहीं", "और", "करना", "होना", "करार", "अनुबंध",
  "किराया", "किरायेदार", "मकान", "जमानत", "रजिस्ट्री",
  "दिल्ली", "उत्तर", "मध्य", "राजस्थान", "बिहार",
  "धारा", "अधिनियम", "कानून", "न्यायालय",
]);

// ============================================
// FONT PATHS
// ============================================

export const FONT_BASE_PATH = "/fonts";

export function getFontPath(language: SupportedLanguage): string | null {
  const config = LANGUAGE_CONFIGS[language];
  if (!config.fontFile) return null;
  return `${FONT_BASE_PATH}/${config.fontFile}`;
}

// ============================================
// BHASHINI API CONSTANTS
// ============================================

export const BHASHINI_BASE_URL = "https://dhruva-api.bhashini.gov.in";
export const BHASHINI_PIPELINE_URL = `${BHASHINI_BASE_URL}/services/inference/pipeline`;
export const BHASHINI_METERING_URL = `${BHASHINI_BASE_URL}/services/inference/pipeline`;

export const BHASHINI_MAX_TEXT_LENGTH = 5000;
export const BHASHINI_TIMEOUT_MS = 15000;

// ============================================
// TTS CONSTANTS
// ============================================

export const TTS_CACHE_DURATION_DAYS = 30;
export const TTS_MAX_TEXT_LENGTH = 3000;
export const TTS_CHUNK_SIZE = 500; // chars per TTS chunk

// ============================================
// LANGUAGE DETECTION THRESHOLDS
// ============================================

export const DETECTION_CONFIDENCE_HIGH = 0.95;
export const DETECTION_CONFIDENCE_MEDIUM = 0.80;
export const DETECTION_CONFIDENCE_LOW = 0.60;
export const MIXED_SCRIPT_THRESHOLD = 0.15; // >15% chars = mixed
export const MIN_CHARS_FOR_DETECTION = 20;
