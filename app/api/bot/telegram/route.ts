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
    caption?: string;
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
    voice?: {
      file_id: string;
      duration: number;
      mime_type?: string;
      file_size?: number;
    };
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

// ---- IN-MEMORY STATE FOR COMPARE ----

const compareState = new Map<number, {
  step: "waiting_a" | "waiting_b";
  textA: string;
  documentType: string;
}>();

// ---- MESSAGE ROUTER ----

async function processMessage(
  chatId: number,
  message: NonNullable<TelegramUpdate["message"]>
) {
  // Check if user is in compare flow
  if (compareState.has(chatId)) {
    await handleCompareStep(chatId, message);
    return;
  }

  if (
    message.text?.startsWith("/start") ||
    message.text?.startsWith("/help")
  ) {
    await sendMessage(chatId, getWelcomeMessageTelegram());
    return;
  }

  if (message.text?.startsWith("/compare")) {
    await startCompare(chatId);
    return;
  }

  if (message.text?.startsWith("/link")) {
    await handleLink(chatId);
    return;
  }

  if (message.text?.startsWith("/deadlines")) {
    await handleDeadlines(chatId);
    return;
  }

  // Voice-Aid: /voice command
  if (message.text?.startsWith("/voice")) {
    const { handleVoiceCommand } = await import("@/lib/voice-aid/telegram-voice-handler");
    await handleVoiceCommand(chatId);
    return;
  }

  // Voice-Aid: /language command
  if (message.text?.startsWith("/language")) {
    const { handleLanguageCommand } = await import("@/lib/voice-aid/telegram-voice-handler");
    await handleLanguageCommand(chatId);
    return;
  }

  // Voice-Aid: /lang_xx command
  if (message.text?.match(/^\/lang_[a-z]{2}$/)) {
    const { handleSetLanguage, isLanguageSetCommand } = await import("@/lib/voice-aid/telegram-voice-handler");
    const langCode = isLanguageSetCommand(message.text);
    if (langCode) {
      await handleSetLanguage(chatId, langCode);
      return;
    }
  }

  // Voice-Aid: Incoming voice message
  if (message.voice) {
    const { handleVoiceMessage } = await import("@/lib/voice-aid/telegram-voice-handler");
    await handleVoiceMessage(chatId, message.voice.file_id, message.voice.duration);
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
    "📎 Send a <b>PDF</b>, <b>photo</b>, or <b>paste text</b> of a contract to analyze.\n\n🎤 Send a <b>voice message</b> to use Voice Aid.\n💡 Use /compare to compare two contracts."
  );
}

// ---- COMPARE HANDLERS ----

async function startCompare(chatId: number) {
  compareState.set(chatId, {
    step: "waiting_a",
    textA: "",
    documentType: "other",
  });

  await sendMessage(
    chatId,
    `🔍 <b>Contract Comparison Mode</b>\n\n` +
    `Send me the <b>first contract</b>:\n` +
    `📄 PDF file\n` +
    `📝 Paste text\n\n` +
    `<i>Send /cancel to exit comparison mode</i>`
  );
}

