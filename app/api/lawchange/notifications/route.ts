// ============================================
// GET /api/lawchange/notifications
// Get law change notifications for current user
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

    const { data: notifications, error } = await supabase
      .from("law_change_notifications")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) {
      return safeErrorResponse("lawchange-notifications", error, "Failed to fetch law change notifications");
    }

    const unreadCount = (notifications || []).filter(
      (n: any) => !n.read,
    ).length;

    return NextResponse.json({
      notifications: notifications || [],
      unread_count: unreadCount,
    });
  } catch (error) {
    return safeErrorResponse("lawchange-notifications", error, "Failed to fetch law change notifications");
  }
}
