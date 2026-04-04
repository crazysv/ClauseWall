// ============================================
// VOICE-AID LANGUAGES API — PUBLIC ENDPOINT
// Returns all supported languages with metadata
// ============================================

import { NextResponse } from "next/server";
import { getAllLanguages } from "@/lib/voice-aid/languages";

export async function GET() {
  const languages = getAllLanguages().map((lang) => ({
    code: lang.code,
    name: lang.name,
    nativeName: lang.nativeName,
    flag: lang.flag,
    tier: lang.tier,
    sttSupported: lang.sttSupported,
    ttsSupported: lang.ttsSupported,
    greeting: lang.greeting,
  }));

  return NextResponse.json({
    success: true,
    languages,
    total: languages.length,
  });
}
