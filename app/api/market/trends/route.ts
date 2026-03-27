import { NextRequest, NextResponse } from 'next/server';
import { getRecentTrends, getTrendDataPoints } from '@/lib/market/trends';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const benchmarkId = searchParams.get('benchmark_id');
    const significantOnly = searchParams.get('significant_only') === 'true';
    const alertsOnly = searchParams.get('alerts_only') === 'true';
    const limit = parseInt(searchParams.get('limit') || '20');

    // If benchmark_id provided, return data points for charting
    if (benchmarkId) {
      const dataPoints = await getTrendDataPoints(benchmarkId);
      const response = NextResponse.json({
        success: true,
        data_points: dataPoints,
        benchmark_id: benchmarkId,
      });
      response.headers.set('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');
      return response;
    }

    // Otherwise return recent trends
    const trends = await getRecentTrends({
      limit,
      significant_only: significantOnly,
      alerts_only: alertsOnly,
    });

    const response = NextResponse.json({
      success: true,
      trends,
      count: trends.length,
    });

    response.headers.set('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');

    return response;
  } catch (error) {
    console.error('[API] Trends error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch trends' },
      { status: 500 }
    );
  }
}
