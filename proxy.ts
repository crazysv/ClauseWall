// ============================================
// NEXT.JS MIDDLEWARE
// Runs on every request — handles auth refresh
// Enforces authenticated ownership model
// ============================================

import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

// ── Routes that REQUIRE authentication ──────
// Unauthenticated visitors are redirected to /auth/login
const protectedRoutes = [
  "/dashboard",
  "/upload",
  "/analyze",
  "/results",
  "/letter",
  "/negotiate",
  "/builder",
  "/vault",
  "/timebomb",
  "/evidence",
  "/shadow",
  "/battle",
  "/ruin-calculator",
  "/statemachine",
];

// ── Routes that are ALWAYS public ───────────
// These are never blocked, even without a session
const publicRoutes = [
  "/",
  "/auth/login",
  "/auth/signup",
  "/auth/callback",
  "/wall-of-shame",
  "/verify",      // Public certificate verification
  "/watchdog",    // Public watchdog pages
  "/market",      // Public market intelligence
  "/lawchange",   // Public law change tracker
  "/authority",   // Public complaint authority lookup
  "/collab",      // Public collaboration room links
];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Update Supabase auth session (always runs — refreshes tokens)
  const { supabaseResponse, user } = await updateSession(request);

  // Check if current route is protected
  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  );

  // E2E bypass for testing golden funnels without live network auth dependencies
  if (process.env.NODE_ENV !== "production" && request.cookies.get("e2e-bypass-auth")) {
    return supabaseResponse;
  }

  // Redirect unauthenticated users away from protected routes
  if (isProtectedRoute && !user) {
    const loginUrl = new URL("/auth/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files (images, etc.)
     * - api routes (handled by their own auth guards)
     */
    "/((?!_next/static|_next/image|favicon.ico|api/|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};