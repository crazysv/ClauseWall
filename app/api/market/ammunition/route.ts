import { NextRequest, NextResponse } from 'next/server';
import { generateAmmunitionReport } from '@/lib/market/ammunition';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { document_id, clause_ids, target_audience } = body;

    if (!document_id) {
      return NextResponse.json({ success: false, error: 'document_id required' }, { status: 400 });
    }

    const report = await generateAmmunitionReport(
      document_id,
      target_audience || 'counterparty',
      clause_ids
    );

    return NextResponse.json({
      success: true,
      report,
    });
  } catch (error) {
    console.error('[API] Ammunition error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to generate ammunition report' },
      { status: 500 }
    );
  }
}
