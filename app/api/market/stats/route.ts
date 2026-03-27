import { NextResponse } from 'next/server';
import { getPlatformStats } from '@/lib/market/benchmarks';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = await createClient();

    // Parallel queries for stats
    const [
      benchmarkStats,
      { count: totalAnalyzed },
      { count: totalClauses },
    ] = await Promise.all([
      getPlatformStats(),
      supabase.from('documents').select('*', { count: 'exact', head: true }).eq('analysis_status', 'completed'),
      supabase.from('clauses').select('*', { count: 'exact', head: true }),
    ]);

    // Get unique jurisdiction count
    const { data: jurisdictions } = await supabase
      .from('documents')
      .select('jurisdiction')
      .eq('analysis_status', 'completed')
      .not('jurisdiction', 'is', null);

    const uniqueJurisdictions = new Set(jurisdictions?.map(j => j.jurisdiction) || []);

    // Get unique document types
    const { data: docTypes } = await supabase
      .from('documents')
      .select('document_type')
      .eq('analysis_status', 'completed')
      .not('document_type', 'is', null);

    const uniqueDocTypes = new Set(docTypes?.map(d => d.document_type) || []);

    // Get unique entities
    const { data: entities } = await supabase
      .from('documents')
      .select('entity_name')
      .eq('analysis_status', 'completed')
      .not('entity_name', 'is', null)
      .not('entity_name', 'eq', '');

    const uniqueEntities = new Set(entities?.map(e => e.entity_name) || []);

    const response = NextResponse.json({
      success: true,
      stats: {
        total_analyzed: totalAnalyzed || 0,
        total_clauses: totalClauses || 0,
        jurisdictions_covered: uniqueJurisdictions.size,
        contract_types_covered: uniqueDocTypes.size,
        cities_covered: 0,
        entities_tracked: uniqueEntities.size,
        ...benchmarkStats,
      },
    });

    response.headers.set('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');

    return response;
  } catch (error) {
    console.error('[API] Stats error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch stats' },
      { status: 500 }
    );
  }
}
