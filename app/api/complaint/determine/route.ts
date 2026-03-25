// POST /api/complaint/determine
// Determine which authority to file with

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { determineAuthority } from '@/lib/complaint';
import type { JurisdictionInput } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { documentId, claimAmount, district, respondentType } = body;

    if (!documentId) {
      return NextResponse.json({ error: 'Missing documentId' }, { status: 400 });
    }

    // Fetch document and clauses
    const { data: doc } = await supabase
      .from('documents')
      .select('*')
      .eq('id', documentId)
      .single();

    if (!doc) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    const { data: clauses } = await supabase
      .from('clauses')
      .select('clause_type, risk_level')
      .eq('document_id', documentId);

    const input: JurisdictionInput = {
      document_type: doc.document_type || 'other',
      jurisdiction: doc.jurisdiction || 'pan_india',
      district: district || null,
      clause_types: (clauses || []).map((c: { clause_type: string }) => c.clause_type),
      risk_levels: (clauses || []).map((c: { risk_level: string }) => c.risk_level),
      claim_amount: claimAmount || null,
      respondent_type: respondentType || doc.entity_name || null,
      contract_date: doc.created_at ? doc.created_at.split('T')[0] : null,
    };

    const result = determineAuthority(input);

    return NextResponse.json(result);
  } catch (error) {
    console.error('[ClauseWall] Complaint determine error:', error);
    return NextResponse.json({ error: 'Failed to determine authority' }, { status: 500 });
  }
}
