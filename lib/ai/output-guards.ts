// ============================================
// AI OUTPUT GUARD PRIMITIVES
// Coercion-based validators for LLM responses.
// These NEVER throw — they always return a safe value.
// ============================================

// ── Scalar Guards ──

/**
 * Coerce unknown value to string with fallback.
 * Trims result. Truncates to maxLen if provided.
 */
export function safeString(
  value: unknown,
  fallback: string,
  maxLen?: number
): string {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return maxLen ? trimmed.substring(0, maxLen) : trimmed;
  }
  if (value != null) return String(value);
  return fallback;
}

/**
 * Coerce unknown value to string, or return null.
 */
export function safeStringOrNull(
  value: unknown,
  maxLen?: number
): string | null {
  if (value == null) return null;
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (trimmed.length === 0) return null;
    return maxLen ? trimmed.substring(0, maxLen) : trimmed;
  }
  return String(value);
}

/**
 * Coerce unknown value to number with fallback and clamping.
 */
export function safeNumber(
  value: unknown,
  fallback: number,
  min?: number,
  max?: number
): number {
  const n = Number(value);
  if (isNaN(n)) return fallback;
  let result = n;
  if (min != null) result = Math.max(min, result);
  if (max != null) result = Math.min(max, result);
  return result;
}

/**
 * Coerce unknown value to integer with fallback and clamping.
 */
export function safeInt(
  value: unknown,
  fallback: number,
  min?: number,
  max?: number
): number {
  return Math.round(safeNumber(value, fallback, min, max));
}

/**
 * Coerce unknown value to boolean with fallback.
 */
export function safeBoolean(value: unknown, fallback: boolean): boolean {
  if (typeof value === "boolean") return value;
  if (value === "true" || value === 1) return true;
  if (value === "false" || value === 0) return false;
  return fallback;
}

// ── Enum Guard ──

/**
 * Validate that a value is one of the allowed enum values.
 * Returns the value if valid, otherwise the fallback.
 */
export function safeEnum<T extends string>(
  value: unknown,
  validValues: readonly T[],
  fallback: T
): T {
  if (typeof value === "string" && (validValues as readonly string[]).includes(value)) {
    return value as T;
  }
  return fallback;
}

// ── Array Guards ──

/**
 * Ensure value is an array. Returns empty array if not.
 */
export function safeArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

/**
 * Coerce value to string array, filtering non-strings.
 * Optionally limits item count.
 */
export function safeStringArray(
  value: unknown,
  maxItems?: number
): string[] {
  if (!Array.isArray(value)) return [];
  const result = value
    .filter((v) => typeof v === "string" && v.trim().length > 0)
    .map((v) => String(v).trim());
  return maxItems ? result.slice(0, maxItems) : result;
}

/**
 * Map an array through a guard function, skipping items that return null.
 */
export function safeArrayMap<T>(
  value: unknown,
  guard: (item: unknown, index: number) => T | null,
  maxItems?: number
): T[] {
  const arr = safeArray(value);
  const limited = maxItems ? arr.slice(0, maxItems) : arr;
  const result: T[] = [];
  for (let i = 0; i < limited.length; i++) {
    const guarded = guard(limited[i], i);
    if (guarded != null) result.push(guarded);
  }
  return result;
}

// ── JSON Extraction ──

/**
 * 3-stage JSON extraction from a potentially messy LLM response.
 * Stage 1: Direct JSON.parse
 * Stage 2: Extract from markdown code fences
 * Stage 3: Extract from first { to last }
 * Returns null if all stages fail.
 */
export function safeParseJson(
  raw: string
): Record<string, unknown> | null {
  if (!raw || typeof raw !== "string") return null;

  // Stage 1: Direct parse
  try {
    const parsed = JSON.parse(raw);
    if (typeof parsed === "object" && parsed !== null) {
      return parsed as Record<string, unknown>;
    }
  } catch {
    // continue
  }

  // Stage 2: Strip markdown code fences
  const fenceMatch = raw.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
  if (fenceMatch) {
    try {
      const parsed = JSON.parse(fenceMatch[1].trim());
      if (typeof parsed === "object" && parsed !== null) {
        return parsed as Record<string, unknown>;
      }
    } catch {
      // continue
    }
  }

  // Stage 3: First { to last }
  const firstBrace = raw.indexOf("{");
  const lastBrace = raw.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace > firstBrace) {
    try {
      const parsed = JSON.parse(raw.substring(firstBrace, lastBrace + 1));
      if (typeof parsed === "object" && parsed !== null) {
        return parsed as Record<string, unknown>;
      }
    } catch {
      // continue
    }
  }

  return null;
}

// ── Composite ──

/**
 * Parse raw LLM response and apply a guard function.
 * Returns the guarded result, or null if JSON extraction fails entirely.
 */
export function safeParseLLMResponse<T>(
  raw: string,
  guard: (parsed: Record<string, unknown>) => T
): T | null {
  const parsed = safeParseJson(raw);
  if (!parsed) return null;
  return guard(parsed);
}

// ── Record accessor ──

/**
 * Safely access a nested value from a parsed record.
 * Useful for `parsed.some_field?.nested` patterns on `unknown`.
 */
export function field(
  obj: unknown,
  key: string
): unknown {
  if (obj != null && typeof obj === "object" && key in (obj as Record<string, unknown>)) {
    return (obj as Record<string, unknown>)[key];
  }
  return undefined;
}
