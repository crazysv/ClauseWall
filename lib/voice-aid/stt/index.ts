// ============================================
// STT ORCHESTRATOR
// Primary: Groq Whisper (server-side)
// Fallback: Web Speech API (client-side only)
// ============================================

import { transcribeWithWhisper } from './whisper';
import type { SupportedLanguage, STTResult } from '@/types';

/**
 * Transcribe audio on the server side.
 * Uses Groq Whisper as primary (and only server-side) provider.
 * Web Speech API runs client-side only — handled by UI components.
 */
export async function transcribeAudio(
  audioBuffer: Buffer | ArrayBuffer,
  language: SupportedLanguage,
  audioFormat: string = 'webm'
): Promise<STTResult> {
  try {
    return await transcribeWithWhisper(audioBuffer, language, audioFormat);
  } catch (error) {
    console.error('[ClauseWall] STT: Whisper failed, no server-side fallback available:', error);

    // Return empty result — UI can fall back to Web Speech
    return {
      text: '',
      language,
      confidence: 0,
      provider: 'groq_whisper',
      duration_ms: 0,
    };
  }
}

export { transcribeWithWhisper } from './whisper';
