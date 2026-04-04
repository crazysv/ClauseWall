// ============================================
// GET /api/lawchange/summary
// Get law change summary for current user
// ============================================

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdmin } from "@supabase/supabase-js";

export async function GET() {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Use admin client for law_changes (no RLS)
    const adminUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const adminKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    const admin = createAdmin(adminUrl, adminKey);

    // Count total law changes
    const { count: totalChanges } = await admin
      .from("law_changes")
      .select("*", { count: "exact", head: true });

    // Count changes this week
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0];
    const { count: changesThisWeek } = await admin
      .from("law_changes")
      .select("*", { count: "exact", head: true })
      .gte("date_published", weekAgo);

    // Count changes this month
    const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0];
    const { count: changesThisMonth } = await admin
      .from("law_changes")
      .select("*", { count: "exact", head: true })
      .gte("date_published", monthAgo);

    // Count affected contracts (user's docs with impacts)
    const { count: affectedContracts } = await supabase
      .from("law_change_impacts")
      .select("document_id", { count: "exact", head: true })
      .eq("user_id", user.id);

    // Count unacknowledged
    const { count: unacknowledged } = await supabase
      .from("law_change_impacts")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("user_acknowledged", false);

    // Latest 5 changes
    const { data: latestChanges } = await admin
      .from("law_changes")
      .select("*")
      .order("date_published", { ascending: false })
      .limit(5);

    // Pending impacts (unacknowledged)
    const { data: pendingImpacts } = await supabase
      .from("law_change_impacts")
      .select("*")
      .eq("user_id", user.id)
      .eq("user_acknowledged", false)
      .order("created_at", { ascending: false })
      .limit(10);

    return NextResponse.json({
      total_changes_monitored: totalChanges || 0,
      changes_this_week: changesThisWeek || 0,
      changes_this_month: changesThisMonth || 0,
      affected_contracts: affectedContracts || 0,
      unacknowledged_impacts: unacknowledged || 0,
      latest_changes: latestChanges || [],
      pending_impacts: pendingImpacts || [],
    });
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 },
    );
  }
}
