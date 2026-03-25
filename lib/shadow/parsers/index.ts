// ============================================
// PARSER ORCHESTRATOR
// Routes evidence to the appropriate parser
// Returns structured EvidenceSource
// ============================================

import type { EvidenceType, EvidenceFormat, EvidenceSource, EvidenceMetadata } from '@/types';
import { parseWhatsAppExport, parseWhatsAppZip } from './whatsapp-parser';
import { parseEmailText, parseEmlFile } from './email-parser';
import { extractTextFromImage } from './image-parser';
import { transcribeAudioEvidence } from './audio-parser';
import { parseGenericText } from './text-parser';

/**
 * Generate a unique ID for evidence sources
 */
function generateEvidenceId(): string {
  return `ev_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Parse evidence content and return structured EvidenceSource
 */
export async function parseEvidence(
  content: string | ArrayBuffer,
  type: EvidenceType,
  format: EvidenceFormat,
  filename?: string
): Promise<EvidenceSource> {
  const startTime = Date.now();
  const id = generateEvidenceId();

  let rawText = '';
  let metadata: Partial<EvidenceMetadata> = {};
  let partiesDetected: string[] = [];
  let dateRange: { earliest: string | null; latest: string | null } = {
    earliest: null,
    latest: null,
  };

  try {
    // Route to appropriate parser
    switch (type) {
      case 'whatsapp_chat': {
        if (format === 'zip' && content instanceof ArrayBuffer) {
          const chat = await parseWhatsAppZip(content);
          rawText = chat.messages
            .filter(m => !m.is_system && !m.is_media)
            .map(m => `[${m.date} ${m.time}] ${m.sender}: ${m.message}`)
            .join('\n');
          partiesDetected = chat.participants;
          dateRange = {
            earliest: chat.date_range.start || null,
            latest: chat.date_range.end || null,
          };
          metadata = {
            message_count: chat.message_count,
            participant_count: chat.participants.length,
            word_count: rawText.split(/\s+/).length,
          };
        } else {
          const text = typeof content === 'string' ? content : new TextDecoder().decode(content);
          const chat = parseWhatsAppExport(text);
          rawText = chat.messages
            .filter(m => !m.is_system && !m.is_media)
            .map(m => `[${m.date} ${m.time}] ${m.sender}: ${m.message}`)
            .join('\n');
          partiesDetected = chat.participants;
          dateRange = {
            earliest: chat.date_range.start || null,
            latest: chat.date_range.end || null,
          };
          metadata = {
            message_count: chat.message_count,
            participant_count: chat.participants.length,
            word_count: rawText.split(/\s+/).length,
          };
        }
        break;
      }

      case 'email': {
        const text = typeof content === 'string' ? content : new TextDecoder().decode(content);
        if (format === 'eml') {
          const parsed = parseEmlFile(text);
          rawText = [
            parsed.from ? `From: ${parsed.from}` : '',
            parsed.to ? `To: ${parsed.to}` : '',
            parsed.date ? `Date: ${parsed.date}` : '',
            parsed.subject ? `Subject: ${parsed.subject}` : '',
            '',
            parsed.body,
          ].filter(Boolean).join('\n');
          if (parsed.from) partiesDetected.push(parsed.from);
          if (parsed.to) partiesDetected.push(parsed.to);
          if (parsed.date) dateRange.earliest = parsed.date;
        } else {
          const parsed = parseEmailText(text);
          rawText = [
            parsed.from ? `From: ${parsed.from}` : '',
            parsed.to ? `To: ${parsed.to}` : '',
            parsed.date ? `Date: ${parsed.date}` : '',
            parsed.subject ? `Subject: ${parsed.subject}` : '',
            '',
            parsed.body,
          ].filter(Boolean).join('\n');
          if (parsed.from) partiesDetected.push(parsed.from);
          if (parsed.to) partiesDetected.push(parsed.to);
          if (parsed.date) dateRange.earliest = parsed.date;
        }
        metadata = { word_count: rawText.split(/\s+/).length };
        break;
      }

      case 'sms_screenshot':
      case 'handwritten_note':
      case 'property_listing': {
        if (format === 'image' && content instanceof ArrayBuffer) {
          const ocrType = type === 'sms_screenshot' ? 'sms_screenshot'
            : type === 'handwritten_note' ? 'handwritten_note'
            : 'property_listing';
          const result = await extractTextFromImage(content, ocrType);
          rawText = result.text;
          metadata = {
            word_count: rawText.split(/\s+/).length,
            ocr_confidence: result.confidence,
          };
        } else {
          const text = typeof content === 'string' ? content : new TextDecoder().decode(content);
          const parsed = parseGenericText(text, type);
          rawText = parsed.cleanedText;
          metadata = parsed.metadata;
        }
        break;
      }

      case 'audio_recording': {
        if (content instanceof ArrayBuffer) {
          const ext = filename?.split('.').pop() || 'mp3';
          const result = await transcribeAudioEvidence(content, ext);
          rawText = result.text;
          metadata = {
            word_count: rawText.split(/\s+/).length,
            transcription_confidence: result.confidence,
          };
        } else {
          rawText = content;
          metadata = { word_count: rawText.split(/\s+/).length };
        }
        break;
      }

      case 'job_posting':
      case 'broker_message':
      case 'other_text':
      default: {
        const text = typeof content === 'string' ? content : new TextDecoder().decode(content);
        const parsed = parseGenericText(text, type);
        rawText = parsed.cleanedText;
        metadata = parsed.metadata;
        break;
      }
    }
  } catch (error) {
    console.error(`[ClauseWall] Evidence parsing failed for type=${type}:`, error);
    // Return partial result with raw content
    if (typeof content === 'string') {
      rawText = content;
    }
    metadata = {
      word_count: rawText.split(/\s+/).length,
    };
  }

  const processingTime = Date.now() - startTime;

  return {
    id,
    type,
    format,
    filename: filename || null,
    raw_text: rawText,
    parsed_date_range: dateRange,
    parties_detected: partiesDetected,
    storage_url: null,
    metadata: {
      ...metadata,
      word_count: metadata.word_count || rawText.split(/\s+/).length,
      processing_time_ms: processingTime,
    } as EvidenceMetadata,
  };
}
