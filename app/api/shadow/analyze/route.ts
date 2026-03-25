// ============================================
// SHADOW ANALYSIS — MAIN API ENDPOINT
// POST: Run shadow analysis on evidence
// ============================================

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { analyzeShadowAgreement } from '@/lib/shadow/shadow-engine';
import type { EvidenceType, EvidenceFormat } from '@/types';

export const maxDuration = 300; // 5 minutes for Vercel Pro

const FORMAT_MAP: Record<string, EvidenceFormat> = {
  'text/plain': 'txt',
  'text/csv': 'txt',
  'application/zip': 'zip',
  'image/jpeg': 'image',
  'image/png': 'image',
  'image/webp': 'image',
  'audio/mpeg': 'audio',
  'audio/mp3': 'audio',
  'audio/wav': 'audio',
  'audio/ogg': 'audio',
  'audio/webm': 'audio',
  'audio/m4a': 'audio',
  'message/rfc822': 'eml',
  'application/pdf': 'pdf',
};

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();

    // Authenticate
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse FormData
    const formData = await req.formData();
    const documentId = formData.get('document_id') as string;

    if (!documentId) {
      return NextResponse.json({ error: 'document_id is required' }, { status: 400 });
    }

    // Verify document ownership
    const { data: doc } = await supabase
      .from('documents')
      .select('id, user_id, analysis_status')
      .eq('id', documentId)
      .single();

    if (!doc) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    if (doc.analysis_status !== 'completed') {
      return NextResponse.json({ error: 'Document must be fully analyzed first' }, { status: 400 });
    }

    // Collect evidence from FormData
    const evidence: Array<{
      type: EvidenceType;
      format: EvidenceFormat;
      content: string | ArrayBuffer;
      filename?: string;
    }> = [];

    // Handle file uploads
    const files = formData.getAll('evidence[]') as File[];
    const types = formData.getAll('evidence_types[]') as string[];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!file || !(file instanceof File)) continue;

      const type = (types[i] || 'other_text') as EvidenceType;
      const mimeType = file.type || '';
      const format = FORMAT_MAP[mimeType] || 'text';

      let content: string | ArrayBuffer;
      if (['image', 'audio', 'zip', 'pdf'].includes(format)) {
        content = await file.arrayBuffer();
      } else {
        content = await file.text();
      }

      evidence.push({
        type,
        format,
        content,
        filename: file.name,
      });
    }

    // Handle pasted text evidence
    const textEvidence = formData.get('evidence_text') as string;
    const textType = (formData.get('evidence_text_type') as EvidenceType) || 'other_text';

    if (textEvidence && textEvidence.trim().length > 0) {
      evidence.push({
        type: textType,
        format: 'text',
        content: textEvidence,
      });
    }

    if (evidence.length === 0) {
      return NextResponse.json({ error: 'No evidence provided' }, { status: 400 });
    }

    // Limit evidence sources
    if (evidence.length > 5) {
      return NextResponse.json(
        { error: 'Maximum 5 evidence sources allowed per analysis' },
        { status: 400 }
      );
    }

    // Run analysis
    const result = await analyzeShadowAgreement(
      { document_id: documentId, evidence },
      user.id
    );

    return NextResponse.json(result);
  } catch (error: unknown) {
    console.error('[ClauseWall] Shadow analysis API error:', error);
    const message = error instanceof Error ? error.message : 'Shadow analysis failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
