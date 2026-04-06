// ============================================
// GET /api/collective/notifications — User Notifications
// ============================================

import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 },
      );
    }

    const { searchParams } = new URL(request.url);
    const unreadOnly = searchParams.get("unreadOnly") === "true";

    const adminSupabase = createAdminClient();
    let query = adminSupabase
      .from("collective_notifications")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(50);

    if (unreadOnly) {
      query = query.eq("read", false);
    }

    const { data: notifications, error } = await query;

    if (error) throw error;

    // Also get unread count
    const { count } = await adminSupabase
      .from("collective_notifications")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("read", false);

    return NextResponse.json({
      notifications: notifications || [],
      unread_count: count || 0,
    });
  } catch (error) {
    console.error("[ClauseWall] [API] Notifications error:", error);
    return NextResponse.json(
      { error: "Failed to fetch notifications" },
      { status: 500 },
    );
  }
}

// Mark notifications as read
export async function PATCH(request: NextRequest) {
  try {
    
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 },
      );
    }

    const body = await request.json();
    const { notificationIds } = body;

    const adminSupabase = createAdminClient();

    if (notificationIds && Array.isArray(notificationIds)) {
      await adminSupabase
        .from("collective_notifications")
        .update({ read: true })
        .in("id", notificationIds)
        .eq("user_id", user.id);
    } else {
      // Mark all as read
      await adminSupabase
        .from("collective_notifications")
        .update({ read: true })
        .eq("user_id", user.id)
        .eq("read", false);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[ClauseWall] [API] Mark read error:", error);
    return NextResponse.json(
      { error: "Failed to update notifications" },
      { status: 500 },
    );
  }
}
