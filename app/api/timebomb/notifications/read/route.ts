// ============================================
// POST /api/timebomb/notifications/read
// Mark notifications as read
// ============================================

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { notification_ids, all } = body as {
      notification_ids?: string[];
      all?: boolean;
    };

    if (all) {
      const { error } = await supabase
        .from("deadline_notifications")
        .update({ read: true })
        .eq("user_id", user.id)
        .eq("read", false);

      if (error) {
        console.error("[TimeBomb API] Mark all read error:", error);
        return NextResponse.json(
          { error: "Failed to mark notifications as read" },
          { status: 500 }
        );
      }
    } else if (notification_ids && notification_ids.length > 0) {
      const { error } = await supabase
        .from("deadline_notifications")
        .update({ read: true })
        .in("id", notification_ids)
        .eq("user_id", user.id);

      if (error) {
        console.error("[TimeBomb API] Mark read error:", error);
        return NextResponse.json(
          { error: "Failed to mark notifications as read" },
          { status: 500 }
        );
      }
    } else {
      return NextResponse.json(
        { error: "Provide notification_ids array or all: true" },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[TimeBomb API] Read notifications error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
