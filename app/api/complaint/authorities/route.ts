// GET /api/complaint/authorities?state=MH&type=consumer_forum_district

import { NextRequest, NextResponse } from 'next/server';
import { getAuthoritiesByType, getAuthoritiesByState, AUTHORITIES } from '@/lib/complaint';
import type { AuthorityType } from '@/types';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const state = searchParams.get('state');
    const type = searchParams.get('type') as AuthorityType | null;

    let results = AUTHORITIES;

    if (state) {
      results = getAuthoritiesByState(state);
    }
    if (type) {
      results = results.filter(a => a.type === type);
    }

    return NextResponse.json({ authorities: results, total: results.length });
  } catch (error) {
    console.error('[ClauseWall] Authorities error:', error);
    return NextResponse.json({ error: 'Failed to fetch authorities' }, { status: 500 });
  }
}
