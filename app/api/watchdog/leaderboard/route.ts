// ============================================
// GET /api/watchdog/leaderboard
// ToS Score leaderboard
// ============================================

import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { MonitoredCompany } from "@/types";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sector = searchParams.get("sector");
    const sortBy = searchParams.get("sort") || "score";
    const order = searchParams.get("order") || "asc";

    const supabase = createAdminClient();

    let query = supabase
      .from("monitored_companies")
      .select("*")
      .eq("is_active", true);

    if (sector && sector !== "all") {
      query = query.eq("sector", sector);
    }

    // Sort
    if (sortBy === "score") {
      query = query.order("current_tos_score", {
        ascending: order === "asc",
        nullsFirst: false,
      });
    } else if (sortBy === "changes") {
      query = query.order("total_changes", { ascending: false });
    } else if (sortBy === "name") {
      query = query.order("name", { ascending: true });
    } else {
      query = query.order("current_tos_score", {
        ascending: true,
        nullsFirst: false,
      });
    }

    const { data, error } = await query;

    if (error) throw error;

    const companies = (data as MonitoredCompany[]) || [];

    // Compute best and worst
    const withScores = companies.filter((c) => c.current_tos_score !== null);
    const best = [...withScores]
      .sort((a, b) => (b.current_tos_score || 0) - (a.current_tos_score || 0))
      .slice(0, 3);
    const worst = [...withScores]
      .sort((a, b) => (a.current_tos_score || 0) - (b.current_tos_score || 0))
      .slice(0, 3);

    return NextResponse.json({
      companies,
      best,
      worst,
      total: companies.length,
    });
  } catch (error) {
    console.error("[Watchdog API] Leaderboard error:", error);
    return NextResponse.json(
      { error: "Failed to fetch leaderboard" },
      { status: 500 },
    );
  }
}
