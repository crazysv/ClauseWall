// ============================================
// TELEGRAM BOT API CLIENT
// Raw fetch — no npm package needed
// ============================================

const BASE_URL = "https://api.telegram.org/bot";

function getToken(): string {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) throw new Error("TELEGRAM_BOT_TOKEN not configured");
  return token;
}

/**
 * Send a text message to a Telegram chat
 */
export async function sendMessage(
  chatId: number,
  text: string,
  parseMode: "HTML" | "MarkdownV2" = "HTML"
): Promise<void> {
  const token = getToken();

  const response = await fetch(`${BASE_URL}${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: parseMode,
      disable_web_page_preview: true,
    }),
  });

  const data = await response.json();

  // If HTML parsing fails, retry without formatting
  if (!data.ok && data.description?.includes("parse")) {
    await fetch(`${BASE_URL}${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: text.replace(/<[^>]*>/g, ""),
        disable_web_page_preview: true,
      }),
    });
  }
}

/**
 * Show "typing..." indicator in chat
 */
export async function sendChatAction(chatId: number): Promise<void> {
  const token = getToken();
  await fetch(`${BASE_URL}${token}/sendChatAction`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, action: "typing" }),
  }).catch(() => {}); // Fire and forget
}

/**
 * Download a file from Telegram servers
 */
export async function downloadFile(fileId: string): Promise<Buffer> {
  const token = getToken();

  // Step 1: Get file path
  const fileResponse = await fetch(`${BASE_URL}${token}/getFile`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ file_id: fileId }),
  });

  const fileData = await fileResponse.json();
  if (!fileData.ok) throw new Error(`getFile failed: ${fileData.description}`);

  // Step 2: Download the file
  const fileUrl = `https://api.telegram.org/file/bot${token}/${fileData.result.file_path}`;
  const downloadResponse = await fetch(fileUrl);

  if (!downloadResponse.ok) throw new Error(`Download failed: ${downloadResponse.status}`);

  const arrayBuffer = await downloadResponse.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

/**
 * Register webhook URL with Telegram
 */
export async function setWebhook(url: string): Promise<any> {
  const token = getToken();
  const response = await fetch(`${BASE_URL}${token}/setWebhook`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      url,
      allowed_updates: ["message"],
      drop_pending_updates: true,
    }),
  });
  return response.json();
}

/**
 * Get current webhook status
 */
export async function getWebhookInfo(): Promise<any> {
  const token = getToken();
  const response = await fetch(`${BASE_URL}${token}/getWebhookInfo`);
  return response.json();
}

/**
 * Send a voice message (OGG/Opus) to a Telegram chat
 */
export async function sendVoice(
  chatId: number,
  audioBuffer: Buffer,
  caption?: string
): Promise<void> {
  const token = getToken();

  const uint8 = new Uint8Array(audioBuffer.buffer.slice(audioBuffer.byteOffset, audioBuffer.byteOffset + audioBuffer.byteLength));
  const blob = new Blob([uint8.buffer as ArrayBuffer], { type: "audio/ogg" });

  const formData = new FormData();
  formData.append("chat_id", String(chatId));
  formData.append("voice", blob, "voice.ogg");
  if (caption) {
    formData.append("caption", caption);
  }

  const response = await fetch(`${BASE_URL}${token}/sendVoice`, {
    method: "POST",
    body: formData,
  });

  const data = await response.json();

  if (!data.ok) {
    console.error("[ClauseWall Bot] sendVoice failed:", data.description);
    // Fallback: send text instead
    if (caption) {
      await sendMessage(chatId, caption);
    }
  }
}

/**
 * Show "uploading voice" indicator in chat
 */
export async function sendChatActionUpload(chatId: number): Promise<void> {
  const token = getToken();
  await fetch(`${BASE_URL}${token}/sendChatAction`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, action: "upload_voice" }),
  }).catch(() => {}); // Fire and forget
}