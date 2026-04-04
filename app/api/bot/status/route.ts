import { NextResponse } from "next/server";
import { getApiStatus } from "@/lib/ai/groq-client";
import { getGeminiStatus } from "@/lib/bot/gemini-client";

export async function GET() {
  return NextResponse.json({
    groq: getApiStatus(),
    gemini: getGeminiStatus(),
  });
}
