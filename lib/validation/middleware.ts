// ============================================
// VALIDATION MIDDLEWARE — Consistent 400 responses
// ============================================

import { z, ZodError, ZodSchema } from "zod";
import { NextResponse } from "next/server";

/**
 * Result of validateBody — either success with typed data,
 * or failure with a pre-built NextResponse (400).
 */
export type ValidationResult<T> =
  | { success: true; data: T }
  | { success: false; response: NextResponse };

/**
 * Validate a request body against a Zod schema.
 *
 * Usage:
 * ```ts
 * const parsed = validateBody(body, MySchema);
 * if (!parsed.success) return parsed.response;
 * const { text, documentType } = parsed.data;
 * ```
 */
export function validateBody<T>(
  body: unknown,
  schema: ZodSchema<T>,
): ValidationResult<T> {
  const result = schema.safeParse(body);

  if (result.success) {
    return { success: true, data: result.data };
  }

  return {
    success: false,
    response: NextResponse.json(
      {
        error: "Validation failed",
        details: formatZodErrors(result.error),
      },
      { status: 400 },
    ),
  };
}

/**
 * Validate a request body with CORS headers (for public endpoints).
 */
export function validateBodyWithCors<T>(
  body: unknown,
  schema: ZodSchema<T>,
  corsHeaders: HeadersInit,
): ValidationResult<T> {
  const result = schema.safeParse(body);

  if (result.success) {
    return { success: true, data: result.data };
  }

  return {
    success: false,
    response: NextResponse.json(
      {
        error: "Validation failed",
        details: formatZodErrors(result.error),
      },
      { status: 400, headers: corsHeaders },
    ),
  };
}

/**
 * Format ZodError into a flat array of { field, message } objects.
 */
function formatZodErrors(
  error: ZodError,
): Array<{ field: string; message: string }> {
  return error.issues.map((issue) => ({
    field: issue.path.join(".") || "(root)",
    message: issue.message,
  }));
}

/**
 * Validate file size against a max limit.
 * Returns a NextResponse (400) if too large, or null if OK.
 */
export function validateFileSize(
  file: File,
  maxBytes: number,
  label: string = "File",
): NextResponse | null {
  if (file.size > maxBytes) {
    const maxMB = Math.round(maxBytes / (1024 * 1024));
    return NextResponse.json(
      {
        error: "Validation failed",
        details: [
          {
            field: "file",
            message: `${label} too large. Maximum size is ${maxMB}MB.`,
          },
        ],
      },
      { status: 400 },
    );
  }
  return null;
}
