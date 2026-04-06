// ============================================
// API: GET /api/deliberation/[documentId]
// Fetch stored deliberation data for a document
// ============================================

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { rateLimit, rateLimitResponse } from "@/lib/rate-limit";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ documentId: string }> },
) {
  try {
    const { documentId } = await params;

    if (!documentId) {
      return NextResponse.json(
        { success: false, error: "documentId is required" },
        { status: 400 },
      );
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const rl = await rateLimit(_request, "DB_WRITE", user.id);
    if (!rl.success) return rateLimitResponse(rl);

    const { data: doc, error: docError } = await supabase
      .from("documents")
      .select("deliberation_data")
      .eq("id", documentId)
      .single();

    if (docError || !doc) {
      return NextResponse.json(
        { success: false, error: "Document not found" },
        { status: 404 },
      );
    }

    if (!doc.deliberation_data) {
      return NextResponse.json({
        success: false,
        error: "No deliberation data found for this document",
      });
    }

    return NextResponse.json({
      success: true,
      result: doc.deliberation_data,
    });
  } catch (error) {
    console.error("[ClauseWall] [API] Deliberation fetch failed:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch deliberation data" },
      { status: 500 },
    );
  }
}
