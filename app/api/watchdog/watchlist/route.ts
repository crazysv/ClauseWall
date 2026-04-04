// ============================================
// GET/POST/DELETE /api/watchdog/watchlist
// User watchlist management
// ============================================

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { UserWatchlistEntry } from "@/types";

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { data, error } = await supabase
      .from("user_watchlist")
      .select("*, company:monitored_companies(*)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) throw error;

    return NextResponse.json({ watchlist: data || [] });
  } catch (error) {
    console.error("[Watchdog API] Watchlist GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch watchlist" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const body = await request.json();
    const {
      company_id,
      alert_email,
      alert_telegram,
      alert_inapp,
      sensitivity,
      telegram_chat_id,
    } = body;

    if (!company_id) {
      return NextResponse.json(
        { error: "company_id required" },
        { status: 400 },
      );
    }

    const { data, error } = await supabase
      .from("user_watchlist")
      .upsert(
        {
          user_id: user.id,
          company_id,
          alert_email: alert_email ?? true,
          alert_telegram: alert_telegram ?? false,
          alert_inapp: alert_inapp ?? true,
          sensitivity: sensitivity ?? "major_and_critical",
          telegram_chat_id: telegram_chat_id ?? null,
        },
        { onConflict: "user_id,company_id" },
      )
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ entry: data as UserWatchlistEntry });
  } catch (error) {
    console.error("[Watchdog API] Watchlist POST error:", error);
    return NextResponse.json(
      { error: "Failed to update watchlist" },
      { status: 500 },
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get("company_id");

    if (!companyId) {
      return NextResponse.json(
        { error: "company_id required" },
        { status: 400 },
      );
    }

    const { error } = await supabase
      .from("user_watchlist")
      .delete()
      .eq("user_id", user.id)
      .eq("company_id", companyId);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Watchdog API] Watchlist DELETE error:", error);
    return NextResponse.json(
      { error: "Failed to remove from watchlist" },
      { status: 500 },
    );
  }
}
