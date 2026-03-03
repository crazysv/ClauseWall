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

    // Update status to analyzing
    const { error: updateError } = await supabase
      .from("documents")
      .update({ analysis_status: "analyzing" })
      .eq("id", documentId);

    if (updateError) {
      console.error("[ClauseWall] Failed to update status:", updateError);
    } else {
      console.log("[ClauseWall] Status updated to analyzing");
    }

    // Start analysis in background
    console.log("[ClauseWall] Starting background analysis...");
    analyzeDocument(documentId, text, documentType, jurisdiction, supabase)
      .then(() => {
        console.log(`[ClauseWall] Bot full analysis complete: ${documentId}`);
      })
      .catch(async (err) => {
        console.error(`[ClauseWall] Bot full analysis failed: ${documentId}`, err);
        await supabase
          .from("documents")
          .update({
            analysis_status: "failed",
            summary: `Analysis failed: ${(err as Error).message}`,
          })
          .eq("id", documentId);
      });

    console.log("[ClauseWall] Returning 200 response");
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