// ============================================
// CENTRALIZED API HANDLER WRAPPER
// Composable middleware for Next.js route handlers.
// Enforces auth, rate limiting, body validation,
// and safe error handling in a single boundary.
// ============================================

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { rateLimit, rateLimitResponse, type RateLimitTier } from "@/lib/rate-limit";
import { safeErrorResponse } from "@/lib/api/error-response";
import { type ZodSchema } from "zod";
import { type SupabaseClient } from "@supabase/supabase-js";
import { type User } from "@supabase/supabase-js";

// ── Types ───────────────────────────────────

/** Context injected into every handler */
export interface ApiContext<T = unknown> {
  /** The original Next.js request */
  request: NextRequest;
  /** User-scoped Supabase client (always available) */
  supabase: SupabaseClient;
  /** Authenticated user (present only if auth is required) */
  user: User | null;
  /** Validated request body (present only if schema is provided) */
  body: T;
}

/** Configuration for the handler wrapper */
export interface ApiHandlerOptions<T = unknown> {
  /** Module name for structured logging / error responses */
  module: string;
  /** Rate limit tier — skipped if omitted */
  rateLimit?: RateLimitTier;
  /**
   * Rate limit identifier strategy.
   * - "ip" (default): key on client IP address
   * - "user": key on authenticated user ID (requires auth: true)
   */
  rateLimitIdentifier?: "ip" | "user";
  /** If true, require authenticated user (401 if missing) */
  auth?: boolean;
  /** Zod schema to validate request body — skipped if omitted */
  schema?: ZodSchema<T>;
}

/** The handler function that receives validated context */
type ApiHandler<T> = (ctx: ApiContext<T>) => Promise<NextResponse>;

// ── Factory ─────────────────────────────────

/**
 * Wrap a Next.js POST handler with centralized enforcement.
 *
 * Usage:
 * ```ts
 * export const POST = withApiHandler({
 *   module: "autopsy",
 *   rateLimit: "AI_HEAVY",
 *   auth: true,
 *   schema: AutopsySchema,
 * }, async (ctx) => {
 *   const { clauseText } = ctx.body;
 *   // ... business logic
 *   return NextResponse.json({ success: true });
 * });
 * ```
 */
export function withApiHandler<T = unknown>(
  options: ApiHandlerOptions<T>,
  handler: ApiHandler<T>,
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    try {
      const needsUserForRateLimit = options.rateLimitIdentifier === "user";

      // 1. Create user-scoped Supabase client
      const supabase = await createClient();

      // 2. Authentication (if required, or if needed for user-based rate limiting)
      let user: User | null = null;
      if (options.auth || needsUserForRateLimit) {
        const { data, error: authError } = await supabase.auth.getUser();
        if (authError || !data.user) {
          return NextResponse.json(
            { error: "Unauthorized" },
            { status: 401 },
          );
        }
        user = data.user;
      }

      // 3. Rate limiting (if configured)
      if (options.rateLimit) {
        const identifier = needsUserForRateLimit ? user!.id : undefined;
        const rl = await rateLimit(request, options.rateLimit, identifier);
        if (!rl.success) return rateLimitResponse(rl);
      }

      // 4. Body parsing + Zod validation (if schema provided)
      let body: T = undefined as T;
      if (options.schema) {
        let rawBody: unknown;
        try {
          rawBody = await request.json();
        } catch {
          return NextResponse.json(
            { error: "Invalid or missing JSON body" },
            { status: 400 },
          );
        }

        const result = options.schema.safeParse(rawBody);
        if (!result.success) {
          return NextResponse.json(
            {
              error: "Validation failed",
              details: result.error.issues.map((i) => ({
                field: i.path.join(".") || "(root)",
                message: i.message,
              })),
            },
            { status: 400 },
          );
        }
        body = result.data;
      }

      // 5. Execute handler with validated context
      return await handler({ request, supabase, user, body });
    } catch (error) {
      return safeErrorResponse(
        options.module,
        error,
        "An unexpected error occurred. Please try again.",
      );
    }
  };
}