async function handleCompareStep(
  chatId: number,
  message: NonNullable<TelegramUpdate["message"]>
) {
  // Cancel
  if (message.text?.startsWith("/cancel")) {
    compareState.delete(chatId);
    await sendMessage(chatId, "❌ Comparison cancelled.");
    return;
  }

  const state = compareState.get(chatId)!;

  // Extract text from message
  let extractedText = "";

  if (message.document) {
    const mime = message.document.mime_type || "";
    if (mime.includes("pdf") || mime.includes("text")) {
      const buffer = await downloadFile(message.document.file_id);
      if (mime.includes("pdf")) {
        extractedText = await parsePDF(buffer);
      } else {
        extractedText = buffer.toString("utf-8");
      }
    }
  } else if (message.photo && message.photo.length > 0) {
    sendChatAction(chatId);
    const photo = message.photo[message.photo.length - 1];
    const buffer = await downloadFile(photo.file_id);
    const base64 = buffer.toString("base64");
    const result = await quickAnalyzeImage(base64, "image/jpeg");
    extractedText = result.extracted_text || "";
  } else if (message.text) {
    extractedText = message.text;
  }

  if (!extractedText || extractedText.trim().length < 50) {
    await sendMessage(
      chatId,
      "⚠️ Couldn't extract enough text. Please send a longer contract or try a different format."
    );
    return;
  }

  if (state.step === "waiting_a") {
    // Got contract A
    state.textA = extractedText;
    state.step = "waiting_b";
    compareState.set(chatId, state);

    await sendMessage(
      chatId,
      `✅ <b>Contract A received!</b> (${extractedText.length} chars)\n\n` +
      `Now send me the <b>second contract</b>:\n` +
      `📄 PDF file\n` +
      `📝 Paste text\n\n` +
      `<i>Send /cancel to exit</i>`
    );
  } else if (state.step === "waiting_b") {
    // Got contract B — compare!
    compareState.delete(chatId);

    sendChatAction(chatId);
    await sendMessage(chatId, "🔍 Comparing both contracts...");

    try {
      const { compareContracts, formatComparisonTelegram } = await import(
        "@/lib/bot/compare-analyzer"
      );

      sendChatAction(chatId);
      const result = await compareContracts(state.textA, extractedText);
      await sendMessage(chatId, formatComparisonTelegram(result));
    } catch (error) {
      console.error("[ClauseWall Bot] Compare failed:", error);
      await sendMessage(
        chatId,
        "❌ Comparison failed. Please try again."
      );
    }
  }
}

// ---- SAVE DOCUMENT + TRIGGER FULL ANALYSIS ----

async function saveAndTriggerAnalysis(
  extractedText: string,
  result: QuickAnalysisResult,
  filename: string,
  chatId: number
): Promise<string | null> {
  try {
    console.log("[ClauseWall Bot] saveAndTriggerAnalysis called");
    console.log("[ClauseWall Bot] Text length:", extractedText?.length || 0);
    console.log("[ClauseWall Bot] Filename:", filename);
    console.log("[ClauseWall Bot] Chat ID:", chatId);

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
    console.log("[ClauseWall Bot] App URL:", appUrl);
    console.log("[ClauseWall Bot] Triggering full analysis for:", doc.id);

    if (appUrl) {
      fetch(`${appUrl}/api/bot/trigger-analysis`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          documentId: doc.id,
          text: extractedText,
          documentType,
          jurisdiction: "ALL-INDIA",
          chatId,
        }),
      })
        .then((res) => {
          console.log("[ClauseWall Bot] Trigger response status:", res.status);
        })
        .catch((err) => {
          console.error("[ClauseWall Bot] Failed to trigger analysis:", err);
        });
    } else {
      console.error("[ClauseWall Bot] NEXT_PUBLIC_APP_URL not set!");
    }

    return doc.id;
  } catch (error) {
    console.error("[ClauseWall Bot] Save and trigger failed:", error);
    return null;
  }
}

// ---- SEND RESULTS ----

async function sendResults(
  chatId: number,
  result: QuickAnalysisResult
) {
  await sendMessage(chatId, formatTelegramResponse(result));
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
  await saveAndTriggerAnalysis(text, result, fileName, chatId);

  // Send quick results
  await sendResults(chatId, result);
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
    await saveAndTriggerAnalysis(
      result.extracted_text || "",
      result,
      "telegram-photo.jpg",
      chatId
    );

    // Send quick results
    await sendResults(chatId, result);
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
  await saveAndTriggerAnalysis(text, result, "telegram-text.txt", chatId);

  // Send quick results
  await sendResults(chatId, result);
}

// ---- HELPER ----

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

// ---- TIMEBOMB: /link ----

