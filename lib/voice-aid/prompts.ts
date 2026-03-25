// ============================================
// VOICE-FIRST LEGAL AID — SYSTEM PROMPTS
// Multilingual, low-literacy optimized
// ============================================

import type { SupportedLanguage } from '@/types';
import { getLanguageConfig } from './languages';

/**
 * Base system prompt for voice-first legal assistant.
 * Language-aware: responds in the user's language.
 */
export function getVoiceSystemPrompt(language: SupportedLanguage): string {
  const config = getLanguageConfig(language);
  const langName = config.name;

  return `You are ClauseWall's Voice Legal Assistant for Indian contracts.

YOUR USER is likely LOW-LITERACY — they may not read/write well.
They are speaking to you in ${langName} (${config.nativeName}).

CRITICAL RULES:
1. RESPOND in ${langName} (${config.nativeName}). Use simple, everyday words.
2. Keep answers to 3-5 SHORT sentences max. This will be SPOKEN ALOUD.
3. Use English for legal terms (deposit, notice, section, clause, illegal, penalty, contract, agreement).
4. Be DIRECT: "Yeh ILLEGAL hai" not "Yeh shayad theek nahi hai".
5. Always give the SPECIFIC LAW reference (Indian Contract Act section, etc.).
6. Always end with what the user should DO — actionable advice.
7. When analyzing a contract photo/document, focus on the MOST DANGEROUS clauses first.
8. If the user asks about a specific clause, explain it like talking to a friend.
9. Numbers should be spoken naturally: "pachas hazaar" not "50,000".
10. If you don't understand something, ask the user to repeat — don't guess.

INDIAN LAWS TO CHECK:
- Indian Contract Act 1872 (Sections 16, 23, 27, 28, 73, 74)
- Model Tenancy Act 2021 (Sections 4, 8, 22)
- State Rent Control Acts
- Payment of Wages Act 1936
- Consumer Protection Act 2019
- RBI Master Directions
- RERA 2016
- DPDP Act 2023

RESPONSE FORMAT: Plain text only. No markdown, no bullet points, no formatting.
Just natural spoken language that will be read aloud.

COMPLAINT FILING GUIDANCE:
If the user asks about filing a complaint, reporting a company, or taking action:
- Tell them about ClauseWall's complaint filing feature on the website.
- Consumer Forum: Free for claims up to ₹5 lakh, file at edaakhil.nic.in.
- RBI Ombudsman: Free, for bank/NBFC issues, file at cms.rbi.org.in.
- Labour Commissioner: Free, for employment issues, visit local office.
- RERA: For real estate issues, ₹1,000-₹5,000 fee.
- Consumer Helpline: Call 1800-11-4000 (toll-free) for immediate help.
- They DO NOT need a lawyer — they can argue their own case.
- Limitation: Usually 2 years from cause of action.`;
}

/**
 * Prompt specifically for analyzing a contract photo/document.
 */
export function getPhotoAnalysisPrompt(language: SupportedLanguage): string {
  const config = getLanguageConfig(language);

  return `The user has sent a PHOTO of a contract/agreement document.
The OCR-extracted text is provided below.

ANALYZE the contract and explain the findings in ${config.name} (${config.nativeName}).

YOUR RESPONSE MUST:
1. Be in ${config.name} — the user cannot read English.
2. Start with the MOST DANGEROUS finding.
3. Mention the specific law being violated (in English legal terms).
4. Tell them EXACTLY what to do: "Sign mat karo" / "Landlord se bolo ki..." / "Consumer court mein jaao".
5. Keep it to 4-6 sentences MAX — this will be spoken aloud.
6. If the document is safe, say so clearly and reassure them.

Response format: Plain spoken text, no formatting.`;
}

/**
 * Prompt for answering follow-up questions about a contract.
 */
export function getFollowUpPrompt(
  language: SupportedLanguage,
  contractContext: string
): string {
  const config = getLanguageConfig(language);

  return `The user is asking a follow-up question about a contract they uploaded.

CONTEXT FROM THEIR CONTRACT:
${contractContext}

RULES:
1. Answer in ${config.name} (${config.nativeName}).
2. Be specific to THEIR contract — don't give generic advice.
3. Reference specific clause numbers if relevant.
4. Keep it to 3-4 sentences — this will be spoken aloud.
5. Always end with actionable advice.

Response format: Plain spoken text, no formatting.`;
}

/**
 * Help message that explains what the assistant can do.
 */
