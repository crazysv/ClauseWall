import { NextRequest, NextResponse } from "next/server";
import { translateText } from "@/lib/bhasha/translator";
import type { SupportedLanguage } from "@/types/bhasha";
import { LANGUAGE_CONFIGS } from "@/lib/bhasha/constants";

export async function POST(request: NextRequest) {
  try {
    const { text, source_language, target_language } = await request.json();

    if (!text || !source_language || !target_language) {
      return NextResponse.json(
        { error: "text, source_language, and target_language are required" },
        { status: 400 },
      );
    }

    // Validate languages
    if (
      !LANGUAGE_CONFIGS[source_language as SupportedLanguage] ||
      !LANGUAGE_CONFIGS[target_language as SupportedLanguage]
    ) {
      return NextResponse.json(
        { error: "Unsupported language code" },
        { status: 400 },
      );
    }

    const result = await translateText(
      text,
      source_language as SupportedLanguage,
      target_language as SupportedLanguage,
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error("[ClauseWall] Translation API error:", error);
    return NextResponse.json({ error: "Translation failed" }, { status: 500 });
  }
}
