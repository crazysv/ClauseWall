// ============================================
// EML EMAIL PARSER
// Parses .eml files using mailparser
// ============================================

import type { ParsedEmail, EmailHeader, EmailAttachment } from "@/types/evidence";
import { hashContent } from "../storage";

/**
 * Parse an .eml file buffer into structured email data
 */
export async function parseEmlFile(buffer: Buffer): Promise<ParsedEmail> {
  const { simpleParser } = await import("mailparser");

  const parsed = await simpleParser(buffer);

  // Extract headers
  const from = parsed.from?.value?.[0]
    ? { name: parsed.from.value[0].name || "", address: parsed.from.value[0].address || "" }
    : null;

  const to: EmailHeader[] = (parsed.to
    ? (Array.isArray(parsed.to) ? parsed.to : [parsed.to])
        .flatMap((t) => t.value || [])
        .map((v) => ({ name: v.name || "", address: v.address || "" }))
    : []);

  const cc: EmailHeader[] = (parsed.cc
    ? (Array.isArray(parsed.cc) ? parsed.cc : [parsed.cc])
        .flatMap((c) => c.value || [])
        .map((v) => ({ name: v.name || "", address: v.address || "" }))
    : []);

  const bcc: EmailHeader[] = (parsed.bcc
    ? (Array.isArray(parsed.bcc) ? parsed.bcc : [parsed.bcc])
        .flatMap((b) => b.value || [])
        .map((v) => ({ name: v.name || "", address: v.address || "" }))
    : []);

  const replyTo = parsed.replyTo?.value?.[0]
    ? { name: parsed.replyTo.value[0].name || "", address: parsed.replyTo.value[0].address || "" }
    : null;

  // Extract important headers as flat record
  const headers: Record<string, string> = {};
  if (parsed.headers) {
    for (const [key, value] of parsed.headers) {
      if (typeof value === "string") {
        headers[key] = value;
      } else if (value && typeof value === "object" && "text" in value) {
        headers[key] = String((value as { text: string }).text);
      }
    }
  }

  // Extract attachments
  const attachments: EmailAttachment[] = (parsed.attachments || []).map((att) => ({
    filename: att.filename || "unnamed",
    mime_type: att.contentType || "application/octet-stream",
    size_bytes: att.size || 0,
    content_hash: hashContent(att.content),
    storage_path: null, // Will be filled during upload
  }));

  return {
    from,
    to,
    cc,
    bcc,
    reply_to: replyTo,
    subject: parsed.subject || "(No Subject)",
    date: parsed.date?.toISOString() || null,
    headers,
    body_text: parsed.text || "",
    body_html: parsed.html || null,
    attachments,
  };
}

/**
 * Parse raw email text (when user pastes email content manually)
 */
export function parseRawEmailText(text: string, metadata?: {
  from?: string;
  to?: string;
  subject?: string;
  date?: string;
}): ParsedEmail {
  return {
    from: metadata?.from ? { name: "", address: metadata.from } : null,
    to: metadata?.to ? [{ name: "", address: metadata.to }] : [],
    cc: [],
    bcc: [],
    reply_to: null,
    subject: metadata?.subject || "(Manually Added)",
    date: metadata?.date || new Date().toISOString(),
    headers: {},
    body_text: text,
    body_html: null,
    attachments: [],
  };
}
