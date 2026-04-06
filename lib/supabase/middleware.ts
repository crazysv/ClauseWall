// ============================================
// SUPABASE MIDDLEWARE HELPER
// Handles auth token refresh on each request
// ============================================

import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  // Generate tracking ID and inject into downstream headers
  const reqId = crypto.randomUUID();
  request.headers.set("x-request-id", reqId);

  let supabaseResponse = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // IMPORTANT: Do NOT run any Supabase logic between createServerClient 
  // and auth.getUser(). Any operations in between could cause issues.
  
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return { supabaseResponse, user };
}