async function handleLink(chatId: number) {
  try {
    const supabase = createAdminClient();

    // Upsert the chat ID into reminder settings
    // We match by telegram_chat_id since the user may not be authenticated via Telegram
    const { error } = await supabase
      .from("deadline_reminder_settings")
      .upsert(
        {
          telegram_chat_id: String(chatId),
          telegram_enabled: true,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "telegram_chat_id" }
      );

    if (error) {
      // If upsert fails (likely no unique constraint on telegram_chat_id),
      // try to update any existing row with this chat_id
      await supabase
        .from("deadline_reminder_settings")
        .update({
          telegram_chat_id: String(chatId),
          telegram_enabled: true,
          updated_at: new Date().toISOString(),
        })
        .eq("telegram_chat_id", String(chatId));
    }

    await sendMessage(
      chatId,
      [
        "✅ <b>Telegram Linked Successfully!</b>",
        "",
        "Your chat ID has been saved. You'll now receive deadline reminders here.",
        "",
        "🕐 <b>Next steps:</b>",
        "1. Go to ClauseWall → analyze a contract",
        "2. Activate the Time Bomb Defuser",
        "3. Enable Telegram reminders in settings",
        "",
        "Use /deadlines to check your upcoming deadlines.",
      ].join("\n")
    );
  } catch (error) {
    console.error("[Bot] Link error:", error);
    await sendMessage(
      chatId,
      "❌ Failed to link account. Please try again later."
    );
  }
}

// ---- TIMEBOMB: /deadlines ----

async function handleDeadlines(chatId: number) {
  try {
    const supabase = createAdminClient();

    // Find user by telegram chat ID
    const { data: settings } = await supabase
      .from("deadline_reminder_settings")
      .select("user_id")
      .eq("telegram_chat_id", String(chatId))
      .single();

    if (!settings?.user_id) {
      await sendMessage(
        chatId,
        [
          "⚠️ <b>Account not linked</b>",
          "",
          "Send /link first to connect your Telegram account to ClauseWall.",
        ].join("\n")
      );
      return;
    }

    // Fetch upcoming deadlines
    const { data: deadlines } = await supabase
      .from("contract_deadlines")
      .select("*")
      .eq("user_id", settings.user_id)
      .in("status", ["upcoming", "warning", "urgent"])
      .order("deadline_date", { ascending: true })
      .limit(10);

    if (!deadlines || deadlines.length === 0) {
      await sendMessage(
        chatId,
        [
          "🎉 <b>No upcoming deadlines!</b>",
          "",
          "You have no active contract deadlines. Upload a contract to ClauseWall and activate the Time Bomb Defuser.",
        ].join("\n")
      );
      return;
    }

    const lines = ["🕐 <b>Your Upcoming Deadlines</b>", ""];

    for (const d of deadlines) {
      const daysUntil = Math.ceil(
        (new Date(d.deadline_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      );
      const emoji =
        daysUntil <= 3
          ? "🔴"
          : daysUntil <= 7
            ? "🟠"
            : daysUntil <= 30
              ? "🟡"
              : "🔵";

      lines.push(
        `${emoji} <b>${escapeHtml(d.title)}</b>`,
        `   ⏰ ${daysUntil <= 0 ? "OVERDUE" : `${daysUntil} days`} • ${new Date(d.deadline_date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}`,
        ""
      );
    }

    lines.push(
      `📊 Total: ${deadlines.length} active deadline${deadlines.length !== 1 ? "s" : ""}`,
      "",
      "🔗 <a href=\"https://clause-wall.vercel.app/dashboard\">View all on ClauseWall</a>"
    );

    await sendMessage(chatId, lines.join("\n"));
  } catch (error) {
    console.error("[Bot] Deadlines error:", error);
    await sendMessage(
      chatId,
      "❌ Failed to fetch deadlines. Please try again."
    );
  }
}