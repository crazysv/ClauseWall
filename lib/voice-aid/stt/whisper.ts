// ============================================
// GROQ WHISPER STT — PRIMARY STT PROVIDER
// Uses Groq's hosted Whisper Large V3 Turbo
// ============================================

import { callGroqWhisper } from '@/lib/ai/groq-client';
import { getLanguageConfig } from '@/lib/voice-aid/languages';
import type { SupportedLanguage, STTResult } from '@/types';

/**
 * Transcribe audio using Groq Whisper API (server-side only).
 * Primary STT provider — supports all 13 Indian languages.
 */
export async function transcribeWithWhisper(
  audioBuffer: Buffer | ArrayBuffer,
  language: SupportedLanguage,
  audioFormat: string = 'webm'
): Promise<STTResult> {
  const startTime = Date.now();
  const config = getLanguageConfig(language);

  try {
    const buffer = audioBuffer instanceof ArrayBuffer
      ? Buffer.from(audioBuffer)
      : audioBuffer;

    // Check for empty/too-short audio
    if (buffer.length < 100) {
      return {
        text: '',
        language,
        confidence: 0,
        provider: 'groq_whisper',
        duration_ms: Date.now() - startTime,
      };
    }

    const result = await callGroqWhisper(
      buffer,
      config.whisperCode,
      audioFormat
    );

    const duration = Date.now() - startTime;

    console.log(`[ClauseWall] Whisper STT: "${result.text.substring(0, 80)}..." (${duration}ms, lang=${language})`);

    return {
      text: result.text.trim(),
      language,
      confidence: result.text.length > 0 ? 0.9 : 0,
      provider: 'groq_whisper',
      duration_ms: duration,
    };
  } catch (error) {
    console.error('[ClauseWall] Whisper STT failed:', error);
    throw error; // Let caller handle fallback
  }
}
