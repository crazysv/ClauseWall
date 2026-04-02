// ============================================
// AUDIO EVIDENCE PARSER
// Transcribes audio recordings using Groq Whisper
// Reuses existing STT infrastructure
// ============================================

import { callGroqWhisper } from '@/lib/ai/groq-client';

const MAX_AUDIO_SIZE = 25 * 1024 * 1024; // 25MB Groq limit

const FORMAT_TO_MIME: Record<string, string> = {
  mp3: 'audio/mp3',
  wav: 'audio/wav',
  ogg: 'audio/ogg',
  m4a: 'audio/m4a',
  webm: 'audio/webm',
  mpeg: 'audio/mpeg',
};

/**
 * Transcribe audio evidence using Groq Whisper
 */
export async function transcribeAudioEvidence(
  audioBuffer: ArrayBuffer,
  format: string = 'mp3'
): Promise<{ text: string; confidence: number; duration_seconds: number }> {
  try {
    const bufferSize = audioBuffer.byteLength;

    // Check file size
    if (bufferSize > MAX_AUDIO_SIZE) {
      console.error(`[ClauseWall] Audio file too large: ${(bufferSize / 1024 / 1024).toFixed(1)}MB (max 25MB)`);
      return {
        text: '[Error: Audio file too large. Please trim to under 10 minutes or 25MB.]',
        confidence: 0,
        duration_seconds: 0,
      };
    }

    if (bufferSize < 100) {
      return {
        text: '',
        confidence: 0,
        duration_seconds: 0,
      };
    }

    const startTime = Date.now();

    // Convert ArrayBuffer to Buffer for the Whisper API
    const buffer = Buffer.from(new Uint8Array(audioBuffer));

    // Normalize format
    const normalizedFormat = format.replace('.', '').toLowerCase();
    const audioFormat = FORMAT_TO_MIME[normalizedFormat] ? normalizedFormat : 'mp3';


    // Call Groq Whisper — auto-detect language (supports Hindi, English, etc.)
    const result = await callGroqWhisper(buffer, '', audioFormat);

    const elapsed = Date.now() - startTime;
    const text = result.text?.trim() || '';

    // Estimate duration from file size (rough: ~1MB per minute for mp3)
    const estimatedDuration = Math.round(bufferSize / (1024 * 1024) * 60);

    // Confidence based on output length relative to estimated duration
    let confidence = 0;
    if (text.length > 100) confidence = 0.85;
    else if (text.length > 20) confidence = 0.6;
    else if (text.length > 0) confidence = 0.3;


    return {
      text,
      confidence,
      duration_seconds: estimatedDuration,
    };
  } catch (error) {
    console.error('[ClauseWall] Audio transcription failed:', error);
    return {
      text: '',
      confidence: 0,
      duration_seconds: 0,
    };
  }
}
