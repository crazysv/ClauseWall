import { describe, it, expect, vi } from "vitest";
import { z } from "zod";
import { validateBody, validateBodyWithCors, validateFileSize } from "@/lib/validation/middleware";
import { NextResponse } from "next/server";

// Mock NextResponse to return bare objects we can inspect
vi.mock("next/server", () => {
  return {
    NextResponse: {
      json: vi.fn((body, init) => ({
        ...body,
        status: init?.status,
        headers: init?.headers,
      }))
    }
  };
});

describe("Validation Middleware", () => {
  const TestSchema = z.object({
    name: z.string().min(2, "Name too short"),
    age: z.number().min(18, "Must be adult")
  });

  describe("validateBody", () => {
    it("returns success with typed data on valid payload", () => {
      const payload = { name: "Alice", age: 25 };
      const parsed = validateBody(payload, TestSchema);
      
      expect(parsed.success).toBe(true);
      if (parsed.success) {
        expect(parsed.data).toEqual(payload);
      }
    });

    it("returns failed ValidationResult and 400 response on invalid payload", () => {
      const payload = { name: "A", age: 10 };
      const parsed = validateBody(payload, TestSchema);
      
      expect(parsed.success).toBe(false);
      if (!parsed.success) {
        const response: any = parsed.response;
        expect(response.status).toBe(400);
        expect(response.error).toBe("Validation failed");
        expect(response.details).toEqual(
          expect.arrayContaining([
            expect.objectContaining({ field: "name", message: "Name too short" }),
            expect.objectContaining({ field: "age", message: "Must be adult" })
          ])
        );
      }
    });
  });

  describe("validateBodyWithCors", () => {
    it("injects custom cors headers into 400 rejection", () => {
      const payload = { age: 10 }; // invalid
      const headersInit = { "Access-Control-Allow-Origin": "*" };
      
      const parsed = validateBodyWithCors(payload, TestSchema, headersInit);
      expect(parsed.success).toBe(false);
      
      if (!parsed.success) {
        const response: any = parsed.response;
        expect(response.headers).toEqual(headersInit);
      }
    });
  });

  describe("validateFileSize", () => {
    it("returns null if strictly under size limit", () => {
      const mockFile = { size: 500 } as File;
      const result = validateFileSize(mockFile, 1000);
      expect(result).toBeNull();
    });

    it("returns 400 response if exactly over size limit", () => {
      const mockFile = { size: 1500 } as File;
      const result: any = validateFileSize(mockFile, 1000, "Mock Document");
      
      expect(result).not.toBeNull();
      expect(result.status).toBe(400);
      expect(result.details[0].message).toContain("Mock Document too large");
    });
  });
});
