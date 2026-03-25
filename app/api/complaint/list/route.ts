// GET /api/complaint/list?documentId=X

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { listFilings } from '@/lib/complaint';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const documentId = searchParams.get('documentId') || undefined;

    const filings = await listFilings(user.id, documentId);
    return NextResponse.json({ filings });
  } catch (error) {
    console.error('[ClauseWall] List filings error:', error);
    return NextResponse.json({ error: 'Failed to list filings' }, { status: 500 });
  }
}
