import { describe, it, expect } from "vitest";
import { convertUnits, fillTemplate, checkViolation } from "@/lib/core/rule-engine";
import type { ExtractedValues, StructuredRule } from "@/types";

describe("Rule Engine Pure Helpers", () => {
  describe("convertUnits", () => {
    it("converts days to months accurately", () => {
      expect(convertUnits(60, "days", "months")).toBe(2);
      expect(convertUnits(15, "days", "months")).toBe(0.5);
    });
    it("converts months to days accurately", () => {
      expect(convertUnits(2, "months", "days")).toBe(60);
    });
    it("handles rent months interchangeably", () => {
      expect(convertUnits(3, "months_of_rent", "months")).toBe(3);
      expect(convertUnits(1, "months", "months_of_rent")).toBe(1);
    });
    it("handles percent and annual percentage interchangeably", () => {
      expect(convertUnits(18, "percent", "percent_annual")).toBe(18);
    });
    it("returns null for incompatible units", () => {
      expect(convertUnits(5, "days", "percent")).toBeNull();
    });
  });

  describe("fillTemplate", () => {
    it("replaces exact values flawlessly", () => {
      const template = "Penalty of {{value}} INR is exorbitant, landlord limited to {{secondary_value}}.";
      const values = {
        clause_type: "penalty",
        primary_value: 5000,
        secondary_value: 1000,
        is_one_sided: true,
        has_forfeiture: false,
        has_penalty: true,
      } as unknown as ExtractedValues;
      
      expect(fillTemplate(template, values))
        .toBe("Penalty of 5000 INR is exorbitant, landlord limited to 1000.");
    });

    it("evaluates mathematical placeholders like value_minus_2", () => {
      const template = "Lock in is {{value}} years. You can terminate {{value_minus_2}} years earlier.";
      const values = {
        clause_type: "lock_in",
        primary_value: 5,
        is_one_sided: true,
        has_forfeiture: false,
        has_penalty: false,
      } as unknown as ExtractedValues;
      
      expect(fillTemplate(template, values))
        .toBe("Lock in is 5 years. You can terminate 3 years earlier.");
    });

    it("cleans up orphaned template variables", () => {
      const template = "Missing {{unknown_var}} gets wiped.";
      const values = {
        clause_type: "general",
        is_one_sided: false,
        has_forfeiture: false,
        has_penalty: false,
      } as unknown as ExtractedValues;
      expect(fillTemplate(template, values)).toBe("Missing [value] gets wiped.");
    });
  });

  describe("checkViolation", () => {
    const baseRule = {
      id: "1",
      clause_type: "lock_in",
      jurisdiction: "ALL-INDIA",
      document_type: "all",
      sub_type: "all",
      rule_type: "max_value",
      base_risk_score: 50,
      severity: "dangerous",
      violation_template: "",
      is_active: true
    } as unknown as StructuredRule;

    const baseValues = {
      clause_type: "lock_in",
      is_one_sided: false,
      has_forfeiture: false,
      has_penalty: false,
    } as unknown as ExtractedValues;

    it("detects max_value violation", () => {
      const rule = { ...baseRule, rule_type: "max_value", limit_value: 24, limit_unit: "months" } as unknown as StructuredRule;
      const values = { ...baseValues, primary_value: 36, primary_unit: "months" } as unknown as ExtractedValues;
      expect(checkViolation(values, rule)).toBe(true); // 36 > 24
    });

    it("permits under max_value limit", () => {
      const rule = { ...baseRule, rule_type: "max_value", limit_value: 24, limit_unit: "months" } as unknown as StructuredRule;
      const values = { ...baseValues, primary_value: 12, primary_unit: "months" } as unknown as ExtractedValues;
      expect(checkViolation(values, rule)).toBe(false); // 12 < 24
    });

    it("auto-converts units during check", () => {
      const rule = { ...baseRule, rule_type: "max_value", limit_value: 2, limit_unit: "months" } as unknown as StructuredRule;
      const values = { ...baseValues, primary_value: 90, primary_unit: "days" } as unknown as ExtractedValues;
      // 90 days = 3 months
      expect(checkViolation(values, rule)).toBe(true); // 3 > 2
    });

    it("flags prohibited clauses instantly", () => {
      const rule = { ...baseRule, rule_type: "prohibited" } as unknown as StructuredRule;
      expect(checkViolation(baseValues, rule)).toBe(true);
    });

    it("flags mutually required clauses if one-sided", () => {
      const rule = { ...baseRule, rule_type: "must_be_mutual" } as unknown as StructuredRule;
      const badValues = { ...baseValues, is_one_sided: true } as unknown as ExtractedValues;
      const goodValues = { ...baseValues, is_one_sided: false } as unknown as ExtractedValues;
      
      expect(checkViolation(badValues, rule)).toBe(true);
      expect(checkViolation(goodValues, rule)).toBe(false);
    });
  });
});
