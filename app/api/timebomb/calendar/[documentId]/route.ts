// ============================================
// GET /api/timebomb/calendar/[documentId]
// Download ICS calendar file for deadlines
// ============================================

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateICSFile } from "@/lib/timebomb/ics-generator";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ documentId: string }> }
) {
  try {
    const { documentId } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch active deadlines
    const { data: deadlines, error } = await supabase
      .from("contract_deadlines")
      .select("*")
      .eq("document_id", documentId)
      .eq("user_id", user.id)
      .not("status", "in", '("defused","expired","missed")')
      .order("deadline_date", { ascending: true });

    if (error) {
      console.error("[TimeBomb API] Calendar fetch error:", error);
      return NextResponse.json(
        { error: "Failed to fetch deadlines" },
        { status: 500 }
      );
    }

    if (!deadlines || deadlines.length === 0) {
      return NextResponse.json(
        { error: "No active deadlines found" },
        { status: 404 }
      );
    }

    // Get document title
    const { data: doc } = await supabase
      .from("documents")
      .select("original_filename, document_type")
      .eq("id", documentId)
      .single();

    const title = doc?.original_filename || doc?.document_type || "Contract";

    // Generate ICS
    const icsContent = generateICSFile(deadlines, title);
    const shortId = documentId.slice(0, 8);

    return new NextResponse(icsContent, {
      status: 200,
      headers: {
        "Content-Type": "text/calendar; charset=utf-8",
        "Content-Disposition": `attachment; filename="clausewall-deadlines-${shortId}.ics"`,
      },
    });
  } catch (error) {
    console.error("[TimeBomb API] Calendar error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
