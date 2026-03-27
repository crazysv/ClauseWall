import { NextResponse } from 'next/server';
import { getGeographicRiskData } from '@/lib/market/geographic';

export async function GET() {
  try {
    const data = await getGeographicRiskData();

    const response = NextResponse.json({
      success: true,
      ...data,
    });

    response.headers.set('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');

    return response;
  } catch (error) {
    console.error('[API] Geographic data error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch geographic data' },
      { status: 500 }
    );
  }
}
