// ============================================
// VOICE-AID TELEGRAM HANDLER
// Processes voice messages and photos for Telegram bot
// ============================================

import {
  sendMessage,
  sendChatAction,
  sendChatActionUpload,
  sendVoice,
  downloadFile,
} from '@/lib/bot/telegram-client';
import { processVoiceInput } from '@/lib/voice-aid/conversation-engine';
import { getLanguageConfig, SUPPORTED_LANGUAGES } from '@/lib/voice-aid/languages';
import type { SupportedLanguage } from '@/types';
import { Redis } from '@upstash/redis';

// ============================================
// DURABLE LANGUAGE PREFERENCE STORE
// Uses Upstash Redis with in-memory fallback for local dev
// ============================================

const REDIS_PREFIX = 'clausewall:voice:lang:';
const LANGUAGE_TTL_SECONDS = 60 * 60 * 24 * 30; // 30 days

// In-memory fallback for when Redis is not configured (local dev)
const memoryFallback = new Map<number, SupportedLanguage>();

let _redis: Redis | null | undefined;

function getRedis(): Redis | null {
  if (_redis !== undefined) return _redis;
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  _redis = url && token ? new Redis({ url, token }) : null;
  return _redis;
}

async function getUserLanguage(chatId: number): Promise<SupportedLanguage> {
  const redis = getRedis();
  if (redis) {
    try {
      const lang = await redis.get<string>(`${REDIS_PREFIX}${chatId}`);
      if (lang && lang in SUPPORTED_LANGUAGES) {
        return lang as SupportedLanguage;
      }
    } catch {
      // Redis failure — fall through to default
    }
  } else {
    const lang = memoryFallback.get(chatId);
    if (lang) return lang;
  }
  return 'hi';
}

async function setUserLanguage(chatId: number, lang: SupportedLanguage): Promise<void> {
  const redis = getRedis();
  if (redis) {
    try {
      await redis.set(`${REDIS_PREFIX}${chatId}`, lang, { ex: LANGUAGE_TTL_SECONDS });
    } catch {
      // Redis failure — fall through to memory
      memoryFallback.set(chatId, lang);
    }
  } else {
    memoryFallback.set(chatId, lang);
  }
}

// ============================================
// HANDLERS
// ============================================

/**
 * Handle a Telegram voice message.
 */
export async function handleVoiceMessage(
  chatId: number,
  fileId: string,
  duration: number
): Promise<void> {
  const language = await getUserLanguage(chatId);

  sendChatAction(chatId);

  try {
    // Download voice file from Telegram (OGG/Opus format)
    const audioBuffer = await downloadFile(fileId);

    // Process through voice engine
    const result = await processVoiceInput({
      audio: audioBuffer,
      audioFormat: 'ogg',
      language,
      telegramChatId: String(chatId),
    });

    if (!result.text) {
      await sendMessage(chatId, '🎤 Kuch sunaai nahi diya. Zara phir se bolo.');
      return;
    }

    // Try sending voice response
    if (result.audio_base64) {
      try {
        sendChatActionUpload(chatId);
        const responseAudio = Buffer.from(result.audio_base64, 'base64');
        await sendVoice(chatId, responseAudio, result.text.substring(0, 1024));
      } catch {
        // Fallback to text
        await sendMessage(chatId, result.text);
      }
    } else {
      await sendMessage(chatId, result.text);
    }
  } catch (error) {
    console.error('[ClauseWall Bot] Voice handler error:', error);
    const config = getLanguageConfig(language);
    await sendMessage(
      chatId,
      `❌ ${config.code === 'en' ? 'Could not process your voice message. Please try again.' : 'Maaf karo, voice message samajh nahi aaya. Phir se bhejo.'}`
    );
  }
}

/**
 * Handle a photo sent for voice-aid analysis.
 */
export async function handleVoicePhoto(
  chatId: number,
  fileId: string,
  caption?: string
): Promise<void> {
  const language = await getUserLanguage(chatId);

  sendChatAction(chatId);

  try {
    const photoBuffer = await downloadFile(fileId);

    const result = await processVoiceInput({
      photo: photoBuffer,
      photoMimeType: 'image/jpeg',
      text: caption,
      language,
      telegramChatId: String(chatId),
    });

    // Try sending voice response for photo analysis
    if (result.audio_base64) {
      try {
        sendChatActionUpload(chatId);
        const responseAudio = Buffer.from(result.audio_base64, 'base64');
        await sendVoice(chatId, responseAudio, result.text.substring(0, 1024));
      } catch {
        await sendMessage(chatId, result.text);
      }
    } else {
      await sendMessage(chatId, result.text);
    }
  } catch (error) {
    console.error('[ClauseWall Bot] Voice photo handler error:', error);
    await sendMessage(chatId, '❌ Photo se text padh nahi paaya. Clear photo bhejo ya text likh ke bhejo.');
  }
}

/**
 * Handle /voice command — enable voice mode.
 */
export async function handleVoiceCommand(chatId: number): Promise<void> {
  const language = await getUserLanguage(chatId);
  const config = getLanguageConfig(language);

  await sendMessage(
    chatId,
    [
      `🎤 <b>Voice Mode Active!</b> (${config.nativeName})`,
      '',
      `${config.greeting}`,
      '',
      '🗣️ <b>Voice message</b> bhejo — main sun ke jawaab dunga',
      '📸 <b>Contract ka photo</b> bhejo — main padh ke bataunga',
      '✍️ <b>Text</b> likh ke bhejo — main samjha dunga',
      '',
      '🌐 Use /language to change language',
      '🔄 Say "naya contract" for a fresh start',
    ].join('\n')
  );
}

/**
 * Handle /language command — show language selector.
 */
export async function handleLanguageCommand(chatId: number): Promise<void> {
  const currentLang = await getUserLanguage(chatId);
  const allLangs = Object.values(SUPPORTED_LANGUAGES);

  const lines = [
    '🌐 <b>Choose your language:</b>',
    '',
  ];

  for (const lang of allLangs) {
    const isSelected = lang.code === currentLang;
    lines.push(
      `${isSelected ? '✅' : '  '} ${lang.flag} <code>/lang_${lang.code}</code> — ${lang.nativeName} (${lang.name})`
    );
  }

  lines.push('', `Current: ${getLanguageConfig(currentLang).nativeName}`);

  await sendMessage(chatId, lines.join('\n'));
}

/**
 * Handle /lang_xx command — set language.
 */
export async function handleSetLanguage(chatId: number, langCode: string): Promise<void> {
  const code = langCode as SupportedLanguage;
  if (!(code in SUPPORTED_LANGUAGES)) {
    await sendMessage(chatId, '❌ Unknown language code. Use /language to see options.');
    return;
  }

  await setUserLanguage(chatId, code);
  const config = getLanguageConfig(code);

  await sendMessage(
    chatId,
    `✅ Language set to <b>${config.nativeName}</b> (${config.name})\n\n${config.greeting}`
  );
}

/**
 * Check if a text command is a language set command.
 */
export function isLanguageSetCommand(text: string): string | null {
  const match = text.match(/^\/lang_([a-z]{2})$/);
  return match ? match[1] : null;
}
