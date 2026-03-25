// GET/PUT /api/complaint/[filingId]

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getFiling, updateFiling, updateFilingStatus, addHearingRecord } from '@/lib/complaint';
import type { ComplaintStatus, HearingRecord } from '@/types';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ filingId: string }> }
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { filingId } = await params;
    const filing = await getFiling(filingId, user.id);

    if (!filing) return NextResponse.json({ error: 'Filing not found' }, { status: 404 });
    return NextResponse.json(filing);
  } catch (error) {
    console.error('[ClauseWall] Get filing error:', error);
    return NextResponse.json({ error: 'Failed to get filing' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ filingId: string }> }
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { filingId } = await params;
    const body = await request.json();

    // Status update
    if (body.action === 'update_status') {
      const success = await updateFilingStatus(filingId, user.id, body.status as ComplaintStatus, {
        case_number: body.case_number,
        filing_date: body.filing_date,
        next_hearing_date: body.next_hearing_date,
        notes: body.notes,
      });
      return NextResponse.json({ success });
    }

    // Add hearing record
    if (body.action === 'add_hearing') {
      const hearing: HearingRecord = {
        date: body.date,
        type: body.type || 'hearing',
        summary: body.summary || null,
        next_date: body.next_date || null,
        documents_needed: body.documents_needed || [],
        outcome: body.outcome || null,
      };
      const success = await addHearingRecord(filingId, user.id, hearing);
      return NextResponse.json({ success });
    }

    // General update
    const updated = await updateFiling(filingId, user.id, body);
    if (!updated) return NextResponse.json({ error: 'Update failed' }, { status: 400 });
    return NextResponse.json(updated);
  } catch (error) {
    console.error('[ClauseWall] Update filing error:', error);
    return NextResponse.json({ error: 'Failed to update filing' }, { status: 500 });
  }
}
