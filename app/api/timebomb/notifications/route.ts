// ============================================
// GET /api/timebomb/notifications
// Fetch user's deadline notifications
// ============================================

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch notifications
    const { data: notifications, error } = await supabase
      .from("deadline_notifications")
      .select("*")
      .eq("user_id", user.id)
      .order("sent_at", { ascending: false })
      .limit(50);

    if (error) {
      console.error("[TimeBomb API] Notifications fetch error:", error);
      return NextResponse.json(
        { error: "Failed to fetch notifications" },
        { status: 500 },
      );
    }

    // Count unread
    const { count } = await supabase
      .from("deadline_notifications")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("read", false);

    return NextResponse.json({
      notifications: notifications || [],
      unread_count: count || 0,
    });
  } catch (error) {
    console.error("[TimeBomb API] Notifications error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
