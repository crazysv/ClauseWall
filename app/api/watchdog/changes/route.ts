// ============================================
// GET /api/watchdog/changes
// Recent changes feed (filterable)
// ============================================

import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { TosChangeWithCompany } from "@/types";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get("company_id");
    const severity = searchParams.get("severity");
    const limit = parseInt(searchParams.get("limit") || "20");

    const supabase = createAdminClient();

    let query = supabase
      .from("tos_changes")
      .select("*, company:monitored_companies(*)")
      .eq("is_published", true)
      .order("detected_at", { ascending: false })
      .limit(Math.min(limit, 50));

    if (companyId) query = query.eq("company_id", companyId);
    if (severity === "critical") query = query.gt("critical_count", 0);
    if (severity === "major") query = query.gt("major_count", 0);

    const { data, error } = await query;

    if (error) throw error;

    return NextResponse.json({
      changes: (data as TosChangeWithCompany[]) || [],
    });
  } catch (error) {
    console.error("[Watchdog API] Changes feed error:", error);
    return NextResponse.json(
      { error: "Failed to fetch changes" },
      { status: 500 },
    );
  }
}
