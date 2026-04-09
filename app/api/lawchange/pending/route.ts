// ============================================
// GET /api/lawchange/pending
// Get pending/upcoming law changes
// ============================================

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { safeErrorResponse } from "@/lib/api/error-response";

export async function GET() {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("pending_law_changes")
      .select("*")
      .eq("is_active", true)
      .order("expected_date", { ascending: true });

    if (error) {
      return safeErrorResponse("lawchange-pending", error, "Failed to fetch pending law changes");
    }

    return NextResponse.json({ pending: data || [] });
  } catch (error) {
    return safeErrorResponse("lawchange-pending", error, "Failed to fetch pending law changes");
  }
}
