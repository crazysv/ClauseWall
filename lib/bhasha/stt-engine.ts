// ============================================
// CLAUSEWALL — STT ENGINE
// Speech-to-Text: Bhashini → Groq Whisper
// ============================================

import type { SupportedLanguage, STTResult } from "@/types/bhasha";
import { getBhashiniClient } from "./bhashini-client";

// ============================================
// MAIN STT FUNCTION
// ============================================

/**
 * Transcribe audio to text.
 * Fallback chain: Bhashini ASR → Groq Whisper.
 */
export async function transcribeAudio(
  audioBuffer: Buffer,
  language: SupportedLanguage
): Promise<STTResult> {
  // Try Bhashini first
  try {
    const client = getBhashiniClient();
    const result = await client.speechToText(audioBuffer, language);
    if (result && result.text) {
      console.log(`[ClauseWall] Bhashini STT: ${result.text.length} chars`);
      return result;
    }
  } catch (error) {
    console.warn("[ClauseWall] Bhashini STT failed:", error);
  }

  // Fallback to Groq Whisper
  try {
    return await transcribeWithGroqWhisper(audioBuffer, language);
  } catch (error) {
    console.error("[ClauseWall] All STT services failed:", error);
    return {
      text: "",
      language,
      confidence: 0,
      service_used: "groq_whisper",
    };
  }
}

// ============================================
// GROQ WHISPER FALLBACK
// ============================================

async function transcribeWithGroqWhisper(
  audioBuffer: Buffer,
  language: SupportedLanguage
): Promise<STTResult> {
  // Use fetch to call Groq audio transcription API
  const formData = new FormData();

  const audioBlob = new Blob([new Uint8Array(audioBuffer)], { type: "audio/wav" });
  formData.append("file", audioBlob, "audio.wav");
  formData.append("model", "whisper-large-v3");
  formData.append("language", language);
  formData.append("response_format", "verbose_json");

  // Rotate through Groq keys (match existing pattern)
  const apiKey = process.env.GROQ_API_KEY || process.env.GROQ_API_KEY_1 || "";

  const response = await fetch("https://api.groq.com/openai/v1/audio/transcriptions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
    },
    body: formData,
    signal: AbortSignal.timeout(30000),
  });

  if (!response.ok) {
    throw new Error(`Groq Whisper failed: ${response.status}`);
  }

  const data = await response.json();

  return {
    text: data.text || "",
    language: (data.language as SupportedLanguage) || language,
    confidence: 0.80,
    segments: data.segments?.map((s: { text: string; start: number; end: number }) => ({
      text: s.text,
      start: s.start,
      end: s.end,
    })),
    service_used: "groq_whisper",
  };
}
