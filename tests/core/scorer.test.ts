import { describe, it, expect } from "vitest";
import { calculateWeightedScore, generateSummary, getRiskCounts } from "@/lib/core/scorer";

describe("Risk Scoring Engine", () => {
  describe("calculateWeightedScore", () => {
    it("returns 0 for empty clauses", () => {
      expect(calculateWeightedScore([])).toBe(0);
    });

    it("calculates exact weights correctly", () => {
      const clauses: any[] = [
        { risk_level: "illegal", risk_score: 100 }, // weight 3 -> 300
        { risk_level: "dangerous", risk_score: 80 }, // weight 2 -> 160
        { risk_level: "warning", risk_score: 50 }, // weight 1.5 -> 75
        { risk_level: "safe", risk_score: 10 }, // weight 1 -> 10
      ];
      // Total score = 545, Total weight = 7.5. 545 / 7.5 = 72.666 -> Math.round -> 73
      expect(calculateWeightedScore(clauses)).toBe(73);
    });

    it("returns exact score if all clauses have same level", () => {
      const clauses: any[] = [
        { risk_level: "safe", risk_score: 20 },
        { risk_level: "safe", risk_score: 20 }
      ];
      expect(calculateWeightedScore(clauses)).toBe(20);
    });
  });

  describe("getRiskCounts", () => {
    it("returns zeros for empty clauses", () => {
      expect(getRiskCounts([])).toEqual({ safe: 0, warning: 0, dangerous: 0, illegal: 0 });
    });

    it("correctly buckets clauses into risk levels", () => {
      const clauses: any[] = [
        { risk_level: "illegal" },
        { risk_level: "dangerous" },
        { risk_level: "dangerous" },
        { risk_level: "safe" },
      ];
      expect(getRiskCounts(clauses)).toEqual({ safe: 1, warning: 0, dangerous: 2, illegal: 1 });
    });
  });

  describe("generateSummary", () => {
    it("reports safe document accurately", () => {
      const summary = generateSummary(5, 5, 0, 0, 0, 15);
      expect(summary).toContain("✅ All clauses appear fair");
      expect(summary).toContain("Analyzed 5 clauses");
    });

    it("reports highly toxic documents accurately", () => {
      const summary = generateSummary(10, 0, 0, 6, 4, 85);
      expect(summary).toContain("⛔ Found 4 potentially illegal clauses");
      expect(summary).toContain("🔴 Found 6 dangerous clauses");
      expect(summary).toContain("⚠️ This contract has serious legal issues. We strongly recommend NOT signing");
    });
  });
});
