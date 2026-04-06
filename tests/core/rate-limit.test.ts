import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { rateLimit, rateLimitResponse, verifyInternalSecret, getClientIP } from "@/lib/rate-limit";
import { NextRequest, NextResponse } from "next/server";

// Mock NextResponse
vi.mock("next/server", async (importOriginal) => {
  const actual = await importOriginal<typeof import("next/server")>();
  return {
    ...actual,
    NextResponse: {
      json: vi.fn((body, init) => ({
        ...body,
        status: init?.status,
        headers: init?.headers,
      }))
    }
  };
});

describe("Rate Limiting Infrastructure", () => {
  const createMockRequest = (headers: Record<string, string> = {}) => {
    return {
      headers: new Headers(headers)
    } as unknown as NextRequest;
  };

  describe("getClientIP", () => {
    it("extracts IP from x-forwarded-for precisely", () => {
      const req = createMockRequest({ "x-forwarded-for": "192.168.1.1, 10.0.0.1" });
      expect(getClientIP(req)).toBe("192.168.1.1");
    });

    it("falls back to x-real-ip if forwarded is missing", () => {
      const req = createMockRequest({ "x-real-ip": "10.0.0.1" });
      expect(getClientIP(req)).toBe("10.0.0.1");
    });

    it("defaults to localhost if no headers exist", () => {
      const req = createMockRequest();
      expect(getClientIP(req)).toBe("127.0.0.1");
    });
  });

  describe("In-Memory Limiter Behavior", () => {
    beforeEach(() => {
      // Clear out UPSTASH env vars so it forcibly falls back to in-memory locally
      vi.stubEnv("UPSTASH_REDIS_REST_URL", "");
      vi.stubEnv("UPSTASH_REDIS_REST_TOKEN", "");
    });

    afterEach(() => {
      vi.unstubAllEnvs();
    });

    it("allows requests iteratively up to maximum", async () => {
      const req = createMockRequest(); // IP: 127.0.0.1
      const tier = "AI_HEAVY"; // max 3 rpm
      const uniqueId = "test-session-iterations";

      // 1st request
      let result = await rateLimit(req, tier, uniqueId);
      expect(result.success).toBe(true);
      expect(result.limit).toBe(3);
      expect(result.remaining).toBe(2);

      // 2nd request
      result = await rateLimit(req, tier, uniqueId);
      expect(result.success).toBe(true);
      expect(result.remaining).toBe(1);

      // 3rd request (max capacity)
      result = await rateLimit(req, tier, uniqueId);
      expect(result.success).toBe(true);
      expect(result.remaining).toBe(0);

      // 4th request (rejected!)
      result = await rateLimit(req, tier, uniqueId);
      expect(result.success).toBe(false);
      expect(result.remaining).toBe(0);
      expect(result.retryAfter).toBeGreaterThan(0);
    });

    it("isolates rate limits by identifier natively", async () => {
      const req = createMockRequest();
      
      // Exhaust user A (AI_MEDIUM is 5 rpm)
      await rateLimit(req, "AI_MEDIUM", "userA"); // 1
      await rateLimit(req, "AI_MEDIUM", "userA"); // 2
      await rateLimit(req, "AI_MEDIUM", "userA"); // 3
      await rateLimit(req, "AI_MEDIUM", "userA"); // 4
      await rateLimit(req, "AI_MEDIUM", "userA"); // 5
      const blockA = await rateLimit(req, "AI_MEDIUM", "userA"); // 6 => blocked
      expect(blockA.success).toBe(false);

      // User B should be perfectly unblocked using the exact same tier
      const allowB = await rateLimit(req, "AI_MEDIUM", "userB");
      expect(allowB.success).toBe(true);
    });
  });

  describe("rateLimitResponse", () => {
    it("generates structured 429 payload with exact headers", () => {
      const mockResult = {
        success: false,
        limit: 5,
        remaining: 0,
        reset: 99999999,
        retryAfter: 60
      };

      const response: any = rateLimitResponse(mockResult);
      expect(response.status).toBe(429);
      expect(response.error).toContain("Too many requests");
      expect(response.headers).toEqual({
        "X-RateLimit-Limit": "5",
        "X-RateLimit-Remaining": "0",
        "X-RateLimit-Reset": "99999999",
        "Retry-After": "60",
      });
    });
  });

  describe("verifyInternalSecret", () => {
    afterEach(() => {
      vi.unstubAllEnvs();
    });

    it("verifies securely provided secret headers", () => {
      vi.stubEnv("INTERNAL_API_SECRET", "supersecret");
      const req = createMockRequest({ "x-internal-secret": "supersecret" });
      expect(verifyInternalSecret(req)).toBe(true);
    });

    it("rejects malicious or mismatched secrets", () => {
      vi.stubEnv("INTERNAL_API_SECRET", "supersecret");
      const req = createMockRequest({ "x-internal-secret": "wrong" });
      expect(verifyInternalSecret(req)).toBe(false);
    });

    it("fails closed securely in production if secret is entirely unconfigured", () => {
      vi.stubEnv("INTERNAL_API_SECRET", "");
      vi.stubEnv("NODE_ENV", "production");
      const req = createMockRequest();
      expect(verifyInternalSecret(req)).toBe(false);
    });
  });
});
