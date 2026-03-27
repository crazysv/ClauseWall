// ============================================
// POST /api/authority/report-issue — Report Incorrect Info
// ============================================

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { authority_id, issue_type, description, suggested_correction } = body;

    if (!authority_id || !issue_type || !description) {
      return NextResponse.json(
        { success: false, error: "Missing required fields: authority_id, issue_type, description" },
        { status: 400 }
      );
    }

    // Store in Supabase (best-effort — will create table if needed)
    try {
      const supabase = await createClient();
      await supabase.from("authority_issue_reports").insert({
        authority_id,
        issue_type,
        description,
        suggested_correction: suggested_correction || null,
        created_at: new Date().toISOString(),
      });
    } catch {
      // Table might not exist yet — log it instead
      console.warn("[ClauseWall] Issue report (no table):", { authority_id, issue_type, description });
    }

    return NextResponse.json({
      success: true,
      message: "Thank you for reporting. We will review and update the information.",
    });
  } catch (error) {
    console.error("[ClauseWall] Report issue failed:", error);
    return NextResponse.json(
      { success: false, error: "Report submission failed" },
      { status: 500 }
    );
  }
}
