// ============================================
// POST /api/timebomb/defuse
// Mark a deadline as defused or action taken
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
    const { deadline_id, action } = body as {
      deadline_id: string;
      action: "defused" | "action_taken";
    };

    if (!deadline_id || !action) {
      return NextResponse.json(
        { error: "deadline_id and action are required" },
        { status: 400 },
      );
    }

    if (action !== "defused" && action !== "action_taken") {
      return NextResponse.json(
        { error: "action must be 'defused' or 'action_taken'" },
        { status: 400 },
      );
    }

    // Verify ownership and update
    const { data: deadline, error } = await supabase
      .from("contract_deadlines")
      .update({
        status: action,
        updated_at: new Date().toISOString(),
      })
      .eq("id", deadline_id)
      .eq("user_id", user.id)
      .select("*")
      .single();

    if (error || !deadline) {
      return NextResponse.json(
        { error: "Deadline not found or unauthorized" },
        { status: 404 },
      );
    }

    console.log("[TimeBomb API] Deadline defused:", deadline_id, action);

    return NextResponse.json({ deadline });
  } catch (error) {
    console.error("[TimeBomb API] Defuse error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
