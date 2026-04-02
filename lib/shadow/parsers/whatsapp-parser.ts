// ============================================
// WHATSAPP CHAT EXPORT PARSER
// Handles all known WhatsApp export formats
// Supports .txt files and .zip exports
// ============================================

import type { WhatsAppChat, WhatsAppMessage } from '@/types';

// ---- FORMAT PATTERNS ----
// WhatsApp exports vary by device, locale, and version

const MESSAGE_PATTERNS = [
  // Format 1: DD/MM/YY, h:mm am/pm - Sender: Message
  /^\[?(\d{1,2}\/\d{1,2}\/\d{2,4}),?\s*(\d{1,2}:\d{2}(?::\d{2})?\s*(?:am|pm|AM|PM)?)\]?\s*[-–]\s*(.+?):\s*([\s\S]*)$/,
  // Format 2: MM/DD/YY, h:mm AM/PM - Sender: Message (US format)
  /^\[?(\d{1,2}\/\d{1,2}\/\d{2,4}),?\s*(\d{1,2}:\d{2}(?::\d{2})?\s*(?:AM|PM|am|pm))\]?\s*[-–]\s*(.+?):\s*([\s\S]*)$/,
  // Format 3: [DD/MM/YY, HH:MM:SS] Sender: Message (bracketed)
  /^\[(\d{1,2}\/\d{1,2}\/\d{2,4}),?\s*(\d{1,2}:\d{2}:\d{2}(?:\s*(?:AM|PM|am|pm))?)\]\s*(.+?):\s*([\s\S]*)$/,
  // Format 4: DD/MM/YYYY, HH:MM - Sender: Message (24-hour)
  /^(\d{1,2}\/\d{1,2}\/\d{4}),?\s*(\d{1,2}:\d{2})\s*[-–]\s*(.+?):\s*([\s\S]*)$/,
];

// System message patterns (no sender:message format)
const SYSTEM_PATTERN = /^\[?(\d{1,2}\/\d{1,2}\/\d{2,4}),?\s*(\d{1,2}:\d{2}(?::\d{2})?\s*(?:am|pm|AM|PM)?)\]?\s*[-–]\s*(.+)$/;

const SYSTEM_KEYWORDS = [
  'messages and calls are end-to-end encrypted',
  'changed the subject',
  'changed the group',
  'changed this group',
  'added',
  'removed',
  'left',
  'created group',
  'joined using',
  'security code changed',
  'disappeared',
  'message timer',
  'your security code',
  'you were added',
];

const MEDIA_KEYWORDS = [
  '<media omitted>',
  'image omitted',
  'video omitted',
  'audio omitted',
  'sticker omitted',
  'document omitted',
  'gif omitted',
  'contact card omitted',
  '<attached:',
];

/**
 * Check if a line is a system message
 */
function isSystemMessage(text: string): boolean {
  const lower = text.toLowerCase();
  return SYSTEM_KEYWORDS.some(kw => lower.includes(kw));
}

/**
 * Check if a message is a media placeholder
 */
function isMediaMessage(text: string): boolean {
  const lower = text.toLowerCase();
  return MEDIA_KEYWORDS.some(kw => lower.includes(kw));
}

/**
 * Try to parse a line as a WhatsApp message using all patterns
 */
function tryParseMessageLine(line: string): {
  date: string;
  time: string;
  sender: string;
  message: string;
} | null {
  for (const pattern of MESSAGE_PATTERNS) {
    const match = line.match(pattern);
    if (match) {
      return {
        date: match[1].trim(),
        time: match[2].trim(),
        sender: match[3].trim(),
        message: match[4] || '',
      };
    }
  }
  return null;
}

/**
 * Parse a WhatsApp chat export text file into structured data
 */
export function parseWhatsAppExport(text: string): WhatsAppChat {
  const emptyResult: WhatsAppChat = {
    messages: [],
    participants: [],
    date_range: { start: '', end: '' },
    message_count: 0,
  };

  if (!text || text.trim().length === 0) {
    return emptyResult;
  }

  const lines = text.split('\n');
  const messages: WhatsAppMessage[] = [];
  const participantSet = new Set<string>();
  let currentMessage: WhatsAppMessage | null = null;
  let unparsedCount = 0;

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;

    // Try to parse as a new message
    const parsed = tryParseMessageLine(line);

    if (parsed) {
      // Save previous message if any
      if (currentMessage) {
        messages.push(currentMessage);
      }

      // Check if it's a system message (matches system pattern but not sender:message)
      const isSystem = isSystemMessage(parsed.message) || isSystemMessage(parsed.sender);

      if (isSystem) {
        currentMessage = {
          date: parsed.date,
          time: parsed.time,
          sender: '',
          message: parsed.sender + (parsed.message ? ': ' + parsed.message : ''),
          is_media: false,
          is_system: true,
        };
      } else {
        participantSet.add(parsed.sender);
        currentMessage = {
          date: parsed.date,
          time: parsed.time,
          sender: parsed.sender,
          message: parsed.message,
          is_media: isMediaMessage(parsed.message),
          is_system: false,
        };
      }
    } else {
      // Check if it's a system message without sender
      const sysMatch = line.match(SYSTEM_PATTERN);
      if (sysMatch && isSystemMessage(sysMatch[3])) {
        if (currentMessage) {
          messages.push(currentMessage);
        }
        currentMessage = {
          date: sysMatch[1].trim(),
          time: sysMatch[2].trim(),
          sender: '',
          message: sysMatch[3].trim(),
          is_media: false,
          is_system: true,
        };
      } else if (currentMessage) {
        // Multi-line continuation — append to current message
        currentMessage.message += '\n' + rawLine;
      } else {
        unparsedCount++;
      }
    }
  }

  // Don't forget the last message
  if (currentMessage) {
    messages.push(currentMessage);
  }

  if (unparsedCount > 0) {

  }

  // Filter out system and media messages for the core content
  const realMessages = messages.filter(m => !m.is_system);
  const participants = Array.from(participantSet);

  // Calculate date range
  const dates = realMessages
    .map(m => m.date)
    .filter(Boolean);

  const dateRange = {
    start: dates[0] || '',
    end: dates[dates.length - 1] || '',
  };


  return {
    messages,
    participants,
    date_range: dateRange,
    message_count: realMessages.length,
  };
}

/**
 * Parse a WhatsApp .zip export
 * WhatsApp allows "Export Chat" which creates a .zip containing a .txt file
 */
export async function parseWhatsAppZip(buffer: ArrayBuffer): Promise<WhatsAppChat> {
  try {
    const JSZip = (await import('jszip')).default;
    const zip = await JSZip.loadAsync(buffer);

    // Find the .txt file inside the zip
    let chatText = '';

    for (const [filename, file] of Object.entries(zip.files)) {
      if (filename.endsWith('.txt') && !file.dir) {
        chatText = await file.async('string');
        break;
      }
    }

    if (!chatText) {
      console.warn('[ClauseWall] WhatsApp ZIP: No .txt file found in archive');
      return {
        messages: [],
        participants: [],
        date_range: { start: '', end: '' },
        message_count: 0,
      };
    }

    return parseWhatsAppExport(chatText);
  } catch (error) {
    console.error('[ClauseWall] WhatsApp ZIP parsing failed:', error);
    return {
      messages: [],
      participants: [],
      date_range: { start: '', end: '' },
      message_count: 0,
    };
  }
}
