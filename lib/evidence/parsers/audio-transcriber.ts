// ============================================
// AUDIO TRANSCRIBER
// Uses Groq Whisper API for transcription
// Supports MP3, WAV, M4A, OGG, FLAC, WEBM
// ============================================

import Groq from "groq-sdk";
import type { AudioTranscription, TranscriptionSegment } from "@/types/evidence";

const MAX_AUDIO_SIZE = 25 * 1024 * 1024; // 25MB Groq limit

// Key rotation (same pattern as lib/ai/groq-client.ts)
const GROQ_KEYS = [
  process.env.GROQ_API_KEY_1,
  process.env.GROQ_API_KEY_2,
  process.env.GROQ_API_KEY_3,
].filter(Boolean) as string[];

let currentKeyIndex = 0;

function getGroqClient(): Groq {
  if (GROQ_KEYS.length === 0) {
    throw new Error("No GROQ_API_KEY configured");
  }
  return new Groq({ apiKey: GROQ_KEYS[currentKeyIndex % GROQ_KEYS.length] });
}

function rotateKey(): void {
  currentKeyIndex = (currentKeyIndex + 1) % GROQ_KEYS.length;
}

/**
 * Transcribe an audio file using Groq Whisper
 */
export async function transcribeAudio(
  audioBuffer: Buffer,
  filename: string,
  options?: {
    language?: string;
    maxRetries?: number;
  }
): Promise<{ success: boolean; data: AudioTranscription | null; error?: string }> {
  const { language = "en", maxRetries = 3 } = options || {};

  if (audioBuffer.length > MAX_AUDIO_SIZE) {
    return {
      success: false,
      data: null,
      error: `Audio file too large (${Math.round(audioBuffer.length / 1024 / 1024)}MB). Maximum is 25MB. Please trim the audio.`,
    };
  }

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const groq = getGroqClient();

      // Convert Buffer to File-like object for Groq SDK
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const blob = new Blob([audioBuffer as any], { type: getMimeType(filename) });
      const file = new File([blob], filename, { type: getMimeType(filename) });

      const transcription = await groq.audio.transcriptions.create({
        file,
        model: "whisper-large-v3",
        language,
        response_format: "verbose_json",
        temperature: 0.0,
      });

      // Parse verbose_json response
      const text = typeof transcription === "string"
        ? transcription
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        : (transcription as any).text || "";

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const rawSegments = (transcription as any).segments || [];
      const segments: TranscriptionSegment[] = rawSegments.map(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (seg: any) => ({
          start: seg.start || 0,
          end: seg.end || 0,
          text: seg.text || "",
          speaker: null,
        })
      );

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const duration = (transcription as any).duration || 0;

      return {
        success: true,
        data: {
          text,
          duration_seconds: duration,
          language,
          segments,
        },
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`[Evidence] Whisper attempt ${attempt + 1} failed:`, message);

      // Rotate key on rate limit
      if (message.includes("429") || message.includes("rate")) {
        rotateKey();
      }

      if (attempt < maxRetries - 1) {
        const delay = Math.pow(2, attempt) * 1000;
        await new Promise((r) => setTimeout(r, delay));
      } else {
        return { success: false, data: null, error: message };
      }
    }
  }

  return { success: false, data: null, error: "All transcription attempts failed" };
}

/**
 * Get MIME type from filename
 */
function getMimeType(filename: string): string {
  const ext = filename.split(".").pop()?.toLowerCase();
  const mimeMap: Record<string, string> = {
    mp3: "audio/mpeg",
    wav: "audio/wav",
    m4a: "audio/mp4",
    ogg: "audio/ogg",
    flac: "audio/flac",
    webm: "audio/webm",
    aac: "audio/aac",
  };
  return mimeMap[ext || ""] || "audio/mpeg";
}

export { MAX_AUDIO_SIZE };
