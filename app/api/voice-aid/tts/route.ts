// ============================================
// VOICE-AID TTS API — ON-DEMAND TEXT-TO-SPEECH
// Accepts text → returns audio
// ============================================

import { NextRequest, NextResponse } from "next/server";
import { synthesizeSpeech, audioBufferToBase64 } from "@/lib/voice-aid/tts";
import type { SupportedLanguage } from "@/types";
import { rateLimit, rateLimitResponse } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  try {
    const rl = await rateLimit(request, "TTS");
    if (!rl.success) return rateLimitResponse(rl);

    const body = await request.json();
    const { text, language = "hi", gender = "female" } = body;

    if (!text || typeof text !== "string") {
      return NextResponse.json({ error: "text is required" }, { status: 400 });
    }

    // Limit text length to prevent abuse
    if (text.length > 5000) {
      return NextResponse.json(
        { error: "Text too long. Maximum 5000 characters." },
        { status: 400 },
      );
    }

    const result = await synthesizeSpeech(
      text,
      language as SupportedLanguage,
      gender,
    );

    const audioBase64 = result.audioBuffer
      ? audioBufferToBase64(result.audioBuffer)
      : null;

    return NextResponse.json({
      success: true,
      audio_base64: audioBase64,
      provider: result.provider,
      language: result.language,
      duration_ms: result.duration_ms,
    });
  } catch (error) {
    console.error("[ClauseWall] [API] TTS failed:", error);
    return NextResponse.json(
      { error: "Text-to-speech failed." },
      { status: 500 },
    );
  }
}
