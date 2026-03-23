// ============================================
// POST /api/lawchange/impacts/acknowledge
// Mark impact(s) as acknowledged
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
    const { impact_ids, all } = body;

    if (all) {
      // Acknowledge all unacknowledged impacts
      const { error } = await supabase
        .from("law_change_impacts")
        .update({
          user_acknowledged: true,
          acknowledged_at: new Date().toISOString(),
        })
        .eq("user_id", user.id)
        .eq("user_acknowledged", false);

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
    } else if (impact_ids && Array.isArray(impact_ids)) {
      const { error } = await supabase
        .from("law_change_impacts")
        .update({
          user_acknowledged: true,
          acknowledged_at: new Date().toISOString(),
        })
        .in("id", impact_ids)
        .eq("user_id", user.id);

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
    } else {
      return NextResponse.json(
        { error: "Provide impact_ids array or all: true" },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    );
  }
}
