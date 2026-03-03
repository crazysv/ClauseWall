// ============================================
// TELEGRAM WEBHOOK HANDLER
// Receives messages → analyzes → sends results
// Uses after() for non-blocking webhook response
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

// Allow up to 60s on Vercel Pro (falls back to 10s on Hobby — still enough)
export const maxDuration = 60;

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

  // Process in background after sending 200 to Telegram
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
  // /start or /help
  if (
    message.text?.startsWith("/start") ||
    message.text?.startsWith("/help")
  ) {
    await sendMessage(chatId, getWelcomeMessageTelegram());
    return;
  }

  // PDF or TXT document
  if (message.document) {
    await handleDocument(chatId, message.document);
    return;
  }

  // Photo of paper contract
  if (message.photo && message.photo.length > 0) {
    await handlePhoto(chatId, message.photo);
    return;
  }

  // Pasted text
  if (message.text) {
    await handleText(chatId, message.text);
    return;
  }

  // Anything else
  await sendMessage(
    chatId,
    "📎 Send a <b>PDF</b>, <b>photo</b>, or <b>paste text</b> of a contract to analyze."
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

  // Validate type
  if (!mime.includes("pdf") && !mime.includes("text")) {
    await sendMessage(
      chatId,
      "📎 Unsupported format. Please send a <b>PDF</b> or <b>TXT</b> file."
    );
    return;
  }

  // Size check (bot API limit is 20MB, we cap at 5MB)
  if (doc.file_size && doc.file_size > 5 * 1024 * 1024) {
    await sendMessage(chatId, "📏 File too large. Please send a file under 5MB.");
    return;
  }

  // Show typing + acknowledge
  sendChatAction(chatId);
  await sendMessage(
    chatId,
    `📄 Received <b>${escapeHtml(fileName)}</b>\n🔍 Analyzing...`
  );

  // Download
  const buffer = await downloadFile(doc.file_id);

  // Extract text
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

  // Analyze + send results
  sendChatAction(chatId);
  const result = await quickAnalyze(text);
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || undefined;
  await sendMessage(chatId, formatTelegramResponse(result, appUrl));
}

// ---- PHOTO HANDLER (OCR + Analysis) ----

async function handlePhoto(
  chatId: number,
  photos: Array<{ file_id: string; width: number; height: number }>
) {
  sendChatAction(chatId);
  await sendMessage(chatId, "📸 Photo received!\n🔍 Reading text and analyzing...");

  // Get largest resolution (last in array)
  const photo = photos[photos.length - 1];

  try {
    const buffer = await downloadFile(photo.file_id);
    const base64 = buffer.toString("base64");

    sendChatAction(chatId);
    const result = await quickAnalyzeImage(base64, "image/jpeg");
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || undefined;
    await sendMessage(chatId, formatTelegramResponse(result, appUrl));
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
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || undefined;
  await sendMessage(chatId, formatTelegramResponse(result, appUrl));
}

// ---- HELPER ----

function escapeHtml(text: string): string {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}