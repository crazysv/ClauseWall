// ============================================
// TELEGRAM WEBHOOK HANDLER
// Quick scan → instant response → save to DB → trigger full analysis
// ============================================

import { NextRequest } from "next/server";
import { after } from "next/server";
import {
  sendMessage,
  sendChatAction,
  downloadFile,
} from "@/lib/bot/telegram-client";
import {
  quickAnalyze,
  quickAnalyzeImage,
} from "@/lib/bot/quick-analyzer";
import {
  formatTelegramResponse,
  getWelcomeMessageTelegram,
} from "@/lib/bot/format-response";
import { parsePDF } from "@/lib/core/pdf-parser";
import { createAdminClient } from "@/lib/supabase/admin";
import type { QuickAnalysisResult } from "@/lib/bot/quick-analyzer";

export const maxDuration = 60;

// ---- VALID DOCUMENT TYPES ----

const VALID_DOC_TYPES = [
  "rental",
  "employment",
  "tos",
  "loan",
  "freelance",
  "sale",
  "partnership",
  "nda",
  "other",
];

function mapDocumentType(detected: string): string {
  const normalized = detected.toLowerCase().replace(/\s+/g, "_");
  return VALID_DOC_TYPES.includes(normalized) ? normalized : "other";
}

// ---- TELEGRAM TYPES ----

interface TelegramUpdate {
  message?: {
    message_id: number;
    chat: { id: number; first_name?: string };
    text?: string;
    document?: {
      file_id: string;
      file_name?: string;
      mime_type?: string;
      file_size?: number;
    };
    photo?: Array<{
      file_id: string;
      file_size?: number;
      width: number;
      height: number;
    }>;
  };
}

// ---- WEBHOOK ENDPOINT ----

export async function POST(request: NextRequest) {
  let update: TelegramUpdate;

  try {
    update = await request.json();
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }

  const message = update.message;
  if (!message) {
    return new Response("OK", { status: 200 });
  }

  const chatId = message.chat.id;

  after(async () => {
    try {
      await processMessage(chatId, message);
    } catch (error) {
      console.error("[ClauseWall Bot] Error:", error);
      await sendMessage(
        chatId,
        "❌ Something went wrong while analyzing. Please try again."
      ).catch(() => {});
    }
  });

  return new Response("OK", { status: 200 });
}

// ---- MESSAGE ROUTER ----

async function processMessage(
  chatId: number,
  message: NonNullable<TelegramUpdate["message"]>
) {
  if (
    message.text?.startsWith("/start") ||
    message.text?.startsWith("/help")
  ) {
    await sendMessage(chatId, getWelcomeMessageTelegram());
    return;
  }

  if (message.document) {
    await handleDocument(chatId, message.document);
    return;
  }

  if (message.photo && message.photo.length > 0) {
    await handlePhoto(chatId, message.photo);
    return;
  }

  if (message.text) {
    await handleText(chatId, message.text);
    return;
  }

  await sendMessage(
    chatId,
    "📎 Send a <b>PDF</b>, <b>photo</b>, or <b>paste text</b> of a contract to analyze."
  );
}

// ---- SAVE DOCUMENT + TRIGGER FULL ANALYSIS ----

async function saveAndTriggerAnalysis(
  extractedText: string,
  result: QuickAnalysisResult,
  filename: string
): Promise<string | null> {
    console.log("[ClauseWall Bot] saveAndTriggerAnalysis called");
    console.log("[ClauseWall Bot] Text length:", extractedText?.length || 0);
    console.log("[ClauseWall Bot] Filename:", filename);
    try {
    // Must have enough text for full analysis
    console.log("[ClauseWall Bot] Checking text length:", extractedText?.length || 0);
    if (!extractedText || extractedText.trim().length < 50) {
      console.log("[ClauseWall Bot] Text too short for full analysis, skipping save");
      return null;
    }

    const supabase = createAdminClient();
    const documentType = mapDocumentType(result.document_type_detected);

    // Save document to Supabase
    const { data: doc, error: dbError } = await supabase
      .from("documents")
      .insert({
        original_filename: filename,
        document_type: documentType,
        jurisdiction: "ALL-INDIA",
        raw_text: extractedText,
        analysis_status: "pending",
        user_id: null,
        overall_risk_score: result.risk_score,
        total_clauses: 0,
        safe_count: 0,
        warning_count: 0,
        dangerous_count: 0,
        illegal_count: 0,
      })
      .select("id")
      .single();

    console.log("[ClauseWall Bot] DB insert result:", { doc, dbError });

    if (dbError || !doc) {
      console.error("[ClauseWall Bot] Failed to save document:", dbError);
      return null;
    }

    console.log(`[ClauseWall Bot] Document saved: ${doc.id}`);

    // Trigger full analysis via separate API call (gets own 60s timeout)
    const appUrl = process.env.NEXT_PUBLIC_APP_URL;
    if (appUrl) {
      fetch(`${appUrl}/api/bot/trigger-analysis`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          documentId: doc.id,
          text: extractedText,
          documentType,
          jurisdiction: "ALL-INDIA",
        }),
      }).catch((err) => {
        console.error("[ClauseWall Bot] Failed to trigger analysis:", err);
      });
    }

    return doc.id;
  } catch (error) {
    console.error("[ClauseWall Bot] Save and trigger failed:", error);
    return null;
  }
}

