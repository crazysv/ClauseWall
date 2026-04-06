import { describe, it, expect } from "vitest";
import { 
  AnalyzeJsonSchema, 
  GenerateLetterSchema, 
  ExplainSchema,
  ComplaintGenerateSchema
} from "@/lib/validation/schemas";

describe("Validation Schemas", () => {
  describe("AnalyzeJsonSchema", () => {
    it("accepts valid analysis payload", () => {
      const payload = {
        text: "a".repeat(100), // > 50 chars
        documentType: "rental",
        jurisdiction: "pan_india"
      };
      const result = AnalyzeJsonSchema.safeParse(payload);
      expect(result.success).toBe(true);
    });

    it("rejects text that is too short", () => {
      const payload = {
        text: "Too short", // < 50 chars
        documentType: "rental",
        jurisdiction: "pan_india"
      };
      const result = AnalyzeJsonSchema.safeParse(payload);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("too short");
      }
    });

    it("requires documentType and jurisdiction", () => {
      const payload = { text: "a".repeat(100) };
      const result = AnalyzeJsonSchema.safeParse(payload);
      expect(result.success).toBe(false);
    });
  });

  describe("GenerateLetterSchema", () => {
    it("validates valid payload array of clauses", () => {
      const payload = {
        clauses: [
          {
            clause_number: 1,
            clause_type: "termination",
            risk_level: "dangerous",
            original_text: "You can be fired immediately.",
            explanation: "One sided."
          }
        ]
      };
      const result = GenerateLetterSchema.safeParse(payload);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.documentType).toBe("other"); // default
      }
    });

    it("rejects empty clauses array", () => {
      const result = GenerateLetterSchema.safeParse({ clauses: [] });
      expect(result.success).toBe(false);
    });
  });

  describe("ExplainSchema", () => {
    it("accepts payload with clauseText", () => {
      const result = ExplainSchema.safeParse({ clauseText: "The company holds all rights." });
      expect(result.success).toBe(true);
    });
    
    it("accepts payload with explanation", () => {
      const result = ExplainSchema.safeParse({ explanation: "This means they own everything." });
      expect(result.success).toBe(true);
    });

    it("rejects if BOTH clauseText and explanation are missing", () => {
      const result = ExplainSchema.safeParse({ riskLevel: "warning" });
      expect(result.success).toBe(false);
    });
  });

  describe("ComplaintGenerateSchema", () => {
    it("requires valid authorityType enum", () => {
      const result = ComplaintGenerateSchema.safeParse({
        documentId: "123e4567-e89b-12d3-a456-426614174000",
        authorityType: "invalid_court"
      });
      expect(result.success).toBe(false);
    });

    it("accepts valid authority type and optional fields", () => {
      const result = ComplaintGenerateSchema.safeParse({
        documentId: "123e4567-e89b-12d3-a456-426614174000",
        authorityType: "consumer_forum_district",
        claimAmount: 50000
      });
      expect(result.success).toBe(true);
    });
  });
});
