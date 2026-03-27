import { NextRequest, NextResponse } from 'next/server';
import { compareDocumentToMarket, compareClauseToMarket } from '@/lib/market/comparator';
import type { MarketCompareRequest } from '@/types/market';

export async function POST(request: NextRequest) {
  try {
    const body: MarketCompareRequest = await request.json();

    // Document-level comparison
    if (body.document_id) {
      const comparisons = await compareDocumentToMarket(body.document_id);
      return NextResponse.json({
        success: true,
        comparisons,
        document_type: body.document_type,
        total_benchmarks_found: comparisons.filter(c => c.has_data).length,
      });
    }

    // Individual clause comparisons
    if (body.clauses && body.clauses.length > 0) {
      const results = await Promise.all(
        body.clauses.map(async (clause) => {
          const comparison = await compareClauseToMarket({
            value: clause.value,
            unit: clause.unit,
            clause_type: clause.clause_type,
            document_type: body.document_type,
            jurisdiction: body.jurisdiction,
            city: body.city,
          });

          return {
            clause_id: clause.clause_id,
            comparison,
            benchmark: comparison?.benchmark || null,
            has_data: !!comparison,
            sample_count: comparison?.benchmark.sample_count || 0,
            data_quality: comparison
              ? comparison.benchmark.id.startsWith('seed-')
                ? 'seed' as const
                : comparison.benchmark.is_sufficient
                  ? 'sufficient' as const
                  : 'partial' as const
              : 'none' as const,
          };
        })
      );

      return NextResponse.json({
        success: true,
        comparisons: results,
        document_type: body.document_type,
        total_benchmarks_found: results.filter(c => c.has_data).length,
      });
    }

    return NextResponse.json({ success: false, error: 'Provide document_id or clauses' }, { status: 400 });
  } catch (error) {
    console.error('[API] Market compare error:', error);
    return NextResponse.json(
      { success: false, error: 'Market comparison failed' },
      { status: 500 }
    );
  }
}
