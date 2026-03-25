// ============================================
// SHADOW ANALYSIS — GET BY DOCUMENT ID
// Returns existing shadow analysis for a document
// ============================================

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ documentId: string }> }
) {
  try {
    const { documentId } = await params;
    const supabase = await createClient();

    // Authenticate
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch shadow analysis
    const { data, error } = await supabase
      .from('shadow_analyses')
      .select('*')
      .eq('document_id', documentId)
      .eq('user_id', user.id)
      .single();

    if (error) {
      // No analysis found — not an error
      if (error.code === 'PGRST116') {
        return NextResponse.json({ analysis: null });
      }
      throw error;
    }

    return NextResponse.json({ analysis: data });
  } catch (error: unknown) {
    console.error('[ClauseWall] Shadow GET error:', error);
    const message = error instanceof Error ? error.message : 'Failed to fetch shadow analysis';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
