// ============================================
// GET & POST /api/timebomb/reminder-settings
// User notification preferences
// ============================================

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { DeadlineReminderSettings } from "@/types";

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: settings } = await supabase
      .from("deadline_reminder_settings")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (!settings) {
      // Return defaults
      const defaults: DeadlineReminderSettings = {
        user_id: user.id,
        telegram_chat_id: null,
        telegram_enabled: false,
        email_enabled: true,
        push_enabled: false,
        push_subscription: null,
        in_app_enabled: true,
        reminder_time: "08:00",
        timezone: "Asia/Kolkata",
      };
      return NextResponse.json({ settings: defaults });
    }

    return NextResponse.json({ settings });
  } catch (error) {
    console.error("[TimeBomb API] Reminder settings GET error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    // Build upsert data — only include fields that were provided
    const upsertData: Record<string, unknown> = {
      user_id: user.id,
      updated_at: new Date().toISOString(),
    };

    if (body.telegram_enabled !== undefined)
      upsertData.telegram_enabled = Boolean(body.telegram_enabled);
    if (body.email_enabled !== undefined)
      upsertData.email_enabled = Boolean(body.email_enabled);
    if (body.push_enabled !== undefined)
      upsertData.push_enabled = Boolean(body.push_enabled);
    if (body.in_app_enabled !== undefined)
      upsertData.in_app_enabled = Boolean(body.in_app_enabled);
    if (body.reminder_time !== undefined)
      upsertData.reminder_time = String(body.reminder_time);
    if (body.timezone !== undefined)
      upsertData.timezone = String(body.timezone);
    if (body.push_subscription !== undefined)
      upsertData.push_subscription = body.push_subscription;
    if (body.telegram_chat_id !== undefined)
      upsertData.telegram_chat_id = body.telegram_chat_id;

    const { data: settings, error } = await supabase
      .from("deadline_reminder_settings")
      .upsert(upsertData, { onConflict: "user_id" })
      .select("*")
      .single();

    if (error) {
      console.error("[TimeBomb API] Reminder settings upsert error:", error);
      return NextResponse.json(
        { error: "Failed to save settings" },
        { status: 500 },
      );
    }

    return NextResponse.json({ settings });
  } catch (error) {
    console.error("[TimeBomb API] Reminder settings POST error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
