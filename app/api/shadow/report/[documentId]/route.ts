// ============================================
// SHADOW ANALYSIS — PDF REPORT DOWNLOAD
// GET: Generate or fetch the report PDF
// ============================================

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ documentId: string }> },
) {
  try {
    const { documentId } = await params;
    const supabase = await createClient();

    // Authenticate
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch analysis
    const { data, error } = await supabase
      .from("shadow_analyses")
      .select("*")
      .eq("document_id", documentId)
      .eq("user_id", user.id)
      .single();

    if (error || !data) {
      return NextResponse.json(
        { error: "No shadow analysis found" },
        { status: 404 },
      );
    }

    // If report_url exists, redirect
    if (data.report_url) {
      return NextResponse.json({ report_url: data.report_url });
    }

    // Report is generated client-side using jsPDF
    // Return the analysis data for client-side PDF generation
    return NextResponse.json({
      analysis: data,
      message: "Use client-side PDF generation with this data",
    });
  } catch (error: unknown) {
    console.error("[ClauseWall] Shadow report GET error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to fetch report";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
