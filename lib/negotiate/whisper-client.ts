// ============================================
// WHISPER CLIENT — GROQ WHISPER INTEGRATION
// Audio transcription via Groq's Whisper API
// Reuses key rotation logic from groq-client
// ============================================

import type { WhisperTranscriptionResponse } from "@/types";

// ============================================
// API KEY ROTATION (mirrors groq-client.ts)
// ============================================

const API_KEYS = [
  process.env.GROQ_API_KEY_1,
  process.env.GROQ_API_KEY_2,
  process.env.GROQ_API_KEY_3,
].filter(Boolean) as string[];

if (API_KEYS.length === 0 && process.env.GROQ_API_KEY) {
  API_KEYS.push(process.env.GROQ_API_KEY);
}

let currentKeyIndex = 0;
const exhaustedKeys = new Set<number>();
const KEY_COOLDOWN_MS = 60 * 1000;

function getApiKey(): string {
  let attempts = 0;
  while (exhaustedKeys.has(currentKeyIndex) && attempts < API_KEYS.length) {
    currentKeyIndex = (currentKeyIndex + 1) % API_KEYS.length;
    attempts++;
  }

  if (attempts >= API_KEYS.length) {
    exhaustedKeys.clear();
  }

  return API_KEYS[currentKeyIndex] || "";
}

function switchToNextKey(): boolean {

  exhaustedKeys.add(currentKeyIndex);

  setTimeout(() => {
    exhaustedKeys.delete(currentKeyIndex);
  }, KEY_COOLDOWN_MS);

  currentKeyIndex = (currentKeyIndex + 1) % API_KEYS.length;

  if (exhaustedKeys.size >= API_KEYS.length) {
    console.error("[ClauseWall Whisper] All API keys exhausted!");
    return false;
  }

  return true;
}

// ============================================
// TRANSCRIPTION API
// ============================================

const WHISPER_ENDPOINT = "https://api.groq.com/openai/v1/audio/transcriptions";

/**
 * Transcribe audio via Groq Whisper API
 */
export async function transcribeAudio(
  audioBlob: Blob,
  language: string = "en"
): Promise<WhisperTranscriptionResponse> {
  const maxAttempts = API_KEYS.length * 2;
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      const apiKey = getApiKey();

      if (!apiKey) {
        throw new Error("No Groq API keys available for Whisper");
      }

      const formData = new FormData();
      // Determine filename based on blob type
      const ext = audioBlob.type.includes("mp4") ? "mp4" : "webm";
      formData.append("file", audioBlob, `audio.${ext}`);
      formData.append("model", "whisper-large-v3");
      formData.append("language", language);
      formData.append("response_format", "json");


      const response = await fetch(WHISPER_ENDPOINT, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
        body: formData,
      });

      // Handle rate limit
      if (response.status === 429) {
        const switched = switchToNextKey();
        if (!switched) {
          // All keys exhausted — wait

          await new Promise((resolve) => setTimeout(resolve, 30000));
          exhaustedKeys.clear();
        }
        continue;
      }

      // Handle bad audio
      if (response.status === 400) {
        const errorText = await response.text();
        console.warn("[ClauseWall Whisper] Bad audio format:", errorText.substring(0, 200));
        return { text: "", language, duration: 0 };
      }

      // Handle auth errors
      if (response.status === 401 || response.status === 403) {
        switchToNextKey();
        continue;
      }

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Whisper API error ${response.status}: ${errorText.substring(0, 200)}`);
      }

      const data = await response.json();

      return {
        text: data.text || "",
        language: data.language || language,
        duration: data.duration || 0,
      };
    } catch (error: any) {
      lastError = error;
      console.error(`[ClauseWall Whisper] Attempt ${attempt + 1} failed:`, error.message);

      // Network error — retry with backoff
      if (attempt < maxAttempts - 1) {
        const delay = Math.min(1000 * Math.pow(2, attempt), 10000);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  console.error("[ClauseWall Whisper] All attempts failed:", lastError?.message);
  return { text: "", language, duration: 0 };
}
