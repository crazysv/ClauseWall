import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "@/app/api/bot/trigger-analysis/route";
import { NextRequest } from "next/server";

// ── Mock Dependencies ──
vi.mock("@/lib/rate-limit", async () => ({
  verifyInternalSecret: vi.fn(),
  rateLimit: vi.fn(() => ({ success: true })),
  rateLimitResponse: vi.fn(() => ({ status: 429, error: "Rate limit" })),
}));

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: vi.fn(() => ({
    from: vi.fn(() => ({
      update: vi.fn(() => ({ eq: vi.fn() })),
      select: vi.fn(() => ({ eq: vi.fn(() => ({ single: vi.fn(() => ({ data: { overall_risk_score: 50, total_clauses: 10 } })) })) })),
    })),
  })),
}));

vi.mock("@/lib/core/analyzer", () => ({
  analyzeDocument: vi.fn(),
}));

vi.mock("@/lib/bot/telegram-client", () => ({
  sendMessage: vi.fn(),
}));

// Mock NextResponse
vi.mock("next/server", async (importOriginal) => {
  const actual = await importOriginal<typeof import("next/server")>();
  return {
    ...actual,
    NextResponse: {
      json: vi.fn((body, init) => ({
        ...body,
        status: init?.status || 200, // Make sure default is 200 to mimic standard HTTP bounds in simple mocks
      }))
    }
  };
});

import { verifyInternalSecret } from "@/lib/rate-limit";
import { analyzeDocument } from "@/lib/core/analyzer";
import { sendMessage } from "@/lib/bot/telegram-client";

describe("POST /api/bot/trigger-analysis", () => {
  const createMockRequest = (body: any) => {
    return {
      json: async () => body,
      headers: new Headers(),
    } as unknown as NextRequest;
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("strictly rejects exactly if internal secret verification fails", async () => {
    vi.mocked(verifyInternalSecret).mockReturnValueOnce(false);
    
    const req = createMockRequest({});
    const result: any = await POST(req);
    
    expect(result.status).toBe(403);
    expect(result.error).toBe("Forbidden");
    expect(analyzeDocument).not.toHaveBeenCalled();
  });

  it("strictly rejects malformed payload schemas identically using 400 validations", async () => {
    vi.mocked(verifyInternalSecret).mockReturnValueOnce(true);
    
    // Malformed body missing text constraint
    const req = createMockRequest({
      documentId: "123e4567-e89b-12d3-a456-426614174000",
      text: "", // Too short! Schema requires min 1
    });
    
    const result: any = await POST(req);
    
    // Schema parser middleware returns 400 naturally
    expect(result.status).toBe(400); 
    expect(analyzeDocument).not.toHaveBeenCalled();
  });

  it("accepts totally valid requests, executes synchronously, and notifies chat successfully", async () => {
    vi.mocked(verifyInternalSecret).mockReturnValueOnce(true);
    
    const req = createMockRequest({
      documentId: "123e4567-e89b-12d3-a456-426614174000",
      text: "This is a valid mock document contract text completely long enough.",
      documentType: "rental",
      jurisdiction: "karnataka",
      chatId: 987654321
    });

    const result: any = await POST(req);
    
    expect(result.status).toEqual(200);
    expect(analyzeDocument).toHaveBeenCalled();
    expect(sendMessage).toHaveBeenCalled();
  });
});
