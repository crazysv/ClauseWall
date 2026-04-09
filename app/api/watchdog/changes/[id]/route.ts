// ============================================
// GET /api/watchdog/changes/[id]
// Single change detail with full diff
// ============================================

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { safeErrorResponse } from "@/lib/api/error-response";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    const { data: change, error } = await supabase
      .from("tos_changes")
      .select("*, company:monitored_companies(*)")
      .eq("id", id)
      .single();

    if (error || !change) {
      return NextResponse.json({ error: "Change not found" }, { status: 404 });
    }

    // Get old and new snapshots for full text comparison
    let oldSnapshot = null;
    let newSnapshot = null;

    if (change.old_snapshot_id) {
      const { data } = await supabase
        .from("tos_snapshots")
        .select("clean_text, version_number, scraped_at")
        .eq("id", change.old_snapshot_id)
        .single();
      oldSnapshot = data;
    }

    if (change.new_snapshot_id) {
      const { data } = await supabase
        .from("tos_snapshots")
        .select("clean_text, version_number, scraped_at")
        .eq("id", change.new_snapshot_id)
        .single();
      newSnapshot = data;
    }

    return NextResponse.json({
      change,
      old_snapshot: oldSnapshot,
      new_snapshot: newSnapshot,
    });
  } catch (error) {
    return safeErrorResponse("watchdog-change-detail", error, "Failed to fetch change details");
  }
}
