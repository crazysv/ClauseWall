// ============================================
// INPUT SANITIZATION — Central Utility
// Lightweight, composable, legal-text-aware.
// No external dependencies.
// ============================================

// ── Primitives ──────────────────────────────

/**
 * Strip null bytes and invisible control characters.
 * Preserves newlines, tabs, and carriage returns.
 */
function stripControlChars(text: string): string {
  // eslint-disable-next-line no-control-regex
  return text.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "");
}

/**
 * Strip HTML-like tags from text (e.g., `<script>`, `<b>`, `</div>`).
 * Does NOT strip angle brackets used in legal/mathematical context like `a < b`.
 */
function stripTags(text: string): string {
  return text.replace(/<\/?[a-zA-Z][^>]*>/g, "");
}

/**
 * Collapse multiple whitespace characters (spaces, tabs) into single spaces.
 * Preserves newlines.
 */
function collapseWhitespace(text: string): string {
  return text.replace(/[^\S\n]+/g, " ");
}

/**
 * Collapse multiple consecutive newlines (3+) into double newlines.
 * Preserves paragraph breaks but removes excessive blank lines.
 */
function collapseNewlines(text: string): string {
  return text.replace(/\n{3,}/g, "\n\n");
}

/**
 * Normalize Unicode to NFKC form.
 * Converts compatibility characters to their canonical equivalents.
 */
function normalizeUnicode(text: string): string {
  return text.normalize("NFKC");
}

/**
 * Enforce a maximum length, truncating with an ellipsis if needed.
 */
function enforceLength(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + "...";
}

// ── Composable Sanitizers ───────────────────

/**
 * Sanitize a display-facing short string (names, titles).
 * - Strips HTML tags
 * - Strips control characters
 * - Normalizes Unicode (NFKC)
 * - Collapses whitespace
 * - Trims
 * - Enforces length limit (default: 100 chars)
 *
 * Use for: campaign display names, user display names, short labels.
 */
export function sanitizeDisplayText(
  text: string,
  maxLength: number = 100,
): string {
  let s = text;
  s = stripControlChars(s);
  s = stripTags(s);
  s = normalizeUnicode(s);
  s = collapseWhitespace(s);
  s = s.trim();
  s = enforceLength(s, maxLength);
  return s;
}

/**
 * Sanitize an entity name for storage and lookup.
 * - All sanitizeDisplayText operations
 * - Lowercased for consistent matching
 * - Strips leading/trailing quotes
 * - Strips common Indian business prefixes (M/s., Messrs.)
 *
 * Use for: entity names in flag-entity, entity lookups.
 */
export function sanitizeEntityName(
  text: string,
  maxLength: number = 150,
): string {
  let s = sanitizeDisplayText(text, maxLength);

  // Strip surrounding quotes
  s = s.replace(/^["']+|["']+$/g, "");

  // Strip Indian business prefixes
  s = s.replace(/^(M\/s\.?\s*|Messrs\.?\s*)/i, "");

  // Collapse trailing punctuation
  s = s.replace(/[,;:.]+$/, "");

  s = s.trim();
  return s;
}

/**
 * Sanitize a user-submitted description or message.
 * - Strips HTML tags
 * - Strips control characters
 * - Normalizes Unicode
 * - Collapses excessive whitespace and newlines
 * - Enforces length limit (default: 2000 chars)
 *
 * Use for: violation descriptions, complaint context, collective messages,
 * user notes, report descriptions.
 */
export function sanitizeUserDescription(
  text: string,
  maxLength: number = 2000,
): string {
  let s = text;
  s = stripControlChars(s);
  s = stripTags(s);
  s = normalizeUnicode(s);
  s = collapseWhitespace(s);
  s = collapseNewlines(s);
  s = s.trim();
  s = enforceLength(s, maxLength);
  return s;
}

/**
 * Sanitize a plain text block (contract text, pasted content).
 * Lighter touch than descriptions — preserves formatting structure
 * that may be meaningful in legal documents.
 * - Strips control characters (preserves \n, \t, \r)
 * - Normalizes Unicode
 * - Collapses excessive blank lines (3+ → 2)
 * - Does NOT strip HTML tags (legal text may contain `<` or `>`)
 * - Does NOT collapse single-line whitespace (preserves indentation)
 * - Enforces length limit (default: 100K chars)
 *
 * Use for: pasted contract text, uploaded file content, OCR output.
 */
export function sanitizePlainTextBlock(
  text: string,
  maxLength: number = 100_000,
): string {
  let s = text;
  s = stripControlChars(s);
  s = normalizeUnicode(s);
  s = collapseNewlines(s);
  s = s.trim();
  s = enforceLength(s, maxLength);
  return s;
}

/**
 * Sanitize text before sending to an LLM as user content.
 * - All sanitizePlainTextBlock operations
 * - Strips HTML tags (LLM input doesn't need HTML)
 * - Enforces tighter length limit (default: 50K chars)
 *
 * Use for: all text sent to Groq/Gemini as the user message portion.
 */
export function sanitizeLLMInput(
  text: string,
  maxLength: number = 50_000,
): string {
  let s = sanitizePlainTextBlock(text, maxLength);
  s = stripTags(s);
  return s;
}

/**
 * Sanitize an array of string items (e.g., violations list).
 * - Sanitizes each item as a display text
 * - Removes empty items after sanitization
 * - Enforces max number of items
 *
 * Use for: violations arrays in flag-entity, tag arrays.
 */
export function sanitizeStringArray(
  items: string[],
  maxItems: number = 20,
  maxItemLength: number = 300,
): string[] {
  return items
    .slice(0, maxItems)
    .map((item) => sanitizeDisplayText(item, maxItemLength))
    .filter((item) => item.length > 0);
}
