// ============================================
// NEXT.JS MIDDLEWARE
// Runs on every request — handles auth refresh
// ============================================

import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

// Routes that require authentication
const protectedRoutes = [
  "/dashboard",
  "/upload",
  "/results",
  "/letter",
  "/analyze",
];

// Routes that are always public
const publicRoutes = [
  "/",
  "/auth/login",
  "/auth/signup",
  "/auth/callback",
  "/wall-of-shame",
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Update Supabase auth session
  const { supabaseResponse, user } = await updateSession(request);

  // Check if current route is protected
  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  );

  // For now, allow all routes (we'll enable auth protection later)
  // Uncomment below to enforce auth:
  /*
  if (isProtectedRoute && !user) {
    const loginUrl = new URL("/auth/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }
  */

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
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};