import { NextRequest, NextResponse } from 'next/server';
import { getBenchmarksByType, getBenchmarksByScope } from '@/lib/market/benchmarks';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const benchmarkType = searchParams.get('type');
    const scopeType = searchParams.get('scope_type');
    const scopeValue = searchParams.get('scope_value');
    const documentType = searchParams.get('document_type') || undefined;
    const sufficientOnly = searchParams.get('sufficient_only') === 'true';
    const limit = parseInt(searchParams.get('limit') || '50');

    let benchmarks;

    if (scopeType && scopeValue) {
      benchmarks = await getBenchmarksByScope(scopeType, scopeValue, documentType);
    } else if (benchmarkType) {
      benchmarks = await getBenchmarksByType(benchmarkType, {
        document_type: documentType,
        scope_type: scopeType || undefined,
        is_sufficient: sufficientOnly || undefined,
        limit,
      });
    } else {
      // Return all benchmarks (with limit)
      benchmarks = await getBenchmarksByType('security_deposit', { limit: 10 });
    }

    const response = NextResponse.json({
      success: true,
      benchmarks,
      count: benchmarks.length,
    });

    // Cache for 1 hour, stale-while-revalidate for 24 hours
    response.headers.set('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');

    return response;
  } catch (error) {
    console.error('[API] Benchmarks fetch error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch benchmarks' },
      { status: 500 }
    );
  }
}
