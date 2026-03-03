// ============================================
// BOT ANALYSIS TRIGGER
// Uses waitUntil to keep function alive during analysis
// ============================================

import { NextRequest, NextResponse } from "next/server";
import { analyzeDocument } from "@/lib/core/analyzer";
import { createAdminClient } from "@/lib/supabase/admin";

export const maxDuration = 60;

export async function POST(request: NextRequest) {
  console.log("[ClauseWall] Trigger analysis route called");

  try {
    const body = await request.json();
    console.log("[ClauseWall] Trigger body received:", {
      documentId: body.documentId,
      textLength: body.text?.length,
      documentType: body.documentType,
      jurisdiction: body.jurisdiction,
    });

    const { documentId, text, documentType, jurisdiction } = body;

    if (!documentId || !text) {
      console.error("[ClauseWall] Missing required fields");
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    console.log("[ClauseWall] Creating admin client...");
    const supabase = createAdminClient();
    console.log("[ClauseWall] Admin client created");

    // Update status
    await supabase
      .from("documents")
      .update({ analysis_status: "analyzing" })
      .eq("id", documentId);

    console.log("[ClauseWall] Status updated. Running analysis synchronously...");

    // Run analysis SYNCHRONOUSLY (not in background)
    // maxDuration = 60 gives us 60 seconds
    try {
      await analyzeDocument(documentId, text, documentType, jurisdiction, supabase);
      console.log(`[ClauseWall] ✅ Analysis complete for ${documentId}`);
    } catch (analysisError) {
      console.error(`[ClauseWall] ❌ Analysis failed for ${documentId}:`, analysisError);
      await supabase
        .from("documents")
        .update({
          analysis_status: "failed",
          summary: `Analysis failed: ${(analysisError as Error).message}`,
        })
        .eq("id", documentId);
    }

    return NextResponse.json({
      status: "completed",
      documentId,
    });
  } catch (error) {
    console.error("[ClauseWall] Trigger analysis error:", error);
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    );
  }
}