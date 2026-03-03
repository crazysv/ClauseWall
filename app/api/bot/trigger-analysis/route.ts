// ============================================
// BOT ANALYSIS TRIGGER
// Separate serverless function for full hybrid analysis
// Called by bot handler via HTTP — gets own 60s timeout
// ============================================

import { NextRequest, NextResponse } from "next/server";
import { analyzeDocument } from "@/lib/core/analyzer";
import { createAdminClient } from "@/lib/supabase/admin";

export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    const { documentId, text, documentType, jurisdiction } =
      await request.json();

    if (!documentId || !text) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // Update status to analyzing
    await supabase
      .from("documents")
      .update({ analysis_status: "analyzing" })
      .eq("id", documentId);

    // Return immediately — analysis runs in background
    // The function stays alive for up to 60s (maxDuration)
    analyzeDocument(documentId, text, documentType, jurisdiction, supabase)
      .then(() => {
        console.log(
          `[ClauseWall] Bot full analysis complete: ${documentId}`
        );
      })
      .catch(async (err) => {
        console.error(
          `[ClauseWall] Bot full analysis failed: ${documentId}`,
          err
        );
        await supabase
          .from("documents")
          .update({
            analysis_status: "failed",
            summary: `Analysis failed: ${(err as Error).message}`,
          })
          .eq("id", documentId);
      });

    return NextResponse.json({
      status: "analyzing",
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