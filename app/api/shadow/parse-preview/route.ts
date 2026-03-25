// ============================================
// SHADOW EVIDENCE — PARSE PREVIEW
// Quick preview of evidence parsing (no Groq)
// ============================================

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { parseWhatsAppExport, parseWhatsAppZip } from '@/lib/shadow/parsers/whatsapp-parser';
import { parseEmailText, parseEmlFile } from '@/lib/shadow/parsers/email-parser';
import { parseGenericText } from '@/lib/shadow/parsers/text-parser';
import type { EvidenceType, EvidenceFormat } from '@/types';

const FORMAT_MAP: Record<string, EvidenceFormat> = {
  'text/plain': 'txt',
  'application/zip': 'zip',
  'message/rfc822': 'eml',
  'image/jpeg': 'image',
  'image/png': 'image',
  'audio/mpeg': 'audio',
  'audio/wav': 'audio',
  'audio/ogg': 'audio',
  'audio/webm': 'audio',
};

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const text = formData.get('text') as string | null;
    const type = (formData.get('type') as EvidenceType) || 'other_text';

    let textPreview = '';
    let messageCount: number | undefined;
    let participants: string[] | undefined;
    let wordCount = 0;

    if (file) {
      const mimeType = file.type || '';
      const format = FORMAT_MAP[mimeType] || 'text';

      if (type === 'whatsapp_chat') {
        if (format === 'zip') {
          const buffer = await file.arrayBuffer();
          const chat = await parseWhatsAppZip(buffer);
          textPreview = chat.messages
            .filter(m => !m.is_system)
            .slice(0, 5)
            .map(m => `${m.sender}: ${m.message.substring(0, 100)}`)
            .join('\n');
          messageCount = chat.message_count;
          participants = chat.participants;
          wordCount = chat.messages.reduce((acc, m) => acc + m.message.split(/\s+/).length, 0);
        } else {
          const content = await file.text();
          const chat = parseWhatsAppExport(content);
          textPreview = chat.messages
            .filter(m => !m.is_system)
            .slice(0, 5)
            .map(m => `${m.sender}: ${m.message.substring(0, 100)}`)
            .join('\n');
          messageCount = chat.message_count;
          participants = chat.participants;
          wordCount = chat.messages.reduce((acc, m) => acc + m.message.split(/\s+/).length, 0);
        }
      } else if (type === 'email') {
        const content = await file.text();
        const parsed = format === 'eml' ? parseEmlFile(content) : parseEmailText(content);
        textPreview = [
          parsed.from ? `From: ${parsed.from}` : '',
          parsed.subject ? `Subject: ${parsed.subject}` : '',
          parsed.body.substring(0, 300),
        ].filter(Boolean).join('\n');
        wordCount = parsed.body.split(/\s+/).length;
      } else if (['image', 'audio'].includes(format)) {
        // For images/audio, just return file info — no OCR/transcription in preview
        textPreview = `[${file.name} — ${(file.size / 1024).toFixed(0)}KB — will be processed during analysis]`;
        wordCount = 0;
      } else {
        const content = await file.text();
        const parsed = parseGenericText(content, type);
        textPreview = parsed.cleanedText.substring(0, 500);
        wordCount = parsed.metadata.word_count || 0;
      }
    } else if (text) {
      if (type === 'whatsapp_chat') {
        const chat = parseWhatsAppExport(text);
        textPreview = chat.messages
          .filter(m => !m.is_system)
          .slice(0, 5)
          .map(m => `${m.sender}: ${m.message.substring(0, 100)}`)
          .join('\n');
        messageCount = chat.message_count;
        participants = chat.participants;
        wordCount = chat.messages.reduce((acc, m) => acc + m.message.split(/\s+/).length, 0);
      } else if (type === 'email') {
        const parsed = parseEmailText(text);
        textPreview = parsed.body.substring(0, 500);
        wordCount = parsed.body.split(/\s+/).length;
      } else {
        const parsed = parseGenericText(text, type);
        textPreview = parsed.cleanedText.substring(0, 500);
        wordCount = parsed.metadata.word_count || 0;
      }
    } else {
      return NextResponse.json({ error: 'No file or text provided' }, { status: 400 });
    }

    return NextResponse.json({
      text_preview: textPreview.substring(0, 500),
      metadata: {
        word_count: wordCount,
        message_count: messageCount,
        participant_count: participants?.length,
      },
      participants,
    });
  } catch (error: unknown) {
    console.error('[ClauseWall] Parse preview error:', error);
    const message = error instanceof Error ? error.message : 'Parse preview failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
