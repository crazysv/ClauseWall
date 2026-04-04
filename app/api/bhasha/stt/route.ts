import { NextRequest, NextResponse } from "next/server";
import { transcribeAudio } from "@/lib/bhasha/stt-engine";
import type { SupportedLanguage } from "@/types/bhasha";
import { LANGUAGE_CONFIGS } from "@/lib/bhasha/constants";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const audioFile = formData.get("audio") as File | null;
    const language = (formData.get("language") as string) || "hi";

    if (!audioFile) {
      return NextResponse.json(
        { error: "audio file is required" },
        { status: 400 },
      );
    }

    if (!LANGUAGE_CONFIGS[language as SupportedLanguage]) {
      return NextResponse.json(
        { error: "Unsupported language" },
        { status: 400 },
      );
    }

    const audioBuffer = Buffer.from(await audioFile.arrayBuffer());
    const result = await transcribeAudio(
      audioBuffer,
      language as SupportedLanguage,
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error("[ClauseWall] STT API error:", error);
    return NextResponse.json(
      { error: "Speech-to-text failed" },
      { status: 500 },
    );
  }
}
