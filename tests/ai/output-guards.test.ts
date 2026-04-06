import { describe, it, expect } from "vitest";
import {
  safeString,
  safeNumber,
  safeBoolean,
  safeEnum,
  safeArray,
  safeStringArray,
  safeParseJson,
  field
} from "@/lib/ai/output-guards";

describe("AI Output Guards", () => {
  describe("safeString", () => {
    it("trims strings and returns directly", () => {
      expect(safeString("  hello  ", "fallback")).toBe("hello");
    });
    it("returns stringified values for numbers", () => {
      expect(safeString(123, "fallback")).toBe("123");
    });
    it("returns fallback for null/undefined", () => {
      expect(safeString(null, "fallback")).toBe("fallback");
      expect(safeString(undefined, "fallback")).toBe("fallback");
    });
    it("truncates if maxLen provided", () => {
      expect(safeString("hello world", "fallback", 5)).toBe("hello");
    });
  });

  describe("safeNumber", () => {
    it("parses valid numbers strings", () => {
      expect(safeNumber("42", 0)).toBe(42);
    });
    it("clamps values exceeding min/max", () => {
      expect(safeNumber(100, 0, 10, 50)).toBe(50);
      expect(safeNumber(5, 0, 10, 50)).toBe(10);
    });
    it("returns fallback for NaN/unparseable", () => {
      expect(safeNumber("foo", 42)).toBe(42);
      expect(safeNumber(undefined, 42)).toBe(42);
    });
  });

  describe("safeBoolean", () => {
    it("parses booleans correctly", () => {
      expect(safeBoolean(true, false)).toBe(true);
      expect(safeBoolean("true", false)).toBe(true);
      expect(safeBoolean(1, false)).toBe(true);
      expect(safeBoolean("foo", false)).toBe(false);
    });
  });

  describe("safeEnum", () => {
    it("returns valid enum matches", () => {
      const allowed = ["illegal", "dangerous", "warning", "safe"] as const;
      expect(safeEnum("dangerous", allowed, "safe")).toBe("dangerous");
    });
    it("returns fallback for invalid matches", () => {
      const allowed = ["illegal", "dangerous", "warning", "safe"] as const;
      expect(safeEnum("unknown", allowed, "safe")).toBe("safe");
    });
  });

  describe("safeStringArray", () => {
    it("extracts and trims strings cleanly, skipping non-strings", () => {
      expect(safeStringArray([" foo ", 123, "bar", null])).toEqual(["foo", "bar"]);
    });
    it("returns empty array for non-arrays instead of crashing", () => {
      expect(safeStringArray("not an array")).toEqual([]);
      expect(safeStringArray(undefined)).toEqual([]);
    });
  });

  describe("safeParseJson", () => {
    it("parses direct JSON strings safely", () => {
      const json = `{"key":"value"}`;
      expect(safeParseJson(json)).toEqual({ key: "value" });
    });
    it("parses markdown code-fenced JSON smoothly", () => {
      const blocked = "Here is the response:\n```json\n{\"ok\":true}\n```\nEnjoy!";
      expect(safeParseJson(blocked)).toEqual({ ok: true });
    });
    it("parses brute-force dirty JSON chunks", () => {
      const dirty = "Just a preamble string { \"extracted\": 42 } and some trailing garbage.";
      expect(safeParseJson(dirty)).toEqual({ extracted: 42 });
    });
    it("returns null instead of throwing on entirely unparseable strings", () => {
      expect(safeParseJson("Absolutely no json here")).toBeNull();
    });
  });

  describe("field accessor", () => {
    it("accesses nested keys safely without throwing", () => {
      const obj = { data: { inner: "value" } };
      expect(field(obj, "data")).toEqual({ inner: "value" });
      expect(field(obj, "missing")).toBeUndefined();
      expect(field(null, "missing")).toBeUndefined();
    });
  });
});
