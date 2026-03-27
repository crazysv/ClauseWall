import { NextRequest, NextResponse } from 'next/server';
import { generateMarketNarrative } from '@/lib/market/narrative';
import { getBenchmark } from '@/lib/market/benchmarks';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { benchmark_id, benchmark_type, scope_type, scope_value, document_type, context } = body;

    let benchmark;

    if (benchmark_id) {
      // Direct lookup — not available in our simple CRUD, so query
      const { createClient } = await import('@/lib/supabase/server');
      const supabase = await createClient();
      const { data } = await supabase
        .from('market_benchmarks')
        .select('*')
        .eq('id', benchmark_id)
        .single();
      benchmark = data;
    } else if (benchmark_type) {
      benchmark = await getBenchmark({
        benchmark_type,
        scope_type,
        scope_value,
        document_type,
      });
    }

    if (!benchmark) {
      return NextResponse.json({ success: false, error: 'Benchmark not found' }, { status: 404 });
    }

    const narrative = await generateMarketNarrative(benchmark, null, context);

    return NextResponse.json({
      success: true,
      narrative,
      benchmark_type: benchmark.benchmark_type,
      scope_used: `${benchmark.scope_type}:${benchmark.scope_value}`,
    });
  } catch (error) {
    console.error('[API] Narrative error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to generate narrative' },
      { status: 500 }
    );
  }
}