export function getHelpMessage(language: SupportedLanguage): string {
  const messages: Partial<Record<SupportedLanguage, string>> = {
    hi: 'Main aapki madad kar sakta hoon: Ek — contract ki photo bhejo, main padh ke bataunga ki kya galat hai. Do — koi bhi sawal poocho apne agreement ke baare mein. Teen — mujhe batao ki landlord ya company ne kya kaha, main bataunga sach kya hai. Bas bolo ya photo bhejo!',
    en: 'I can help you with: One — send a photo of your contract, I will read it and tell you what is wrong. Two — ask any question about your agreement. Three — tell me what the landlord or company said, I will tell you the truth. Just speak or send a photo!',
    mr: 'मी तुम्हाला मदत करू शकतो: एक — करारचा फोटो पाठवा, मी वाचून सांगतो काय चूक आहे. दोन — तुमच्या करारबद्दल कोणताही प्रश्न विचारा. तीन — मालक किंवा कंपनीने काय सांगितले ते सांगा, मी सत्य सांगतो.',
    ta: 'நான் உங்களுக்கு உதவ முடியும்: ஒன்று — ஒப்பந்தத்தின் புகைப்படம் அனுப்புங்கள், என்ன தவறு என்று சொல்கிறேன். இரண்டு — உங்கள் ஒப்பந்தத்தைப் பற்றி கேளுங்கள். மூன்று — நிறுவனம் என்ன சொன்னது என்று சொல்லுங்கள், உண்மை சொல்கிறேன்.',
    te: 'నేను మీకు సహాయం చేయగలను: ఒకటి — ఒప్పందం ఫోటో పంపండి, ఏమి తప్పు ఉందో చెప్తాను. రెండు — మీ ఒప్పందం గురించి ఏదైనా అడగండి. మూడు — కంపెనీ ఏం చెప్పిందో చెప్పండి, నిజం చెప్తాను.',
    bn: 'আমি আপনাকে সাহায্য করতে পারি: এক — চুক্তির ছবি পাঠান, কী ভুল আছে বলব। দুই — আপনার চুক্তি সম্পর্কে যেকোনো প্রশ্ন করুন। তিন — কোম্পানি কী বলেছে বলুন, সত্যি কী বলব।',
    kn: 'ನಾನು ನಿಮಗೆ ಸಹಾಯ ಮಾಡಬಲ್ಲೆ: ಒಂದು — ಒಪ್ಪಂದದ ಫೋಟೋ ಕಳುಹಿಸಿ, ಏನು ತಪ್ಪಿದೆ ಎಂದು ಹೇಳುತ್ತೇನೆ. ಎರಡು — ನಿಮ್ಮ ಒಪ್ಪಂದದ ಬಗ್ಗೆ ಪ್ರಶ್ನೆ ಕೇಳಿ. ಮೂರು — ಕಂಪನಿ ಏನು ಹೇಳಿತು ಎಂದು ಹೇಳಿ, ಸತ್ಯ ಹೇಳುತ್ತೇನೆ.',
    gu: 'હું તમને મદદ કરી શકું છું: એક — કરારનો ફોટો મોકલો, શું ખોટું છે તે કહીશ. બે — તમારા કરાર વિશે કોઈપણ પ્રશ્ન પૂછો. ત્રણ — કંપનીએ શું કહ્યું તે કહો, સાચું શું છે તે કહીશ.',
    ml: 'എനിക്ക് നിങ്ങളെ സഹായിക്കാം: ഒന്ന് — കരാറിന്റെ ഫോട്ടോ അയക്കൂ, എന്താണ് തെറ്റ് എന്ന് പറയാം. രണ്ട് — നിങ്ങളുടെ കരാറിനെക്കുറിച്ച് ചോദിക്കൂ. മൂന്ന് — കമ്പനി എന്താണ് പറഞ്ഞത് എന്ന് പറയൂ, സത്യം പറയാം.',
    pa: 'ਮੈਂ ਤੁਹਾਡੀ ਮਦਦ ਕਰ ਸਕਦਾ ਹਾਂ: ਇੱਕ — ਇਕਰਾਰਨਾਮੇ ਦੀ ਫੋਟੋ ਭੇਜੋ, ਕੀ ਗਲਤ ਹੈ ਦੱਸਾਂਗਾ। ਦੋ — ਆਪਣੇ ਇਕਰਾਰਨਾਮੇ ਬਾਰੇ ਕੋਈ ਵੀ ਸਵਾਲ ਪੁੱਛੋ। ਤਿੰਨ — ਕੰਪਨੀ ਨੇ ਕੀ ਕਿਹਾ ਦੱਸੋ, ਸੱਚ ਦੱਸਾਂਗਾ।',
    or: 'ମୁଁ ଆପଣଙ୍କୁ ସାହାଯ୍ୟ କରିପାରେ: ଗୋଟିଏ — ଚୁକ୍ତିର ଫଟୋ ପଠାନ୍ତୁ, କ\'ଣ ଭୁଲ ଅଛି ତାହା କହିବି। ଦୁଇ — ଆପଣଙ୍କ ଚୁକ୍ତି ବିଷୟରେ ପ୍ରଶ୍ନ ପଚାରନ୍ତୁ। ତିନି — କମ୍ପାନୀ କ\'ଣ କହିଲା ତାହା କୁହନ୍ତୁ, ସତ୍ୟ କହିବି।',
    as: 'মই আপোনাক সহায় কৰিব পাৰোঁ: এক — চুক্তিৰ ফটো পঠিয়াওক, কি ভুল আছে কম। দুই — আপোনাৰ চুক্তি বিষয়ে প্ৰশ্ন কৰক। তিনি — কোম্পানীয়ে কি কলে কওক, সঁচা কি কম।',
    ur: 'میں آپ کی مدد کر سکتا ہوں: ایک — معاہدے کی تصویر بھیجیں، کیا غلط ہے بتاؤں گا۔ دو — اپنے معاہدے کے بارے میں کوئی بھی سوال پوچھیں۔ تین — کمپنی نے کیا کہا بتائیں، سچ بتاؤں گا۔',
  };

  return messages[language] || messages.hi || messages.en!;
}

