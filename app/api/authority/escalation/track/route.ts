// ============================================
// POST /api/authority/escalation/track — Track Escalation
// ============================================

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { id, current_step, status, steps } = body;
    const supabase = await createClient();

    if (id) {
      // Update existing tracking
      const { data, error } = await supabase
        .from("escalation_tracking")
        .update({
          current_step,
          status: status || "active",
          steps,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return NextResponse.json({ success: true, tracking: data });
    } else {
      // Create new tracking
      const { data, error } = await supabase
        .from("escalation_tracking")
        .insert({
          user_id: body.user_id || "00000000-0000-0000-0000-000000000000",
          document_id: body.document_id || null,
          current_step: current_step || 1,
          steps: steps || [],
          status: "active",
        })
        .select()
        .single();

      if (error) throw error;
      return NextResponse.json({ success: true, tracking: data });
    }
  } catch (error) {
    console.error("[ClauseWall] Escalation tracking failed:", error);
    return NextResponse.json(
      { success: false, error: "Tracking update failed" },
      { status: 500 },
    );
  }
}
