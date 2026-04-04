import { NextRequest, NextResponse } from "next/server";
import { generateAudio } from "@/lib/bhasha/tts-engine";
import { getCachedAudio, cacheAudio } from "@/lib/bhasha/audio-cache";
import type { SupportedLanguage } from "@/types/bhasha";
import { LANGUAGE_CONFIGS } from "@/lib/bhasha/constants";

export async function POST(request: NextRequest) {
  try {
    const { text, language, voice } = await request.json();

    if (!text || !language) {
      return NextResponse.json(
        { error: "text and language are required" },
        { status: 400 },
      );
    }

    if (!LANGUAGE_CONFIGS[language as SupportedLanguage]) {
      return NextResponse.json(
        { error: "Unsupported language" },
        { status: 400 },
      );
    }

    // Check cache first
    const cachedPath = await getCachedAudio(
      text,
      language as SupportedLanguage,
      voice,
    );
    if (cachedPath) {
      return NextResponse.json({
        audio_url: `/api/bhasha/tts/audio?path=${encodeURIComponent(cachedPath)}`,
        cached: true,
        service_used: "cache",
      });
    }

    // Generate TTS
    const result = await generateAudio(
      text,
      language as SupportedLanguage,
      voice,
    );

    if (result.audio_buffer) {
      // Cache the audio
      const storagePath = await cacheAudio(
        text,
        language as SupportedLanguage,
        result.audio_buffer,
        voice,
        result.duration_seconds,
      );

      // Return audio as base64
      return NextResponse.json({
        audio_base64: result.audio_buffer.toString("base64"),
        duration_seconds: result.duration_seconds,
        service_used: result.service_used,
        cached: false,
        storage_path: storagePath,
      });
    }

    // Fallback — client should use Web Speech API
    return NextResponse.json({
      audio_base64: null,
      duration_seconds: result.duration_seconds,
      service_used: "web_speech",
      use_web_speech: true,
    });
  } catch (error) {
    console.error("[ClauseWall] TTS API error:", error);
    return NextResponse.json(
      { error: "TTS generation failed" },
      { status: 500 },
    );
  }
}
