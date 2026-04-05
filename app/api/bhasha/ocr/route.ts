import { NextRequest, NextResponse } from "next/server";
import {
  postProcessOCR,
  getMultilingualOCRPrompt,
} from "@/lib/bhasha/ocr-enhancer";
import type { SupportedLanguage } from "@/types/bhasha";
import { sanitizePlainTextBlock } from "@/lib/sanitize";

export async function POST(request: NextRequest) {
  try {
    const { extracted_text, language_hint, is_handwritten } =
      await request.json();

    if (!extracted_text) {
      return NextResponse.json(
        { error: "extracted_text is required" },
        { status: 400 },
      );
    }

    // Post-process OCR result with language-aware analysis
    const result = postProcessOCR(
      sanitizePlainTextBlock(extracted_text, 50_000),
      language_hint as SupportedLanguage | undefined,
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error("[ClauseWall] OCR enhancement API error:", error);
    return NextResponse.json(
      { error: "OCR enhancement failed" },
      { status: 500 },
    );
  }
}

/**
 * GET: Return OCR prompt for a given language + handwriting setting.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const language = searchParams.get("language") as SupportedLanguage | null;
  const handwritten = searchParams.get("handwritten") === "true";

  const prompt = getMultilingualOCRPrompt(language || undefined, handwritten);

  return NextResponse.json({ prompt });
}
