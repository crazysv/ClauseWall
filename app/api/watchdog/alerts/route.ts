// ============================================
// GET/PATCH /api/watchdog/alerts
// User alert management
// ============================================

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { data: alerts, error } = await supabase
      .from("watchdog_alerts")
      .select("*, company:monitored_companies(name, slug, logo_url, sector)")
      .eq("user_id", user.id)
      .order("sent_at", { ascending: false })
      .limit(50);

    if (error) throw error;

    // Get unread count
    const { count } = await supabase
      .from("watchdog_alerts")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("is_read", false);

    return NextResponse.json({
      alerts: alerts || [],
      unread_count: count || 0,
    });
  } catch (error) {
    console.error("[Watchdog API] Alerts GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch alerts" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const body = await request.json();
    const { alert_id, mark_all_read } = body;

    if (mark_all_read) {
      await supabase
        .from("watchdog_alerts")
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq("user_id", user.id)
        .eq("is_read", false);
    } else if (alert_id) {
      await supabase
        .from("watchdog_alerts")
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq("id", alert_id)
        .eq("user_id", user.id);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Watchdog API] Alerts PATCH error:", error);
    return NextResponse.json(
      { error: "Failed to update alerts" },
      { status: 500 }
    );
  }
}
