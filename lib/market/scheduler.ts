// ============================================
// SCHEDULER — Recomputation timing logic
// ============================================

import { createClient } from '@/lib/supabase/server';

const RECOMPUTE_INTERVAL_HOURS = 24; // Full recompute every 24 hours

/**
 * Check if a full benchmark recomputation should be triggered
 */
export async function shouldRecompute(): Promise<boolean> {
  const supabase = await createClient();

  const { data } = await supabase
    .from('market_benchmarks')
    .select('last_computed_at')
    .order('last_computed_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!data?.last_computed_at) return true; // Never computed

  const lastComputed = new Date(data.last_computed_at).getTime();
  const now = Date.now();
  const hoursSince = (now - lastComputed) / (1000 * 60 * 60);

  return hoursSince >= RECOMPUTE_INTERVAL_HOURS;
}

/**
 * Check if any documents have been analyzed since last computation
 */
export async function hasNewData(): Promise<boolean> {
  const supabase = await createClient();

  // Get last computation time
  const { data: lastBenchmark } = await supabase
    .from('market_benchmarks')
    .select('last_computed_at')
    .order('last_computed_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!lastBenchmark?.last_computed_at) return true;

  // Check for documents analyzed after last computation
  const { count } = await supabase
    .from('documents')
    .select('*', { count: 'exact', head: true })
    .eq('analysis_status', 'completed')
    .gt('updated_at', lastBenchmark.last_computed_at);

  return (count || 0) > 0;
}
