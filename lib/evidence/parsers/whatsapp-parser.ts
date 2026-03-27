// ============================================
// WHATSAPP EXPORT PARSER
// Parses WhatsApp exported .txt files
// Supports Android + iOS formats
// ============================================

import type { WhatsAppChat, WhatsAppMessage } from "@/types/evidence";

// Android: "DD/MM/YYYY, HH:MM - Sender: Message"
const ANDROID_REGEX = /^(\d{1,2}\/\d{1,2}\/\d{2,4}),\s(\d{1,2}:\d{2})\s?(?:am|pm|AM|PM)?\s?-\s(.+?):\s(.+)/;

// iOS: "[DD/MM/YYYY, HH:MM:SS] Sender: Message"
const IOS_REGEX = /^\[(\d{1,2}\/\d{1,2}\/\d{2,4}),\s(\d{1,2}:\d{2}:\d{2})\]\s(.+?):\s(.+)/;

// System messages (no sender)
const SYSTEM_ANDROID = /^(\d{1,2}\/\d{1,2}\/\d{2,4}),\s(\d{1,2}:\d{2})\s?(?:am|pm|AM|PM)?\s?-\s(.+)/;
const SYSTEM_IOS = /^\[(\d{1,2}\/\d{1,2}\/\d{2,4}),\s(\d{1,2}:\d{2}:\d{2})\]\s(.+)/;

// Media placeholders
const MEDIA_PATTERNS = [
  /<Media omitted>/i,
  /image omitted/i,
  /audio omitted/i,
  /video omitted/i,
  /sticker omitted/i,
  /document omitted/i,
  /GIF omitted/i,
  /Contact card omitted/i,
];

/**
 * Parse a WhatsApp exported text file
 */
export function parseWhatsAppExport(text: string): WhatsAppChat {
  const lines = text.split("\n");
  const messages: WhatsAppMessage[] = [];
  const participantSet = new Set<string>();
  let currentMessage: WhatsAppMessage | null = null;

  for (const line of lines) {
    // Try Android format first
    let match = line.match(ANDROID_REGEX);
    let isIos = false;

    if (!match) {
      match = line.match(IOS_REGEX);
      isIos = true;
    }

    if (match) {
      // Save previous multi-line message
      if (currentMessage) {
        messages.push(currentMessage);
      }

      const [, dateStr, timeStr, sender, text] = match;
      const timestamp = parseDate(dateStr, timeStr, isIos);
      const mediaType = detectMediaType(text);

      participantSet.add(sender);

      currentMessage = {
        sender,
        timestamp: timestamp.toISOString(),
        text: text.trim(),
        media_type: mediaType,
        is_system_message: false,
      };
      continue;
    }

    // Check for system message (Android)
    const sysMatch = line.match(SYSTEM_ANDROID) || line.match(SYSTEM_IOS);
    if (sysMatch && isSystemMessage(sysMatch[3] || sysMatch[2])) {
      if (currentMessage) messages.push(currentMessage);
      currentMessage = {
        sender: "System",
        timestamp: new Date().toISOString(),
        text: (sysMatch[3] || sysMatch[2]).trim(),
        media_type: null,
        is_system_message: true,
      };
      continue;
    }

    // Continuation of previous message (multi-line)
    if (currentMessage && line.trim()) {
      currentMessage.text += "\n" + line.trim();
    }
  }

  // Push last message
  if (currentMessage) messages.push(currentMessage);

  // Filter out system messages for participant count
  const nonSystemMessages = messages.filter((m) => !m.is_system_message);
  const participants = Array.from(participantSet);

  // Determine chat type
  const chatType = participants.length > 2 ? "group" : "individual";

  // Date range
  const dates = nonSystemMessages
    .map((m) => new Date(m.timestamp))
    .filter((d) => !isNaN(d.getTime()))
    .sort((a, b) => a.getTime() - b.getTime());

  const dateRange = {
    start: dates.length > 0 ? dates[0].toISOString() : new Date().toISOString(),
    end: dates.length > 0 ? dates[dates.length - 1].toISOString() : new Date().toISOString(),
  };

  return {
    participants,
    message_count: nonSystemMessages.length,
    date_range: dateRange,
    messages,
    chat_type: chatType,
  };
}

/**
 * Parse date string from WhatsApp export
 */
function parseDate(dateStr: string, timeStr: string, _isIos: boolean): Date {
  const parts = dateStr.split("/");
  if (parts.length !== 3) return new Date();

  let [day, month, year] = parts.map(Number);

  // Handle 2-digit year
  if (year < 100) year += 2000;

  const timeParts = timeStr.split(":").map(Number);
  const hours = timeParts[0] || 0;
  const minutes = timeParts[1] || 0;
  const seconds = timeParts[2] || 0;

  return new Date(year, month - 1, day, hours, minutes, seconds);
}

/**
 * Detect media type from message text
 */
function detectMediaType(text: string): string | null {
  for (const pattern of MEDIA_PATTERNS) {
    if (pattern.test(text)) {
      if (/image/i.test(text)) return "image";
      if (/audio/i.test(text)) return "audio";
      if (/video/i.test(text)) return "video";
      if (/sticker/i.test(text)) return "sticker";
      if (/document/i.test(text)) return "document";
      if (/GIF/i.test(text)) return "gif";
      if (/Contact/i.test(text)) return "contact";
      return "media";
    }
  }
  return null;
}

/**
 * Check if a message is a system message
 */
function isSystemMessage(text: string): boolean {
  const systemPatterns = [
    /Messages and calls are end-to-end encrypted/i,
    /created group/i,
    /added/i,
    /removed/i,
    /left/i,
    /changed the subject/i,
    /changed this group/i,
    /changed the group/i,
    /Your security code/i,
    /joined using this group/i,
  ];
  return systemPatterns.some((p) => p.test(text));
}
