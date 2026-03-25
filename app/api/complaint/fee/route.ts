// GET /api/complaint/fee?authorityType=X&claimAmount=Y&state=Z

import { NextRequest, NextResponse } from 'next/server';
import { calculateFee } from '@/lib/complaint';
import type { AuthorityType } from '@/types';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const authorityType = searchParams.get('authorityType') as AuthorityType;
    const claimAmount = Number(searchParams.get('claimAmount')) || 0;
    const state = searchParams.get('state') || 'pan_india';

    if (!authorityType) {
      return NextResponse.json({ error: 'Missing authorityType' }, { status: 400 });
    }

    const fee = calculateFee(authorityType, claimAmount, state);
    return NextResponse.json(fee);
  } catch (error) {
    console.error('[ClauseWall] Fee calculation error:', error);
    return NextResponse.json({ error: 'Failed to calculate fee' }, { status: 500 });
  }
}
