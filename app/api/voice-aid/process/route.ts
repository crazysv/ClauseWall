// ============================================
// VOICE-AID PROCESS API — MAIN ENDPOINT
// Accepts audio, photo, or text → returns response + audio
// ============================================

import { NextRequest, NextResponse } from "next/server";
import { processVoiceInput } from "@/lib/voice-aid";
import type { SupportedLanguage } from "@/types";
import { rateLimit, rateLimitResponse } from "@/lib/rate-limit";

export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    const rl = await rateLimit(request, "TTS");
    if (!rl.success) return rateLimitResponse(rl);

    const contentType = request.headers.get("content-type") || "";

    let language: SupportedLanguage = "hi";
    let sessionId: string | undefined;
    let text: string | undefined;
    let audioBuffer: Buffer | undefined;
    let audioFormat: string = "webm";
    let photoBuffer: Buffer | undefined;
    let photoMimeType: string = "image/jpeg";

    if (contentType.includes("multipart/form-data")) {
      // FormData — audio and/or photo upload
      const formData = await request.formData();

      language =
        (formData.get("language") as string as SupportedLanguage) || "hi";
      sessionId = (formData.get("session_id") as string) || undefined;
      text = (formData.get("text") as string) || undefined;
      audioFormat = (formData.get("audio_format") as string) || "webm";

      const audioFile = formData.get("audio") as File | null;
      if (audioFile) {
        const arrayBuffer = await audioFile.arrayBuffer();
        audioBuffer = Buffer.from(new Uint8Array(arrayBuffer));
      }

      const photoFile = formData.get("photo") as File | null;
      if (photoFile) {
        const arrayBuffer = await photoFile.arrayBuffer();
        photoBuffer = Buffer.from(new Uint8Array(arrayBuffer));
        photoMimeType = photoFile.type || "image/jpeg";
      }
    } else {
      // JSON body — text only
      const body = await request.json();
      language = body.language || "hi";
      sessionId = body.session_id;
      text = body.text;
    }

    if (!text && !audioBuffer && !photoBuffer) {
      return NextResponse.json(
        { error: "No input provided. Send audio, photo, or text." },
        { status: 400 },
      );
    }

    const result = await processVoiceInput({
      audio: audioBuffer,
      audioFormat,
      photo: photoBuffer,
      photoMimeType,
      text,
      language,
      sessionId,
      userId: null,
    });

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error("[ClauseWall] [API] Voice process failed:", error);
    return NextResponse.json(
      { error: "Voice processing failed. Please try again." },
      { status: 500 },
    );
  }
}
