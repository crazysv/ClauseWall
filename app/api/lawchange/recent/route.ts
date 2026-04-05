// ============================================
// GET /api/lawchange/recent
// Get recent law changes (public — no auth)
// ============================================

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { safeErrorResponse } from "@/lib/api/error-response";

export async function GET(request: NextRequest) {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    const supabase = createClient(url, key);

    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get("days") || "30", 10);
    const type = searchParams.get("type");
    const jurisdiction = searchParams.get("jurisdiction");

    const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0];

    let query = supabase
      .from("law_changes")
      .select("*", { count: "exact" })
      .gte("date_published", cutoffDate)
      .order("date_published", { ascending: false })
      .limit(50);

    if (type) {
      query = query.eq("change_type", type);
    }

    if (jurisdiction) {
      query = query.contains("affected_jurisdictions", [jurisdiction]);
    }

    const { data, count, error } = await query;

    if (error) {
      return safeErrorResponse("lawchange-recent", error, "Failed to fetch recent law changes");
    }

    return NextResponse.json({
      changes: data || [],
      total: count || 0,
    });
  } catch (error) {
    return safeErrorResponse("lawchange-recent", error, "Failed to fetch recent law changes");
  }
}
