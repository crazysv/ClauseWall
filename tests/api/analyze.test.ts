import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "@/app/api/analyze/route";
import { NextRequest } from "next/server";

// ── Mock Dependencies ──
vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

vi.mock("@/lib/rate-limit", () => ({
  rateLimit: vi.fn(),
  rateLimitResponse: vi.fn(() => ({ status: 429, error: "Too many requests" })),
}));

// Mock NextResponse
vi.mock("next/server", async (importOriginal) => {
  const actual = await importOriginal<typeof import("next/server")>();
  return {
    ...actual,
    NextResponse: {
      json: vi.fn((body, init) => ({
        ...body,
        status: init?.status || 200,
      }))
    }
  };
});

import { createClient } from "@/lib/supabase/server";
import { rateLimit } from "@/lib/rate-limit";

describe("POST /api/analyze", () => {
  const createMockJsonRequest = (body: any) => {
    return {
      headers: new Headers({ "content-type": "application/json" }),
      json: async () => body,
    } as unknown as NextRequest;
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 Unauthorized if user is not authenticated natively", async () => {
    // Mock Supabase returning no user
    vi.mocked(createClient).mockResolvedValueOnce({
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: null } }),
      },
    } as any);

    const req = createMockJsonRequest({});
    const result: any = await POST(req);

    expect(result.status).toBe(401);
    expect(result.error).toContain("Authentication required");
  });

  it("returns 429 Rate Limit if Upstash strictly flags abuse", async () => {
    // Mock valid user
    vi.mocked(createClient).mockResolvedValueOnce({
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: { id: "user_block" } } }),
      },
    } as any);

    // Mock rate limiting failing natively
    vi.mocked(rateLimit).mockResolvedValueOnce({ success: false } as any);

    const req = createMockJsonRequest({});
    const result: any = await POST(req);

    expect(result.status).toBe(429);
    expect(rateLimit).toHaveBeenCalledWith(req, "AI_HEAVY", "user_block");
  });

  it("returns 400 Bad Request naturally if schema validations fail", async () => {
    vi.mocked(createClient).mockResolvedValueOnce({
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: { id: "user123" } } }),
      },
    } as any);
    vi.mocked(rateLimit).mockResolvedValueOnce({ success: true } as any);

    // Malformed JSON!
    const req = createMockJsonRequest({
      text: "short", // < 50 length fails Zod
      documentType: "rental",
      jurisdiction: "karnataka"
    });

    const result: any = await POST(req);
    expect(result.status).toBe(400); // Triggered safely inside Next middleware
  });

  it("successfully passes validation, inserts stub document, and cascades cleanly", async () => {
    // Mock valid user
    const mockDbInsert = vi.fn().mockReturnValue({ select: vi.fn().mockReturnValue({ single: vi.fn().mockResolvedValue({ data: { id: "doc-123" } }) }) });
    vi.mocked(createClient).mockResolvedValueOnce({
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: { id: "user123" } } }),
      },
      from: vi.fn().mockReturnValue({ insert: mockDbInsert }),
    } as any);

    vi.mocked(rateLimit).mockResolvedValueOnce({ success: true } as any);

    // Global fetch interception for fire-and-forget sub-call safely bypassing networks
    global.fetch = vi.fn().mockResolvedValue({ ok: true });

    const req = createMockJsonRequest({
      text: "This is a valid mock document contract text completely long enough and very legally binding.",
      documentType: "rental",
      jurisdiction: "pan_india",
      filename: "test.txt",
    });

    const result: any = await POST(req);

    expect(result.status).toBe(200); // Actually "analyzing" natively via Next
    expect(result.documentId).toBe("doc-123");
    expect(mockDbInsert).toHaveBeenCalled();
  });
});