// ---- SEND RESULTS WITH LINK ----

async function sendResults(
  chatId: number,
  result: QuickAnalysisResult,
  documentId: string | null
) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || undefined;

  const resultUrl = documentId && appUrl
    ? `${appUrl}/results/${documentId}`
    : undefined;

  await sendMessage(
    chatId,
    formatTelegramResponse(result, { appUrl, resultUrl })
  );
}

// ---- DOCUMENT HANDLER (PDF / TXT) ----

async function handleDocument(
  chatId: number,
  doc: {
    file_id: string;
    file_name?: string;
    mime_type?: string;
    file_size?: number;
  }
) {
  const mime = doc.mime_type || "";
  const fileName = doc.file_name || "document";

  if (!mime.includes("pdf") && !mime.includes("text")) {
    await sendMessage(
      chatId,
      "📎 Unsupported format. Please send a <b>PDF</b> or <b>TXT</b> file."
    );
    return;
  }

  if (doc.file_size && doc.file_size > 5 * 1024 * 1024) {
    await sendMessage(chatId, "📏 File too large. Please send a file under 5MB.");
    return;
  }

  sendChatAction(chatId);
  await sendMessage(
    chatId,
    `📄 Received <b>${escapeHtml(fileName)}</b>\n🔍 Analyzing...`
  );

  // Download and extract text
  const buffer = await downloadFile(doc.file_id);
  let text: string;

  if (mime.includes("pdf")) {
    text = await parsePDF(buffer);
  } else {
    text = buffer.toString("utf-8");
  }

  if (!text || text.trim().length < 50) {
    await sendMessage(
      chatId,
      "⚠️ Couldn't extract enough text. Try pasting the contract text directly."
    );
    return;
  }

  // Quick scan
  sendChatAction(chatId);
  const result = await quickAnalyze(text);

  // Save to DB + trigger full analysis
  const documentId = await saveAndTriggerAnalysis(text, result, fileName);

  // Send results with link
  await sendResults(chatId, result, documentId);
}

// ---- PHOTO HANDLER (OCR + Analysis) ----

async function handlePhoto(
  chatId: number,
  photos: Array<{ file_id: string; width: number; height: number }>
) {
  sendChatAction(chatId);
  await sendMessage(chatId, "📸 Photo received!\n🔍 Reading text and analyzing...");

  const photo = photos[photos.length - 1];

  try {
    const buffer = await downloadFile(photo.file_id);
    const base64 = buffer.toString("base64");

    sendChatAction(chatId);
    const result = await quickAnalyzeImage(base64, "image/jpeg");

    // Save OCR'd text to DB + trigger full analysis
    const documentId = await saveAndTriggerAnalysis(
      result.extracted_text || "",
      result,
      "telegram-photo.jpg"
    );

    // Send results with link
    await sendResults(chatId, result, documentId);
  } catch (error) {
    console.error("[ClauseWall Bot] Photo analysis failed:", error);
    await sendMessage(
      chatId,
      "⚠️ Couldn't read the photo clearly. Tips:\n\n" +
        "📸 Make sure text is <b>sharp and well-lit</b>\n" +
        "📄 Or send the contract as a <b>PDF</b> for best results\n" +
        "📝 Or <b>paste the text</b> directly"
    );
  }
}

// ---- TEXT HANDLER ----

async function handleText(chatId: number, text: string) {
  if (text.trim().length < 50) {
    await sendMessage(
      chatId,
      "📝 Too short to analyze. Please paste the <b>full contract text</b> (at least a few paragraphs)."
    );
    return;
  }

  sendChatAction(chatId);
  await sendMessage(chatId, "📝 Text received!\n🔍 Analyzing...");

  sendChatAction(chatId);
  const result = await quickAnalyze(text);

  // Save to DB + trigger full analysis
  const documentId = await saveAndTriggerAnalysis(
    text,
    result,
    "telegram-text.txt"
  );

  // Send results with link
  await sendResults(chatId, result, documentId);
}

// ---- HELPER ----

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}