// ============================================
// LAW CHANGE — STANDALONE DATABASE CLIENT
// Works both in Next.js context AND in scripts
// run via `npx tsx` (GitHub Actions).
// ============================================

import { createClient, SupabaseClient } from "@supabase/supabase-js";

let _client: SupabaseClient | null = null;

/**
 * Get a Supabase admin client that works in any environment.
 * Uses service role key — bypasses RLS.
 */
export function getLawChangeDB(): SupabaseClient {
  if (_client) return _client;

  const url =
    process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;

  if (!url || !key) {
    throw new Error(
      "Supabase credentials not configured. Need NEXT_PUBLIC_SUPABASE_URL (or SUPABASE_URL) and SUPABASE_SERVICE_ROLE_KEY (or SUPABASE_SERVICE_KEY)."
    );
  }

  _client = createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  return _client;
}
