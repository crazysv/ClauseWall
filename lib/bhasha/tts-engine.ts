// ============================================
// CLAUSEWALL — TTS ENGINE
// Text-to-Speech: Bhashini → Web Speech fallback
// ============================================

import type { SupportedLanguage, TTSResult } from "@/types/bhasha";
import { getBhashiniClient } from "./bhashini-client";
import { TTS_MAX_TEXT_LENGTH, TTS_CHUNK_SIZE, LANGUAGE_CONFIGS } from "./constants";

// ============================================
// SERVER-SIDE TTS (Bhashini)
// ============================================

/**
 * Generate audio from text using Bhashini TTS.
 * Returns audio buffer for storage/streaming.
 */
export async function generateAudio(
  text: string,
  language: SupportedLanguage,
  voice?: string
): Promise<TTSResult> {
  // Preprocess text for TTS
  const cleaned = preprocessForTTS(text);

  if (cleaned.length > TTS_MAX_TEXT_LENGTH) {
    // For very long text, only generate first chunk
    const truncated = cleaned.substring(0, TTS_MAX_TEXT_LENGTH);
    return generateAudioChunk(truncated, language, voice);
  }

  return generateAudioChunk(cleaned, language, voice);
}

async function generateAudioChunk(
  text: string,
  language: SupportedLanguage,
  voice?: string
): Promise<TTSResult> {
  try {
    const client = getBhashiniClient();
    const audioBuffer = await client.textToSpeech(text, language, voice);

    if (audioBuffer) {
      return {
        audio_url: null,
        audio_buffer: audioBuffer,
        duration_seconds: estimateDuration(text, language),
        service_used: "bhashini",
      };
    }
  } catch (error) {
    console.warn("[ClauseWall] Bhashini TTS failed:", error);
  }

  // Fallback — return null buffer (client will use Web Speech API)
  return {
    audio_url: null,
    audio_buffer: null,
    duration_seconds: estimateDuration(text, language),
    service_used: "web_speech",
  };
}

// ============================================
// TEXT PREPROCESSING FOR TTS
// ============================================

function preprocessForTTS(text: string): string {
  let cleaned = text;

  // Remove markdown formatting
  cleaned = cleaned.replace(/[*_~`#]/g, "");
  cleaned = cleaned.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1");

  // Expand common abbreviations
  cleaned = cleaned.replace(/\bSec\.\s*/gi, "Section ");
  cleaned = cleaned.replace(/\bArt\.\s*/gi, "Article ");
  cleaned = cleaned.replace(/\bAct\.\s*/gi, "Act ");
  cleaned = cleaned.replace(/\bNo\.\s*/gi, "Number ");

  // Clean up currency for speech
  cleaned = cleaned.replace(/₹\s*([\d,]+)/g, "$1 rupees");

  // Remove excessive whitespace
  cleaned = cleaned.replace(/\s+/g, " ").trim();

  return cleaned;
}

// ============================================
// DURATION ESTIMATION
// ============================================

function estimateDuration(text: string, language: SupportedLanguage): number {
  // Average speaking rate: ~2.5 words/sec for Indian languages, ~3 for English
  const words = text.split(/\s+/).length;
  const rate = language === "en" ? 3 : 2.5;
  return Math.ceil(words / rate);
}

// ============================================
// CLIENT-SIDE WEB SPEECH API HELPER
// (exported for use in components)
// ============================================

/**
 * Configuration for Web Speech API synthesis.
 * Used by client-side components.
 */
export function getWebSpeechConfig(language: SupportedLanguage): {
  lang: string;
  rate: number;
  pitch: number;
} {
  const config = LANGUAGE_CONFIGS[language];
  return {
    lang: config.webSpeechCode,
    rate: 0.9, // Slightly slower for clarity
    pitch: 1.0,
  };
}

/**
 * Split text into sentences for sequential TTS playback.
 */
export function splitForTTS(text: string): string[] {
  // Split on sentence boundaries (period, question mark, exclamation, danda)
  const sentences = text.split(/(?<=[।.!?])\s+/);

  // Merge very short sentences with the next one
  const merged: string[] = [];
  let current = "";

  for (const sentence of sentences) {
    if ((current + " " + sentence).length < TTS_CHUNK_SIZE) {
      current = current ? current + " " + sentence : sentence;
    } else {
      if (current) merged.push(current);
      current = sentence;
    }
  }
  if (current) merged.push(current);

  return merged;
}
