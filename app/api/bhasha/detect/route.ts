import { NextRequest, NextResponse } from "next/server";
import { detectLanguage } from "@/lib/bhasha/language-detector";

export async function POST(request: NextRequest) {
  try {
    const { text } = await request.json();

    if (!text || typeof text !== "string") {
      return NextResponse.json({ error: "Text is required" }, { status: 400 });
    }

    const result = await detectLanguage(text);

    return NextResponse.json(result);
  } catch (error) {
    console.error("[ClauseWall] Language detection API error:", error);
    return NextResponse.json(
      { error: "Language detection failed" },
      { status: 500 }
    );
  }
}
