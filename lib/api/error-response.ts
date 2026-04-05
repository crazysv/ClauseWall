// ============================================
// SAFE ERROR RESPONSE HELPER
// Never leaks internal error details to clients
// ============================================

import { NextResponse } from "next/server";
import { log } from "@/lib/logger";

/**
 * Create a safe JSON error response.
 * - Logs the real error internally (structured)
 * - Returns a generic user-facing message to the client
 * - NEVER exposes error.message, stack traces, or internal details
 */
export function safeErrorResponse(
  module: string,
  error: unknown,
  userMessage = "An unexpected error occurred. Please try again.",
  status = 500,
  headers?: Record<string, string>,
): NextResponse {
  log.errorWithCause(module, userMessage, error);

  return NextResponse.json(
    { error: userMessage },
    { status, headers },
  );
}

/**
 * Extract a safe error message from an unknown error.
 * Returns the provided fallback message instead of the actual error.
 * Use this when you need a string but don't want to leak internals.
 */
export function safeErrorMessage(
  _error: unknown,
  fallback = "An unexpected error occurred",
): string {
  return fallback;
}
