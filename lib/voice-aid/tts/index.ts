// ============================================
// TTS ORCHESTRATOR
// Primary: Bhashini (server-side, natural voices)
// Fallback: Web Speech (client-side only)
// ============================================

import { synthesizeWithBhashini } from './bhashini';
import type { SupportedLanguage, TTSResult } from '@/types';

/**
 * Synthesize speech on the server side.
 * Uses Bhashini as primary. Web Speech TTS is client-side only.
 */
export async function synthesizeSpeech(
  text: string,
  language: SupportedLanguage,
  gender: 'male' | 'female' = 'female'
): Promise<TTSResult> {
  try {
    return await synthesizeWithBhashini(text, language, gender);
  } catch (error) {
    console.error('[ClauseWall] TTS: Bhashini failed, returning null audio:', error);

    // Return result without audio — UI can fall back to Web Speech
    return {
      audioUrl: null,
      audioBuffer: null,
      provider: 'bhashini',
      language,
      duration_ms: 0,
    };
  }
}

/**
 * Convert audio buffer to base64 string for transport.
 */
export function audioBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * Store audio in Supabase Storage and return a signed URL.
 */
export async function storeAudio(
  audioBuffer: ArrayBuffer,
  sessionId: string,
  messageId: string
): Promise<string | null> {
  try {
    const { createAdminClient } = await import('@/lib/supabase/admin');
    const supabase = createAdminClient();

    const filePath = `${sessionId}/${messageId}.mp3`;
    const buffer = Buffer.from(new Uint8Array(audioBuffer));

    const { error: uploadError } = await supabase.storage
      .from('voice-audio')
      .upload(filePath, buffer, {
        contentType: 'audio/mp3',
        upsert: true,
      });

    if (uploadError) {
      console.error('[ClauseWall] Audio upload failed:', uploadError);
      return null;
    }

    // Get signed URL (24 hour expiry)
    const { data: urlData } = await supabase.storage
      .from('voice-audio')
      .createSignedUrl(filePath, 86400); // 24 hours

    return urlData?.signedUrl || null;
  } catch (error) {
    console.error('[ClauseWall] Audio storage error:', error);
    return null;
  }
}

export { synthesizeWithBhashini } from './bhashini';
