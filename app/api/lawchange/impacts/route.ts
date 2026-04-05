// ============================================
// GET /api/lawchange/impacts
// Get law change impacts for the current user
// ============================================

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { safeErrorResponse } from "@/lib/api/error-response";

export async function GET() {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: impacts, error } = await supabase
      .from("law_change_impacts")
      .select("*, law_changes!inner(*)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) {
      return safeErrorResponse("lawchange-impacts", error, "Failed to fetch law change impacts");
    }

    // Transform for frontend
    const formatted = (impacts || []).map((impact: any) => ({
      ...impact,
      change: impact.law_changes,
      law_changes: undefined,
    }));

    const unacknowledged = formatted.filter(
      (i: any) => !i.user_acknowledged,
    ).length;

    return NextResponse.json({
      impacts: formatted,
      unacknowledged,
    });
  } catch (error) {
    return safeErrorResponse("lawchange-impacts", error, "Failed to fetch law change impacts");
  }
}
