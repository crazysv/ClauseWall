import { NextRequest, NextResponse } from "next/server";
import { generateMarketNarrative } from "@/lib/market/narrative";
import { getBenchmark } from "@/lib/market/benchmarks";
import { sanitizeDisplayText } from "@/lib/sanitize";
import { rateLimit, rateLimitResponse } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  try {
    const rl = await rateLimit(request, "AI_MEDIUM");
    if (!rl.success) return rateLimitResponse(rl);

    const body = await request.json();
    const {
      benchmark_id,
      benchmark_type,
      scope_type,
      scope_value,
      document_type,
      context,
    } = body;

    let benchmark;

    if (benchmark_id) {
      // Direct lookup — not available in our simple CRUD, so query
      const { createClient } = await import("@/lib/supabase/server");
      const supabase = await createClient();
      const { data } = await supabase
        .from("market_benchmarks")
        .select("*")
        .eq("id", benchmark_id)
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
      return NextResponse.json(
        { success: false, error: "Benchmark not found" },
        { status: 404 },
      );
    }

    const safeContext = context ? sanitizeDisplayText(context, 1000) : undefined;
    const narrative = await generateMarketNarrative(benchmark, null, safeContext);

    return NextResponse.json({
      success: true,
      narrative,
      benchmark_type: benchmark.benchmark_type,
      scope_used: `${benchmark.scope_type}:${benchmark.scope_value}`,
    });
  } catch (error) {
    console.error("[API] Narrative error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to generate narrative" },
      { status: 500 },
    );
  }
}
