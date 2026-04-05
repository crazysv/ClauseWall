// ============================================
// RATE LIMITING — Central Infrastructure
// Upstash Redis in production, in-memory for dev
// ============================================

import { NextRequest, NextResponse } from "next/server";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// ── Tier Definitions ────────────────────────

export const RATE_LIMIT_TIERS = {
  /** Full document analysis, letter generation, triple-AI calls */
  AI_HEAVY: {
    rpm: 3,
    rph: 15,
    label: "AI Heavy",
  },
  /** Quick scans, clause rewrites, explanations */
  AI_MEDIUM: {
    rpm: 5,
    rph: 30,
    label: "AI Medium",
  },
  /** TTS, translation — external API cost */
  TTS: {
    rpm: 10,
    rph: 60,
    label: "TTS/Translation",
  },
  /** Database write operations */
  DB_WRITE: {
    rpm: 5,
    rph: 20,
    label: "DB Write",
  },
  /** Public read-only endpoints */
  PUBLIC: {
    rpm: 30,
    rph: 300,
    label: "Public",
  },
  /** Telegram bot (per chatId) */
  TELEGRAM: {
    rpm: 20,
    rph: 200,
    label: "Telegram Bot",
  },
} as const;

export type RateLimitTier = keyof typeof RATE_LIMIT_TIERS;

// ── Result Type ─────────────────────────────

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number; // Unix timestamp (seconds)
  retryAfter: number; // Seconds until next request allowed
}

// ── In-Memory Fallback Store (local dev) ────

const memoryStore = new Map<string, { count: number; resetAt: number }>();

function memoryRateLimit(
  identifier: string,
  maxRequests: number,
  windowMs: number,
): RateLimitResult {
  const now = Date.now();
  const key = identifier;
  const existing = memoryStore.get(key);

  if (!existing || now > existing.resetAt) {
    // New window
    memoryStore.set(key, { count: 1, resetAt: now + windowMs });
    return {
      success: true,
      limit: maxRequests,
      remaining: maxRequests - 1,
      reset: Math.ceil((now + windowMs) / 1000),
      retryAfter: 0,
    };
  }

  if (existing.count < maxRequests) {
    existing.count++;
    return {
      success: true,
      limit: maxRequests,
      remaining: maxRequests - existing.count,
      reset: Math.ceil(existing.resetAt / 1000),
      retryAfter: 0,
    };
  }

  // Rate limited
  const retryAfter = Math.ceil((existing.resetAt - now) / 1000);
  return {
    success: false,
    limit: maxRequests,
    remaining: 0,
    reset: Math.ceil(existing.resetAt / 1000),
    retryAfter: Math.max(1, retryAfter),
  };
}

// Periodic cleanup of stale entries (every 5 min)
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [key, value] of memoryStore) {
      if (now > value.resetAt) {
        memoryStore.delete(key);
      }
    }
  }, 5 * 60 * 1000);
}

// ── Upstash Limiter Factory ─────────────────

let _upstashRedis: Redis | null = null;
const _upstashLimiters = new Map<string, Ratelimit>();

function getUpstashRedis(): Redis | null {
  if (_upstashRedis) return _upstashRedis;

  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) return null;

  _upstashRedis = new Redis({ url, token });
  return _upstashRedis;
}

function getUpstashLimiter(
  tierKey: string,
  maxRequests: number,
  windowSeconds: number,
): Ratelimit | null {
  const redis = getUpstashRedis();
  if (!redis) return null;

  const cacheKey = `${tierKey}:${maxRequests}:${windowSeconds}`;
  let limiter = _upstashLimiters.get(cacheKey);

  if (!limiter) {
    limiter = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(maxRequests, `${windowSeconds} s`),
      analytics: true,
      prefix: `clausewall:rl:${tierKey}`,
    });
    _upstashLimiters.set(cacheKey, limiter);
  }

  return limiter;
}

// ── IP Extraction ───────────────────────────

export function getClientIP(request: NextRequest): string {
  // Vercel/Cloudflare set these headers
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    // Take the first IP (original client)
    return forwarded.split(",")[0].trim();
  }

  const realIP = request.headers.get("x-real-ip");
  if (realIP) return realIP.trim();

  // Fallback for local dev
  return "127.0.0.1";
}

// ── Main Rate Limit Function ────────────────

/**
 * Check rate limit for a request.
 *
 * @param request - The incoming request (used for IP extraction)
 * @param tier - The rate limit tier to apply
 * @param identifier - Optional custom identifier (defaults to IP)
 * @returns RateLimitResult with success/failure and metadata
 *
 * @example
 * ```ts
 * const rl = await rateLimit(req, "AI_HEAVY");
 * if (!rl.success) return rateLimitResponse(rl);
 * ```
 */
export async function rateLimit(
  request: NextRequest,
  tier: RateLimitTier,
  identifier?: string,
): Promise<RateLimitResult> {
  const tierConfig = RATE_LIMIT_TIERS[tier];
  const id = identifier || getClientIP(request);
  const routeKey = `${tier}:${id}`;

  // Try Upstash first (production)
  const upstashLimiter = getUpstashLimiter(tier, tierConfig.rpm, 60);
  if (upstashLimiter) {
    try {
      const result = await upstashLimiter.limit(routeKey);
      return {
        success: result.success,
        limit: result.limit,
        remaining: result.remaining,
        reset: Math.ceil(result.reset / 1000),
        retryAfter: result.success
          ? 0
          : Math.max(1, Math.ceil((result.reset - Date.now()) / 1000)),
      };
    } catch (error) {
      // If Upstash fails, fall through to memory limiter
      // Never block users because the rate limiter itself is down
      console.error("[RateLimit] Upstash error, falling back to memory:", error);
    }
  }

  // In-memory fallback (local dev or Upstash failure)
  return memoryRateLimit(routeKey, tierConfig.rpm, 60 * 1000);
}

// ── Standard 429 Response ───────────────────

/**
 * Returns a standard 429 Too Many Requests response with proper headers.
 */
export function rateLimitResponse(result: RateLimitResult): NextResponse {
  return NextResponse.json(
    {
      error: "Too many requests. Please try again later.",
      retryAfter: result.retryAfter,
    },
    {
      status: 429,
      headers: {
        "X-RateLimit-Limit": String(result.limit),
        "X-RateLimit-Remaining": String(result.remaining),
        "X-RateLimit-Reset": String(result.reset),
        "Retry-After": String(result.retryAfter),
      },
    },
  );
}

// ── Internal API Secret Verification ────────

/**
 * Verify the internal API secret for server-to-server calls.
 *
 * - Production/Preview: REJECTS all requests if INTERNAL_API_SECRET is not set (fail closed).
 * - Development: Allows requests through without a secret for local dev convenience.
 */
export function verifyInternalSecret(request: NextRequest): boolean {
  const secret = process.env.INTERNAL_API_SECRET;

  if (!secret) {
    // Fail closed in production — never allow requests if the secret is missing
    if (process.env.NODE_ENV === "production") {
      console.error(
        "[RateLimit] CRITICAL: INTERNAL_API_SECRET is not configured. Rejecting request.",
      );
      return false;
    }

    // Dev-only passthrough — allow without secret for local development
    return true;
  }

  const provided = request.headers.get("x-internal-secret");
  return provided === secret;
}
