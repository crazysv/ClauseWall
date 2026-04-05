import { NextRequest, NextResponse } from "next/server";
import { recomputeAllBenchmarks } from "@/lib/market/aggregator";
import { detectTrends } from "@/lib/market/trends";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const adminKey = body.admin_key;

    // Require a dedicated admin key — never fall back to public keys
    const expectedKey = process.env.MARKET_ADMIN_KEY;
    if (!expectedKey) {
      console.error("[Market] MARKET_ADMIN_KEY is not configured");
      return NextResponse.json(
        { success: false, error: "Server misconfiguration" },
        { status: 500 },
      );
    }
    if (!adminKey || adminKey !== expectedKey) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    console.log("[Market] Admin triggered full recomputation");

    // Step 1: Full recomputation
    const result = await recomputeAllBenchmarks();

    // Step 2: Detect trends
    let trendsDetected = 0;
    if (result.benchmarks_computed > 0) {
      try {
        const trends = await detectTrends();
        trendsDetected = trends.length;
      } catch (err) {
        console.error("[Market] Trend detection failed:", err);
      }
    }

    return NextResponse.json({
      success: true,
      ...result,
      trends_detected: trendsDetected,
    });
  } catch (error) {
    console.error("[API] Benchmark compute error:", error);
    return NextResponse.json(
      { success: false, error: "Computation failed" },
      { status: 500 },
    );
  }
}
