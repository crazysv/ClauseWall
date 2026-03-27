import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { UserLanguagePreferences, SupportedLanguage } from "@/types/bhasha";
import { LANGUAGE_CONFIGS } from "@/lib/bhasha/constants";

/**
 * GET: Get current user's language preferences.
 */
export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data, error } = await supabase
      .from("user_language_preferences")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    if (error) {
      console.error("[ClauseWall] Get preferences error:", error);
      return NextResponse.json({ error: "Failed to get preferences" }, { status: 500 });
    }

    // Return defaults if no preferences exist
    if (!data) {
      return NextResponse.json({
        user_id: user.id,
        preferred_input_language: "auto",
        preferred_output_language: "en",
        preferred_tts_voice: null,
        enable_audio_by_default: false,
        enable_bilingual_by_default: false,
      } satisfies Partial<UserLanguagePreferences>);
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("[ClauseWall] Preferences GET error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

/**
 * POST: Save/update user language preferences.
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    // Validate languages
    if (body.preferred_input_language && body.preferred_input_language !== "auto") {
      if (!LANGUAGE_CONFIGS[body.preferred_input_language as SupportedLanguage]) {
        return NextResponse.json({ error: "Invalid input language" }, { status: 400 });
      }
    }
    if (body.preferred_output_language) {
      if (!LANGUAGE_CONFIGS[body.preferred_output_language as SupportedLanguage]) {
        return NextResponse.json({ error: "Invalid output language" }, { status: 400 });
      }
    }

    const { data, error } = await supabase
      .from("user_language_preferences")
      .upsert({
        user_id: user.id,
        preferred_input_language: body.preferred_input_language || "auto",
        preferred_output_language: body.preferred_output_language || "en",
        preferred_tts_voice: body.preferred_tts_voice || null,
        enable_audio_by_default: Boolean(body.enable_audio_by_default),
        enable_bilingual_by_default: Boolean(body.enable_bilingual_by_default),
        updated_at: new Date().toISOString(),
      }, {
        onConflict: "user_id",
      })
      .select()
      .single();

    if (error) {
      console.error("[ClauseWall] Save preferences error:", error);
      return NextResponse.json({ error: "Failed to save preferences" }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("[ClauseWall] Preferences POST error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
