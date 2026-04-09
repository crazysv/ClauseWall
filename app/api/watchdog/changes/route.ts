// ============================================
// GET /api/watchdog/changes
// Recent changes feed (filterable)
// ============================================

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { safeErrorResponse } from "@/lib/api/error-response";
import type { TosChangeWithCompany } from "@/types";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get("company_id");
    const severity = searchParams.get("severity");
    const limit = parseInt(searchParams.get("limit") || "20");

    const supabase = await createClient();

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

    if (error) {
      return safeErrorResponse("watchdog-changes", error, "Failed to fetch changes");
    }

    return NextResponse.json({
      changes: (data as TosChangeWithCompany[]) || [],
    });
  } catch (error) {
    return safeErrorResponse("watchdog-changes", error, "Failed to fetch changes");
  }
}