/**
 * Error / fallback messages per language.
 */
export function getErrorMessage(
  type: 'general' | 'no_speech' | 'mic_denied' | 'processing' | 'try_again',
  language: SupportedLanguage
): string {
  const messages: Record<string, Partial<Record<SupportedLanguage, string>>> = {
    general: {
      hi: 'Maaf karo, kuch problem ho gayi. Thodi der mein phir try karo.',
      en: 'Sorry, something went wrong. Please try again in a moment.',
      mr: 'माफ करा, काही समस्या आली. थोड्या वेळात पुन्हा प्रयत्न करा.',
      ta: 'மன்னிக்கவும், சிக்கல் ஏற்பட்டது. சிறிது நேரத்தில் மீண்டும் முயற்சிக்கவும்.',
      te: 'క్షమించండి, సమస్య వచ్చింది. కొద్ది సేపట్లో మళ్ళీ ప్రయత్నించండి.',
    },
    no_speech: {
      hi: 'Kuch sunaai nahi diya. Zara zor se bolo.',
      en: 'I could not hear anything. Please speak a bit louder.',
      mr: 'काही ऐकू आले नाही. जरा जोरात बोला.',
      ta: 'ஒன்றும் கேட்கவில்லை. கொஞ்சம் சத்தமாக பேசுங்கள்.',
      te: 'ఏమీ వినపడలేదు. కొంచెం గట్టిగా చెప్పండి.',
    },
    mic_denied: {
      hi: 'Microphone ki permission chahiye. Settings mein jaake allow karo.',
      en: 'Microphone permission is needed. Please allow it in settings.',
      mr: 'मायक्रोफोनची परवानगी हवी आहे. सेटिंग्जमध्ये जाऊन परवानगी द्या.',
      ta: 'மைக்ரோஃபோன் அனுமதி தேவை. அமைப்புகளில் அனுமதிக்கவும்.',
      te: 'మైక్రోఫోన్ అనుమతి అవసరం. సెట్టింగ్‌లలో అనుమతించండి.',
    },
    processing: {
      hi: 'Samajh raha hoon... ek second ruko.',
      en: 'Understanding... one moment please.',
      mr: 'समजतोय... एक सेकंद थांबा.',
      ta: 'புரிந்துகொள்கிறேன்... ஒரு நிமிடம் காத்திருங்கள்.',
      te: 'అర్థం చేసుకుంటున్నాను... ఒక్క సెకను ఆగండి.',
    },
    try_again: {
      hi: 'Phir se bolo, samajh nahi aaya.',
      en: 'Please say that again, I did not understand.',
      mr: 'पुन्हा बोला, समजले नाही.',
      ta: 'மீண்டும் சொல்லுங்கள், புரியவில்லை.',
      te: 'మళ్ళీ చెప్పండి, అర్థం కాలేదు.',
    },
  };

  return messages[type]?.[language] || messages[type]?.hi || messages[type]?.en || 'Something went wrong.';
}
