// ============================================
// CLAUSEWALL — AUDIO CACHE
// Cache TTS audio to avoid re-generating
// ============================================

import type { SupportedLanguage, TTSCacheEntry } from "@/types/bhasha";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

// ============================================
// HASH TEXT FOR CACHE KEY
// ============================================

async function hashText(text: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
}

// ============================================
// CACHE OPERATIONS
// ============================================

/**
 * Check if audio is cached for this text + language.
 */
export async function getCachedAudio(
  text: string,
  language: SupportedLanguage,
  voice?: string
): Promise<string | null> {
  try {
    const textHash = await hashText(text);
    const supabase = await createClient();

    const query = supabase
      .from("tts_cache")
      .select("audio_storage_path, expires_at")
      .eq("text_hash", textHash)
      .eq("language", language);

    if (voice) {
      query.eq("voice", voice);
    }

    const { data, error } = await query.maybeSingle();

    if (error || !data) return null;

    // Check if expired
    if (data.expires_at && new Date(data.expires_at) < new Date()) {
      return null;
    }

    return data.audio_storage_path;
  } catch (error) {
    console.warn("[ClauseWall] Audio cache lookup failed:", error);
    return null;
  }
}

/**
 * Store generated audio in cache.
 */
export async function cacheAudio(
  text: string,
  language: SupportedLanguage,
  audioBuffer: Buffer,
  voice?: string,
  duration?: number
): Promise<string | null> {
  try {
    const textHash = await hashText(text);
    const supabase = createAdminClient();

    // Upload to Supabase Storage
    const storagePath = `tts-cache/${language}/${textHash}.wav`;

    const { error: uploadError } = await supabase.storage
      .from("audio")
      .upload(storagePath, audioBuffer, {
        contentType: "audio/wav",
        upsert: true,
      });

    if (uploadError) {
      console.warn("[ClauseWall] Audio upload failed:", uploadError);
      return null;
    }

    // Insert cache record
    const { error: insertError } = await supabase
      .from("tts_cache")
      .upsert({
        text_hash: textHash,
        language,
        voice: voice || null,
        audio_storage_path: storagePath,
        audio_duration_seconds: duration || null,
        audio_size_bytes: audioBuffer.length,
      }, {
        onConflict: "text_hash,language,voice",
      });

    if (insertError) {
      console.warn("[ClauseWall] Audio cache insert failed:", insertError);
    }

    return storagePath;
  } catch (error) {
    console.warn("[ClauseWall] Audio caching failed:", error);
    return null;
  }
}

/**
 * Get a signed URL for cached audio (safe access pattern).
 */
export async function getAudioSignedUrl(
  storagePath: string,
  expiresIn: number = 3600
): Promise<string | null> {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase.storage
      .from("audio")
      .createSignedUrl(storagePath, expiresIn);

    if (error || !data?.signedUrl) {
      console.warn("[ClauseWall] Audio signed URL error:", error);
      return null;
    }

    return data.signedUrl;
  } catch (error) {
    console.warn("[ClauseWall] Audio caching failed:", error);
    return null;
  }
}

/**
 * Clean expired cache entries.
 */
export async function cleanExpiredCache(): Promise<number> {
  try {
    const supabase = createAdminClient();

    // Get expired entries
    const { data: expired, error: fetchError } = await supabase
      .from("tts_cache")
      .select("id, audio_storage_path")
      .lt("expires_at", new Date().toISOString());

    if (fetchError || !expired || expired.length === 0) return 0;

    // Delete storage files
    const paths = expired.map(e => e.audio_storage_path);
    await supabase.storage.from("audio").remove(paths);

    // Delete DB records
    const ids = expired.map(e => e.id);
    await supabase.from("tts_cache").delete().in("id", ids);

    console.log(`[ClauseWall] Cleaned ${expired.length} expired audio cache entries`);
    return expired.length;
  } catch (error) {
    console.warn("[ClauseWall] Cache cleanup failed:", error);
    return 0;
  }
}
